package handlers

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"log"
	"net/http"

	"camp-david-backend/database"
	"camp-david-backend/models"

	"github.com/gin-gonic/gin"
)

//go:embed users_seed.json
var usersJSON []byte

type SeedUserRecord struct {
	Name       string `json:"name"`
	FirstName  string `json:"firstName"`
	LastName   string `json:"lastName"`
	Username   string `json:"username"`
	Email      string `json:"email"`
	Role       string `json:"role"`
	Gender     string `json:"gender"`
	TShirtSize string `json:"tshirtSize"`
	Department string `json:"department"`
}

func SeedUsersLogic() ([]SeedUserRecord, error) {
	db := database.DB
	if db == nil {
		return nil, fmt.Errorf("database connection is nil")
	}

	defaultPassword := "CampDavid@2026!"
	hash, err := hashPassword(defaultPassword)
	if err != nil {
		return nil, err
	}

	// 1. Primary Super Admin fallback
	adminEmail := "admin@campdavid.org"
	adminUser := "admin"
	adminDept := "Executive"
	adminStaff := models.Staff{
		ID:                  generateID(),
		Name:                "Super Admin",
		Email:               &adminEmail,
		Username:            &adminUser,
		PasswordHash:        &hash,
		Role:                "Super Admin",
		Department:          &adminDept,
		Status:              "active",
		ForcePasswordChange: false,
	}
	db.Where("email = ? OR username = ?", adminEmail, adminUser).FirstOrCreate(&adminStaff)

	// 2. Parse 56 volunteers from users_seed.json
	var records []SeedUserRecord
	if err := json.Unmarshal(usersJSON, &records); err != nil {
		return nil, fmt.Errorf("failed to unmarshal users_seed.json: %v", err)
	}

	for _, u := range records {
		email := u.Email
		uname := u.Username
		dept := u.Department
		gender := u.Gender

		var existing models.Staff
		err := db.Where("username = ? OR email = ?", uname, email).First(&existing).Error
		if err != nil {
			newStaff := models.Staff{
				ID:                  generateID(),
				Name:                u.Name,
				Email:               &email,
				Username:            &uname,
				PasswordHash:        &hash,
				Role:                u.Role,
				Department:          &dept,
				Gender:              &gender,
				Status:              "active",
				ForcePasswordChange: false,
			}
			if err := db.Create(&newStaff).Error; err != nil {
				log.Printf("[SEED USER ERROR] Failed to create %s (%s): %v", u.Name, uname, err)
			}
		} else {
			existing.Name = u.Name
			existing.Email = &email
			existing.Username = &uname
			existing.Role = u.Role
			existing.Department = &dept
			existing.Gender = &gender
			existing.PasswordHash = &hash
			existing.Status = "active"
			existing.ForcePasswordChange = false
			db.Save(&existing)
		}
	}

	return records, nil
}

func SeedUsersEndpointHandler(c *gin.Context) {
	users, err := SeedUsersLogic()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":         fmt.Sprintf("Seeded %d staff users successfully from CSV!", len(users)),
		"count":           len(users),
		"defaultPassword": "CampDavid@2026!",
		"users":           users,
	})
}
