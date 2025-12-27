package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"gearguard/internal/database"
	"gearguard/internal/models"

	"github.com/gorilla/mux"
)

// CreateEquipment creates a new equipment record
func CreateEquipment(w http.ResponseWriter, r *http.Request) {
	var equipment models.Equipment
	if err := json.NewDecoder(r.Body).Decode(&equipment); err != nil {
		RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	// Validate MaintenanceTeamID exists
	var team models.MaintenanceTeam
	if result := database.DB.First(&team, equipment.MaintenanceTeamID); result.Error != nil {
		RespondError(w, http.StatusBadRequest, "Invalid Maintenance Team ID")
		return
	}

	if result := database.DB.Create(&equipment); result.Error != nil {
		RespondError(w, http.StatusInternalServerError, result.Error.Error())
		return
	}

	RespondJSON(w, http.StatusCreated, equipment)
}

// GetEquipment lists all equipment
func GetEquipment(w http.ResponseWriter, r *http.Request) {
	var equipment []models.Equipment
	if result := database.DB.Preload("MaintenanceTeam").Find(&equipment); result.Error != nil {
		RespondError(w, http.StatusInternalServerError, result.Error.Error())
		return
	}

	RespondJSON(w, http.StatusOK, equipment)
}

// GetEquipmentRequests returns all requests for a specific equipment (Smart Button logic)
func GetEquipmentRequests(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars["id"])

	var requests []models.MaintenanceRequest
	if result := database.DB.Where("equipment_id = ?", id).Find(&requests); result.Error != nil {
		RespondError(w, http.StatusInternalServerError, result.Error.Error())
		return
	}
	
	RespondJSON(w, http.StatusOK, requests)
}
