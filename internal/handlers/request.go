package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"gearguard/internal/database"
	"gearguard/internal/models"

	"github.com/gorilla/mux"
)

// CreateRequest creates a new maintenance request with auto-fill logic
func CreateRequest(w http.ResponseWriter, r *http.Request) {
	var req models.MaintenanceRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Fetch Equipment to Auto-Fill Team
	var equipment models.Equipment
	if result := database.DB.First(&equipment, req.EquipmentID); result.Error != nil {
		RespondError(w, http.StatusBadRequest, "Invalid Equipment ID")
		return
	}

	// Auto-Fill Logic: Assign Team from Equipment
	req.TeamID = equipment.MaintenanceTeamID
	req.Status = models.StatusNew // Default status

	if result := database.DB.Create(&req); result.Error != nil {
		RespondError(w, http.StatusInternalServerError, result.Error.Error())
		return
	}

	RespondJSON(w, http.StatusCreated, req)
}

// UpdateRequest updates a request and handles Scrap logic
func UpdateRequest(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars["id"])

	var req models.MaintenanceRequest
	if result := database.DB.First(&req, id); result.Error != nil {
		RespondError(w, http.StatusNotFound, "Request not found")
		return
	}

	// Decode update payload
	var updateData models.MaintenanceRequest
	if err := json.NewDecoder(r.Body).Decode(&updateData); err != nil {
		RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Apply updates (Status, Technician, Duration, etc.)
	// Note: In a real app, use specific fields or a patch map to avoid zero-value overwrites. 
	// For this prototype, we'll manually check/update key fields.

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
		var equipment models.Equipment
		if result := database.DB.First(&equipment, req.EquipmentID); result.Error == nil {
			equipment.IsUsable = false
			database.DB.Save(&equipment)
		}
	}

	if result := database.DB.Save(&req); result.Error != nil {
		RespondError(w, http.StatusInternalServerError, result.Error.Error())
		return
	}

	RespondJSON(w, http.StatusOK, req)
}

// GetRequests retrieves requests with optional filtering
func GetRequests(w http.ResponseWriter, r *http.Request) {
	query := database.DB.Preload("Equipment").Preload("Team").Preload("Technician")

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
		RespondError(w, http.StatusInternalServerError, result.Error.Error())
		return
	}

	RespondJSON(w, http.StatusOK, requests)
}
