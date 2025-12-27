package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"gearguard/internal/database"
	"gearguard/internal/models"
	"gearguard/internal/utils"

	"github.com/gorilla/mux"
)

// CreateEquipment creates a new equipment record
func CreateEquipment(w http.ResponseWriter, r *http.Request) {
	var equipment models.Equipment
	if err := json.NewDecoder(r.Body).Decode(&equipment); err != nil {
		utils.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Validate MaintenanceTeamID exists
	var team models.MaintenanceTeam
	if result := database.DB.First(&team, equipment.MaintenanceTeamID); result.Error != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid Maintenance Team ID")
		return
	}

	if result := database.DB.Create(&equipment); result.Error != nil {
		utils.RespondError(w, http.StatusInternalServerError, result.Error.Error())
		return
	}

	utils.RespondJSON(w, http.StatusCreated, equipment)
}

// GetEquipment lists all equipment
func GetEquipment(w http.ResponseWriter, r *http.Request) {
	// Get User ID from Context
	userID, ok := r.Context().Value(utils.UserIDKey).(uint)
	if !ok {
		utils.RespondError(w, http.StatusUnauthorized, "User ID not found in context")
		return
	}

	// Fetch User to check Role
	var user models.User
	if result := database.DB.First(&user, userID); result.Error != nil {
		println("DEBUG: Equipment fetch - User not found:", userID)
		utils.RespondError(w, http.StatusUnauthorized, "User not found")
		return
	}

	println("DEBUG: Equipment fetch for User:", user.Name, "Role:", user.Role)

	query := database.DB.Preload("MaintenanceTeam").Preload("Employee").Preload("DefaultTechnician")

	// Filter: Employees see owned equipment, Technicians see equipment where they are default
	if user.Role == "Employee" {
		query = query.Where("employee_id = ?", userID)
	} else if user.Role == "Technician" {
		query = query.Where("default_technician_id = ?", userID)
		println("DEBUG: Filtering equipment for Technician ID:", userID)
	}

	// Search Filter: Name or Department
	search := r.URL.Query().Get("search")
	if search != "" {
		searchTerm := "%" + search + "%"
		// Use a grouped condition to avoid messing up the EmployeeID filter
		// (employee_id = X) AND (name LIKE %Y% OR department LIKE %Y%)
		query = query.Where(database.DB.Where("name ILIKE ?", searchTerm).Or("department ILIKE ?", searchTerm))
	}

	var equipment []models.Equipment
	if result := query.Find(&equipment); result.Error != nil {
		utils.RespondError(w, http.StatusInternalServerError, result.Error.Error())
		return
	}

	utils.RespondJSON(w, http.StatusOK, equipment)
}

// GetEquipmentRequests returns all requests for a specific equipment (Smart Button logic)
func GetEquipmentRequests(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars["id"])

	var requests []models.MaintenanceRequest
	if result := database.DB.Where("equipment_id = ?", id).Find(&requests); result.Error != nil {
		utils.RespondError(w, http.StatusInternalServerError, result.Error.Error())
		return
	}
	
	utils.RespondJSON(w, http.StatusOK, requests)
}
