package utils

import (
	"encoding/json"
	"net/http"

	"github.com/golang-jwt/jwt/v5"
)

var SecretKey = []byte("super_secret_key_change_in_prod")

// Claims struct
type Claims struct {
	UserID uint   `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

type ContextKey string

const UserIDKey ContextKey = "userID"

func RespondJSON(w http.ResponseWriter, status int, payload interface{}) {
	response, _ := json.Marshal(payload)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	w.Write(response)
}

func RespondError(w http.ResponseWriter, status int, message string) {
	RespondJSON(w, status, map[string]string{"error": message})
}
