package handlers

import (
	"net/http"
	"time"

	"gearguard/internal/database"
	"gearguard/internal/models"
	"gearguard/internal/utils"
)

type DashboardStats struct {
	TotalEquipment    int64   `json:"total_equipment"`
	CriticalEquipment int64   `json:"critical_equipment"`
	OpenRequests      int64   `json:"open_requests"`
	OverdueRequests   int64   `json:"overdue_requests"`
	TechnicianCount   int64   `json:"technician_count"`
	UtilizationRate   float64 `json:"utilization_rate"`
}

func GetDashboardStats(w http.ResponseWriter, r *http.Request) {
	var stats DashboardStats

	// 1. Total Equipment
	database.DB.Model(&models.Equipment{}).Count(&stats.TotalEquipment)

	// 2. Critical Equipment (Scrapped/Unusable)
	database.DB.Model(&models.Equipment{}).Where("is_usable = ?", false).Count(&stats.CriticalEquipment)

	// 3. Open Requests (New or In Progress)
	database.DB.Model(&models.MaintenanceRequest{}).Where("status IN ?", []string{"New", "In Progress"}).Count(&stats.OpenRequests)

	// 4. Overdue Requests
	database.DB.Model(&models.MaintenanceRequest{}).
		Where("scheduled_date < ? AND status NOT IN ?", time.Now(), []string{"Repaired", "Scrap"}).
		Count(&stats.OverdueRequests)
	
	// 5. Technician Load & Utilization
	// Count Technicians
	database.DB.Model(&models.User{}).Where("role = ?", "Technician").Count(&stats.TechnicianCount)
	
	// Calculate Utilization: (Open Requests / (Technicians * MaxCapacity)) * 100
	// We assume a theoretical max capacity of 5 active tickets per technician.
	const MaxRequestsPerTech = 5
	capacity := stats.TechnicianCount * MaxRequestsPerTech

	if capacity > 0 {
		stats.UtilizationRate = (float64(stats.OpenRequests) / float64(capacity)) * 100
		if stats.UtilizationRate > 100 {
			stats.UtilizationRate = 100
		}
	} else {
		stats.UtilizationRate = 0
	}

	utils.RespondJSON(w, http.StatusOK, stats)
}
