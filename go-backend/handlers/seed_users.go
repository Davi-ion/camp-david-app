package handlers

import (
	"log"
	"net/http"

	"camp-david-backend/database"
	"camp-david-backend/models"

	"github.com/gin-gonic/gin"
)

type TestUserDef struct {
	Name       string `json:"name"`
	Email      string `json:"email"`
	Username   string `json:"username"`
	Role       string `json:"role"`
	Department string `json:"department"`
}

func SeedUsersLogic() ([]TestUserDef, error) {
	db := database.DB
	defaultPassword := "CampDavid@2026!"
	hash, err := hashPassword(defaultPassword)
	if err != nil {
		return nil, err
	}

	testUsers := []TestUserDef{
		{
			Name:       "Super Admin",
			Email:      "admin@campdavid.org",
			Username:   "admin",
			Role:       "Super Admin",
			Department: "Executive",
		},
		{
			Name:       "Commander Sarah",
			Email:      "commander@campdavid.org",
			Username:   "commander",
			Role:       "Camp Commander",
			Department: "Operations",
		},
		{
			Name:       "Dorm Lead Marcus",
			Email:      "dormlead@campdavid.org",
			Username:   "dormlead",
			Role:       "Dorm Lead",
			Department: "Accommodations",
		},
		{
			Name:       "Platoon Lead Alex",
			Email:      "platoonlead@campdavid.org",
			Username:   "platoonlead",
			Role:       "Platoon Lead",
			Department: "Platoon Command",
		},
		{
			Name:       "Volunteer Grace",
			Email:      "volunteer@campdavid.org",
			Username:   "volunteer",
			Role:       "Volunteer",
			Department: "Support",
		},
	}

	for _, tu := range testUsers {
		var existing models.Staff
		email := tu.Email
		uname := tu.Username
		dept := tu.Department

		err := db.Where("email = ? OR username = ?", email, uname).First(&existing).Error
		if err != nil {
			newStaff := models.Staff{
				ID:                  generateID(),
				Name:                tu.Name,
				Email:               &email,
				Username:            &uname,
				PasswordHash:        &hash,
				Role:                tu.Role,
				Department:          &dept,
				Status:              "active",
				ForcePasswordChange: false,
			}
			if err := db.Create(&newStaff).Error; err != nil {
				log.Printf("[SEED USERS ERROR] Failed to create %s: %v", tu.Name, err)
			}
		} else {
			existing.Name = tu.Name
			existing.Role = tu.Role
			existing.Department = &dept
			existing.PasswordHash = &hash
			existing.Status = "active"
			existing.ForcePasswordChange = false
			db.Save(&existing)
		}
	}

	return testUsers, nil
}

func SeedUsersEndpointHandler(c *gin.Context) {
	users, err := SeedUsersLogic()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":         "Test users seeded successfully across all 5 RBAC roles!",
		"users":           users,
		"defaultPassword": "CampDavid@2026!",
	})
}
