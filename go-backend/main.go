package main

import (
	"log"
	"os"

	"camp-david-backend/database"
	"camp-david-backend/handlers"
	"camp-david-backend/middleware"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// 1. Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("[INFO] No .env file found, using system environment variables")
	}

	// 2. Connect GORM to Remote MySQL
	database.ConnectDB()

	// 3. Initialize Gin router
	r := gin.Default()

	// 4. Configure CORS
	corsConfig := cors.DefaultConfig()
	corsConfig.AllowAllOrigins = true
	corsConfig.AllowHeaders = []string{"Origin", "Content-Length", "Content-Type", "Authorization"}
	corsConfig.AllowMethods = []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"}
	r.Use(cors.New(corsConfig))

	// 5. Public Routes
	r.GET("/api/health", handlers.HealthHandler)
	r.POST("/api/seed", handlers.SeedHandler)
	r.POST("/api/seed/campers", handlers.SeedCampersEndpointHandler)
	r.POST("/api/seed/users", handlers.SeedUsersEndpointHandler)
	r.POST("/api/auth/login", handlers.LoginHandler)

	// 6. Authenticated Routes Group
	authGroup := r.Group("/api")
	authGroup.Use(middleware.AuthMiddleware())
	{
		authGroup.POST("/auth/force-change-password", handlers.ForcePasswordChangeHandler)
		authGroup.GET("/auth/me", handlers.GetMeHandler)

		// Users / Staff
		authGroup.GET("/users", handlers.GetUsersHandler)
		authGroup.POST("/users", handlers.CreateUserHandler)
		authGroup.GET("/staff", handlers.GetUsersHandler)

		// Campers
		authGroup.GET("/campers", handlers.GetCampersHandler)
		authGroup.POST("/campers", handlers.CreateCamperHandler)
		authGroup.PUT("/campers/:id", handlers.UpdateCamperHandler)
		authGroup.DELETE("/campers/:id", handlers.DeleteCamperHandler)

		// Platoons
		authGroup.GET("/platoons", handlers.GetPlatoonsHandler)
		authGroup.POST("/platoons", handlers.CreatePlatoonHandler)
		authGroup.PUT("/platoons/:id", handlers.UpdatePlatoonHandler)

		// Dorms
		authGroup.GET("/dorms", handlers.GetDormsHandler)
		authGroup.POST("/dorms", handlers.CreateDormHandler)

		// Incidents
		authGroup.GET("/incidents", handlers.GetIncidentsHandler)
		authGroup.POST("/incidents", handlers.CreateIncidentHandler)

		// Announcements
		authGroup.GET("/announcements", handlers.GetAnnouncementsHandler)
		authGroup.POST("/announcements", handlers.CreateAnnouncementHandler)

		// Drills
		authGroup.GET("/drills", handlers.GetDrillsHandler)
		authGroup.POST("/drills", handlers.CreateDrillHandler)

		// Roles
		authGroup.GET("/roles", handlers.GetRolesHandler)

		// Global Search
		authGroup.GET("/search", handlers.GlobalSearchHandler)

		// Reports
		authGroup.GET("/reports", handlers.GetReportsHandler)
	}

	// 7. Start server on port 3001
	port := os.Getenv("PORT")
	if port == "" {
		port = "3001"
	}

	log.Printf("🚀 Camp David Go Backend (GORM) running on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start Go server: %v", err)
	}
}
