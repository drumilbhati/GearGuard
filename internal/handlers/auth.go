package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"

	"gearguard/internal/database"
	"gearguard/internal/models"
	"gearguard/internal/services"
	"gearguard/internal/utils"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

// ForgotPassword handles password reset request
func ForgotPassword(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email string `json:"email"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		utils.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	fmt.Printf("Password reset requested for email: %s\n", input.Email)

	var user models.User
	if result := database.DB.Where("email = ?", input.Email).First(&user); result.Error != nil {
		fmt.Printf("User not found for email: %s\n", input.Email)
		// For security, don't reveal if email exists
		utils.RespondJSON(w, http.StatusOK, map[string]string{"message": "If this email is registered, you will receive a reset link."})
		return
	}

	// Generate Token
	b := make([]byte, 20)
	if _, err := rand.Read(b); err != nil {
		fmt.Println("Error generating secure token")
		utils.RespondError(w, http.StatusInternalServerError, "Error generating token")
		return
	}
	token := hex.EncodeToString(b)

	// Save to DB
	user.PasswordResetToken = token
	user.PasswordResetAt = time.Now().Add(1 * time.Hour)
	if err := database.DB.Save(&user).Error; err != nil {
		fmt.Printf("Error saving token to DB: %v\n", err)
		utils.RespondError(w, http.StatusInternalServerError, "Error saving token")
		return
	}

	fmt.Printf("Token generated and saved for user %s\n", user.Email)

	// Send Email
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}

	resetLink := fmt.Sprintf("%s/reset-password/%s", frontendURL, token)
	body := fmt.Sprintf("<h3>Password Reset Request</h3><p>Click the link below to reset your password:</p><a href='%s'>%s</a><p>This link expires in 1 hour.</p>", resetLink, resetLink)

	go services.SendEmail([]string{user.Email}, "Password Reset - GearGuard", body)

	utils.RespondJSON(w, http.StatusOK, map[string]string{"message": "If this email is registered, you will receive a reset link."})
}

// ResetPassword handles the password update
func ResetPassword(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Token    string `json:"token"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		utils.RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	var user models.User
	if result := database.DB.Where("password_reset_token = ? AND password_reset_at > ?", input.Token, time.Now()).First(&user); result.Error != nil {
		utils.RespondError(w, http.StatusBadRequest, "Invalid or expired token")
		return
	}

	// Update Password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		utils.RespondError(w, http.StatusInternalServerError, "Error hashing password")
		return
	}

	user.Password = string(hashedPassword)
	user.PasswordResetToken = "" // Clear token
	user.PasswordResetAt = time.Time{}
	database.DB.Save(&user)

	utils.RespondJSON(w, http.StatusOK, map[string]string{"message": "Password updated successfully"})
}

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
