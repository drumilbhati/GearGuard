package database

import (
	"fmt"
	"log"
	"os"

	"gearguard/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

var DB *gorm.DB

func ConnectDB() {
	sslMode := os.Getenv("DB_SSLMODE")
	if sslMode == "" {
		sslMode = "disable"
	}

	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=%s TimeZone=UTC",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASSWORD"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
		sslMode,
	)

	var err error
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Failed to connect to database: ", err)
	}

	log.Println("Connected to Database")

	// Migrate the schema
	err = DB.AutoMigrate(
		&models.MaintenanceTeam{},
		&models.User{},
		&models.Equipment{},
		&models.MaintenanceRequest{},
	)
	if err != nil {
		log.Fatal("Failed to migrate database schema: ", err)
	}
	log.Println("Database Migration Completed")

	// Seed Default Teams if empty
	var count int64
	DB.Model(&models.MaintenanceTeam{}).Count(&count)
	if count == 0 {
		defaultTeams := []models.MaintenanceTeam{
			{Name: "Mechanical Team"},
			{Name: "Electrical Team"},
			{Name: "IT Support"},
			{Name: "General Maintenance"},
		}
		for _, team := range defaultTeams {
			DB.Create(&team)
		}
		log.Println("Default teams seeded")
	}
}
