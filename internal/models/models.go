package models

import (
	"time"

	"gorm.io/gorm"
)

// Enums for Status and Request Type
type RequestType string
type RequestStatus string

const (
	TypeCorrective RequestType = "Corrective"
	TypePreventive RequestType = "Preventive"

	StatusNew        RequestStatus = "New"
	StatusInProgress RequestStatus = "In Progress"
	StatusRepaired   RequestStatus = "Repaired"
	StatusScrap      RequestStatus = "Scrap"
)

type User struct {
	ID       uint   `gorm:"primaryKey" json:"id"`
	Name     string `json:"name"`
	Email    string `gorm:"unique" json:"email"`
	Password string `json:"-"`    // Don't expose password hash
	Role     string `json:"role"` // "Manager", "Technician"
	TeamID   *uint  `json:"team_id"`
}

type MaintenanceTeam struct {
	ID      uint   `gorm:"primaryKey" json:"id"`
	Name    string `json:"name"`
	Members []User `gorm:"foreignKey:TeamID" json:"members,omitempty"`
}

type Equipment struct {
	ID                uint            `gorm:"primaryKey" json:"id"`
	Name              string          `json:"name"`
	Category          string          `json:"category"`
	SerialNumber      string          `json:"serial_number"`
	PurchaseDate      time.Time       `json:"purchase_date"`
	WarrantyInfo      string          `json:"warranty_info"`
	Location          string          `json:"location"`
	MaintenanceTeamID uint            `json:"maintenance_team_id"`
	MaintenanceTeam   MaintenanceTeam `gorm:"foreignKey:MaintenanceTeamID" json:"maintenance_team,omitempty"`
	IsUsable          bool            `gorm:"default:true" json:"is_usable"`
}

type MaintenanceRequest struct {
	ID            uint           `gorm:"primaryKey" json:"id"`
	CreatedAt     time.Time      `json:"created_at"`
	UpdatedAt     time.Time      `json:"updated_at"`
	DeletedAt     gorm.DeletedAt `gorm:"index" json:"-"`
	
	Subject       string        `json:"subject"`
	Type          RequestType   `json:"type"`
	Status        RequestStatus `gorm:"default:'New'" json:"status"`
	
	EquipmentID   uint      `json:"equipment_id"`
	Equipment     Equipment `gorm:"foreignKey:EquipmentID" json:"equipment,omitempty"`
	
	TeamID        uint            `json:"team_id"`
	Team          MaintenanceTeam `gorm:"foreignKey:TeamID" json:"team,omitempty"`
	
	TechnicianID  *uint `json:"technician_id"`
	Technician    *User `gorm:"foreignKey:TechnicianID" json:"technician,omitempty"`
	
	ScheduledDate *time.Time `json:"scheduled_date"`
	DurationHours float64    `json:"duration_hours"`
}
