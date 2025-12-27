package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"gearguard/internal/database"
	"gearguard/internal/models"
	"gearguard/internal/services"
	"gearguard/internal/utils"

	"github.com/gorilla/mux"
)

// CreateRequest creates a new maintenance request with auto-fill logic
func CreateRequest(w http.ResponseWriter, r *http.Request) {
	var req models.MaintenanceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		utils.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Get User ID from Context
	userID, ok := r.Context().Value(utils.UserIDKey).(uint)
	if ok {
		req.CreatedByID = userID
	}

	// Fetch Equipment to Auto-Fill Team
	var equipment models.Equipment
	if result := database.DB.First(&equipment, req.EquipmentID); result.Error != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid Equipment ID")
		return
	}

	// BUSINESS RULE: Breakdown (Corrective) requests can only be made by the assigned Employee
	if req.Type == models.TypeCorrective {
		// Log for debugging
		// println("Debug: Request Type Corrective. User:", req.CreatedByID, "Owner:", equipment.EmployeeID)
		
		if equipment.EmployeeID == nil {
			// If equipment has NO owner, maybe Managers can report? Or no one?
			// Let's assume for now unassigned equipment can be reported by Managers/Technicians.
			// But if it HAS an owner, it must match.
		} else {
			if *equipment.EmployeeID != req.CreatedByID {
				utils.RespondError(w, http.StatusForbidden, "Only the assigned employee (owner) can report breakdowns for this equipment")
				return
			}
		}
	}

	// Auto-Fill Logic: Assign Team from Equipment
	req.TeamID = equipment.MaintenanceTeamID
	req.Status = models.StatusNew // Default status

	// Auto-Assign Technician if default exists on equipment
	if equipment.DefaultTechnicianID != nil {
		req.TechnicianID = equipment.DefaultTechnicianID
	}

	if result := database.DB.Create(&req); result.Error != nil {
		utils.RespondError(w, http.StatusInternalServerError, result.Error.Error())
		return
	}

	// --- Email Notification Logic ---
	// 1. Fetch Creator Email
	var creator models.User
	if req.CreatedByID != 0 {
		database.DB.First(&creator, req.CreatedByID)
	}

	// 2. Fetch Technician Email (if assigned)
	var techEmail string
	if req.TechnicianID != nil {
		var tech models.User
		database.DB.First(&tech, *req.TechnicianID)
		techEmail = tech.Email
	}

	// 3. Send Emails (Async)
	services.SendNewRequestNotification(techEmail, creator.Email, req.Subject, equipment.Name)

	utils.RespondJSON(w, http.StatusCreated, req)
}

// UpdateRequest updates a request and handles Scrap logic
func UpdateRequest(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars["id"])

	// Get User from Context
	userID, _ := r.Context().Value(utils.UserIDKey).(uint)
	var user models.User
	database.DB.First(&user, userID)

	var req models.MaintenanceRequest
	if result := database.DB.Preload("Equipment").First(&req, id); result.Error != nil {
		utils.RespondError(w, http.StatusNotFound, "Request not found")
		return
	}

	// Decode update payload
	var updateData models.MaintenanceRequest
	if err := json.NewDecoder(r.Body).Decode(&updateData); err != nil {
		utils.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	// BUSINESS LOGIC: Self-assignment if moving from New to In Progress
	if req.Status == models.StatusNew && updateData.Status == models.StatusInProgress {
		if req.TechnicianID == nil && user.Role == "Technician" {
			// Technician is picking up an unassigned ticket
			req.TechnicianID = &userID
		}
	}

	// RBAC: Only assigned technician or Manager can update status beyond "New"
	if user.Role == "Technician" && req.TechnicianID != nil && *req.TechnicianID != userID {
		utils.RespondError(w, http.StatusForbidden, "You can only update requests assigned to you")
		return
	}

	// Apply updates
	if updateData.Status != "" {
		req.Status = updateData.Status
	}
	if updateData.TechnicianID != nil {
		req.TechnicianID = updateData.TechnicianID
	}
	if updateData.DurationHours != 0 {
		req.DurationHours = updateData.DurationHours
	}
	if updateData.ScheduledDate != nil {
		req.ScheduledDate = updateData.ScheduledDate
	}
	
	// Scrap Logic: If moving to Scrap, mark equipment as unusable
	if req.Status == models.StatusScrap {
		req.Equipment.IsUsable = false
		if result := database.DB.Save(&req.Equipment); result.Error == nil {
			println("DEBUG: Equipment", req.Equipment.ID, "marked as SCRAPPED (Unusable)")
		}
	}

	if result := database.DB.Save(&req); result.Error != nil {
		utils.RespondError(w, http.StatusInternalServerError, result.Error.Error())
		return
	}

	utils.RespondJSON(w, http.StatusOK, req)
}

