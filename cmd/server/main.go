package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"gearguard/internal/database"
	"gearguard/internal/handlers"
	"gearguard/internal/middleware"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, using system environment variables")
	}

	// Initialize Database
	database.ConnectDB()

	                // Initialize Router

	                r := mux.NewRouter()

	        

	                // Middleware

	                r.Use(loggingMiddleware)

	                r.Use(jsonMiddleware)

	        

	                // API Subrouter

	                api := r.PathPrefix("/api").Subrouter()

	        

	                // Public Routes

	                api.HandleFunc("/register", handlers.Register).Methods("POST", "OPTIONS")

	                api.HandleFunc("/login", handlers.Login).Methods("POST", "OPTIONS")

	                api.HandleFunc("/forgot-password", handlers.ForgotPassword).Methods("POST", "OPTIONS")

	                api.HandleFunc("/reset-password", handlers.ResetPassword).Methods("POST", "OPTIONS")

	                api.HandleFunc("/teams", handlers.GetTeams).Methods("GET", "OPTIONS")

	        

	                // Protected Routes (Manually apply middleware or use another subrouter)

	                protected := api.PathPrefix("/").Subrouter()

	                protected.Use(middleware.AuthMiddleware)

	        

	                // Team & User Routes

	                protected.HandleFunc("/teams", handlers.CreateTeam).Methods("POST", "OPTIONS")

	                protected.HandleFunc("/users/employees", handlers.GetEmployees).Methods("GET", "OPTIONS")

	                protected.HandleFunc("/users/technicians", handlers.GetTechnicians).Methods("GET", "OPTIONS")

	        

	                // Equipment Routes

	                protected.HandleFunc("/equipment", handlers.CreateEquipment).Methods("POST", "OPTIONS")

	                protected.HandleFunc("/equipment", handlers.GetEquipment).Methods("GET", "OPTIONS")

	                protected.HandleFunc("/equipment/{id}/requests", handlers.GetEquipmentRequests).Methods("GET", "OPTIONS")

	        

	                // Maintenance Request Routes

	                protected.HandleFunc("/requests", handlers.CreateRequest).Methods("POST", "OPTIONS")

	                protected.HandleFunc("/requests", handlers.GetRequests).Methods("GET", "OPTIONS")

	                protected.HandleFunc("/requests/{id}", handlers.UpdateRequest).Methods("PUT", "OPTIONS")

	        

	                // Dashboard

	                protected.HandleFunc("/dashboard/stats", handlers.GetDashboardStats).Methods("GET", "OPTIONS")

	        // CORS Setup
	        allowedOrigins := []string{
	            "http://localhost:3000",
	            "https://gearguard-frontend.onrender.com",
	        }
	        if envOrigin := os.Getenv("FRONTEND_URL"); envOrigin != "" {
	            allowedOrigins = append(allowedOrigins, envOrigin)
	        }

	        c := cors.New(cors.Options{
	                AllowedOrigins:   allowedOrigins,
	                AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
	                AllowedHeaders:   []string{"Authorization", "Content-Type", "Accept"},
	                AllowCredentials: true,
	                Debug:            true,
	        })
	handler := c.Handler(r)

	// Start Server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	srv := &http.Server{
		Handler:      handler,
		Addr:         ":" + port,
		WriteTimeout: 15 * time.Second,
		ReadTimeout:  15 * time.Second,
	}

	log.Printf("Server running on port %s", port)
	log.Fatal(srv.ListenAndServe())
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("%s %s %s", r.Method, r.RequestURI, r.RemoteAddr)
		next.ServeHTTP(w, r)
	})
}

func jsonMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		next.ServeHTTP(w, r)
	})
}