package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"gearguard/internal/database"
	"gearguard/internal/models"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var SecretKey = []byte("super_secret_key_change_in_prod")

// Claims struct
type Claims struct {
	UserID uint   `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
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
		RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "Could not hash password")
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
		RespondError(w, http.StatusBadRequest, result.Error.Error())
		return
	}

	RespondJSON(w, http.StatusCreated, user)
}

// Login authenticates a user and returns JWT
func Login(w http.ResponseWriter, r *http.Request) {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		RespondError(w, http.StatusBadRequest, err.Error())
		return
	}

	var user models.User
	if result := database.DB.Where("email = ?", input.Email).First(&user); result.Error != nil {
		RespondError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		RespondError(w, http.StatusUnauthorized, "Invalid credentials")
		return
	}

	// Generate JWT
	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		UserID: user.ID,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(SecretKey)
	if err != nil {
		RespondError(w, http.StatusInternalServerError, "Could not generate token")
		return
	}

	RespondJSON(w, http.StatusOK, map[string]string{
		"token": tokenString,
		"name":  user.Name,
		"role":  user.Role,
	})
}