// GetRequests retrieves requests with optional filtering
func GetRequests(w http.ResponseWriter, r *http.Request) {
	// Get User ID from Context
	userID, ok := r.Context().Value(utils.UserIDKey).(uint)
	if !ok {
		utils.RespondError(w, http.StatusUnauthorized, "User ID not found in context")
		return
	}

	// Fetch User to check Role
	var user models.User
	if result := database.DB.First(&user, userID); result.Error != nil {
		println("DEBUG: User not found for ID:", userID)
		utils.RespondError(w, http.StatusUnauthorized, "User not found")
		return
	}

	println("DEBUG: Request fetch for User:", user.Name, "Role:", user.Role, "ID:", user.ID)

	query := database.DB.Preload("Equipment").Preload("Team").Preload("Technician")

	// ROLE BASED ACCESS CONTROL
	if user.Role == "Employee" {
		// Employees see requests they created OR requests for equipment they own
		var equipmentIDs []uint
		database.DB.Model(&models.Equipment{}).Where("employee_id = ?", userID).Pluck("id", &equipmentIDs)
		
		if len(equipmentIDs) > 0 {
			query = query.Where("created_by_id = ? OR equipment_id IN ?", userID, equipmentIDs)
		} else {
			query = query.Where("created_by_id = ?", userID)
		}
	} else if user.Role == "Technician" {
		// Technicians see ONLY requests for equipment where they are the Default Technician
		var equipmentIDs []uint
		database.DB.Model(&models.Equipment{}).Where("default_technician_id = ?", userID).Pluck("id", &equipmentIDs)
		
		if len(equipmentIDs) > 0 {
			query = query.Where("equipment_id IN ?", equipmentIDs)
		} else {
			// If no equipment assigned, they see nothing
			query = query.Where("1 = 0")
		}
	}
	// Managers see ALL requests (no filter added)

	// Filter by Status (Kanban columns)
	status := r.URL.Query().Get("status")
	if status != "" {
		query = query.Where("status = ?", status)
	}

	// Filter by Type (e.g., Preventive for Calendar)
	reqType := r.URL.Query().Get("type")
	if reqType != "" {
		query = query.Where("type = ?", reqType)
	}
	
	// Filter by Date (Calendar View) - simplified for "on this date"
	dateStr := r.URL.Query().Get("date")
	if dateStr != "" {
		// Assuming dateStr is YYYY-MM-DD
		parsedDate, err := time.Parse("2006-01-02", dateStr)
		if err == nil {
			// Find requests scheduled for this day (ignoring time)
			nextDay := parsedDate.Add(24 * time.Hour)
			query = query.Where("scheduled_date >= ? AND scheduled_date < ?", parsedDate, nextDay)
		}
	}

	var requests []models.MaintenanceRequest
	if result := query.Find(&requests); result.Error != nil {
		utils.RespondError(w, http.StatusInternalServerError, result.Error.Error())
		return
	}

	utils.RespondJSON(w, http.StatusOK, requests)
}
