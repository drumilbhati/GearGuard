package handlers

import (
	"net/http"
	"time"

	"gearguard/internal/database"
	"gearguard/internal/models"
)

type DashboardStats struct {
	TotalEquipment    int64 `json:"total_equipment"`
	CriticalEquipment int64 `json:"critical_equipment"` // e.g., Scrapped or specific flag
	OpenRequests      int64 `json:"open_requests"`
	OverdueRequests   int64 `json:"overdue_requests"`
	TechnicianLoad    int64 `json:"technician_load"` // Avg active requests per tech (simplified)
}

func GetDashboardStats(w http.ResponseWriter, r *http.Request) {
	var stats DashboardStats

	// 1. Total Equipment
	database.DB.Model(&models.Equipment{}).Count(&stats.TotalEquipment)

	// 2. Critical Equipment (For now, count Scrapped or those with >3 open requests)
	// Simplified: Count 'IsUsable = false'
	database.DB.Model(&models.Equipment{}).Where("is_usable = ?", false).Count(&stats.CriticalEquipment)

	// 3. Open Requests (New or In Progress)
	database.DB.Model(&models.MaintenanceRequest{}).Where("status IN ?", []string{"New", "In Progress"}).Count(&stats.OpenRequests)

	// 4. Overdue Requests (Scheduled Date < Now AND Status != Repaired/Scrap)
	database.DB.Model(&models.MaintenanceRequest{}).
		Where("scheduled_date < ? AND status NOT IN ?", time.Now(), []string{"Repaired", "Scrap"}).
		Count(&stats.OverdueRequests)
	
	// 5. Technician Load (Active requests)
	// Just return the raw count of active requests for the "load" metric context
	stats.TechnicianLoad = stats.OpenRequests 

	RespondJSON(w, http.StatusOK, stats)
}
