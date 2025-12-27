package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"gearguard/internal/database"
	"gearguard/internal/models"
	"gearguard/internal/utils"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// Register creates a new user
func Register(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
		Role     string `json:"role"`
		TeamID   *uint  `json:"team_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		utils.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Could not hash password")
		return
	}

	user := models.User{
		Name:     input.Name,
		Email:    input.Email,
		Password: string(hashedPassword),
		Role:     input.Role,
		TeamID:   input.TeamID,
	}

	if result := database.DB.Create(&user); result.Error != nil {
		// Log the actual error for debugging
		println("Registration Error:", result.Error.Error())
		utils.RespondError(w, http.StatusBadRequest, result.Error.Error())
		return
	}

	utils.RespondJSON(w, http.StatusCreated, user)
}

// Login authenticates a user and returns JWT
func Login(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		utils.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	var user models.User
	if result := database.DB.Where("email = ?", input.Email).First(&user); result.Error != nil {
		utils.RespondError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		utils.RespondError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	// Generate JWT
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &utils.Claims{
		UserID: user.ID,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(utils.SecretKey)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Could not generate token")
		return
	}

	utils.RespondJSON(w, http.StatusOK, map[string]interface{}{
		"token":   tokenString,
		"name":    user.Name,
		"role":    user.Role,
		"user_id": user.ID,
	})
}

// GetEmployees lists all users with 'Employee' role for assignment
func GetEmployees(w http.ResponseWriter, r *http.Request) {
	var employees []models.User
	// Select only necessary fields to avoid leaking passwords/tokens if any
	if result := database.DB.Where("role = ?", "Employee").Select("id, name, email").Find(&employees); result.Error != nil {
		utils.RespondError(w, http.StatusInternalServerError, result.Error.Error())
		return
	}
	utils.RespondJSON(w, http.StatusOK, employees)
}

// GetTechnicians lists all users with 'Technician' role
func GetTechnicians(w http.ResponseWriter, r *http.Request) {
	var technicians []models.User
	// Use ILIKE for case-insensitive role check
	if result := database.DB.Where("role ILIKE ?", "Technician").Find(&technicians); result.Error != nil {
		utils.RespondError(w, http.StatusInternalServerError, result.Error.Error())
		return
	}
	utils.RespondJSON(w, http.StatusOK, technicians)
}
