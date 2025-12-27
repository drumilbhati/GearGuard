package handlers

import (
	"encoding/json"
	"net/http"

	"gearguard/internal/database"
	"gearguard/internal/models"
)

// CreateTeam creates a new maintenance team
func CreateTeam(w http.ResponseWriter, r *http.Request) {
	var team models.MaintenanceTeam
	if err := json.NewDecoder(r.Body).Decode(&team); err != nil {
		RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	if result := database.DB.Create(&team); result.Error != nil {
		RespondError(w, http.StatusInternalServerError, result.Error.Error())
		return
	}

	RespondJSON(w, http.StatusCreated, team)
}

// GetTeams lists all teams with their members
func GetTeams(w http.ResponseWriter, r *http.Request) {
	var teams []models.MaintenanceTeam
	if result := database.DB.Preload("Members").Find(&teams); result.Error != nil {
		RespondError(w, http.StatusInternalServerError, result.Error.Error())
		return
	}

	RespondJSON(w, http.StatusOK, teams)
}
