package handlers

import (
	"net/http"
	"time"

	"camp-david-backend/database"
	"camp-david-backend/models"

	"github.com/gin-gonic/gin"
)

// GetProgramSessionsHandler returns all program sessions, optionally filtered by day ?day=wed
func GetProgramSessionsHandler(c *gin.Context) {
	db := database.DB
	day := c.Query("day")

	var sessions []models.ProgramSession
	query := db.Order("time asc")
	if day != "" && day != "all" {
		query = query.Where("day = ?", day)
	}

	if err := query.Find(&sessions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch program sessions"})
		return
	}

	c.JSON(http.StatusOK, sessions)
}

// CreateProgramSessionHandler creates a new program session
func CreateProgramSessionHandler(c *gin.Context) {
	var req models.ProgramSession
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid session data"})
		return
	}

	db := database.DB
	now := time.Now()
	if req.ID == "" {
		req.ID = generateID()
	}
	if req.Key == "" {
		req.Key = req.Day + "-" + generateID()[:8]
	}
	req.CreatedAt = now
	req.UpdatedAt = now

	if err := db.Create(&req).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create program session"})
		return
	}

	c.JSON(http.StatusCreated, req)
}

// UpdateProgramSessionHandler updates an existing program session
func UpdateProgramSessionHandler(c *gin.Context) {
	id := c.Param("id")
	db := database.DB

	var existing models.ProgramSession
	if err := db.Where("id = ?", id).First(&existing).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Program session not found"})
		return
	}

	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid update data"})
		return
	}

	updates["updatedAt"] = time.Now()

	if err := db.Model(&existing).Updates(updates).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update program session"})
		return
	}

	db.Where("id = ?", id).First(&existing)
	c.JSON(http.StatusOK, existing)
}

// DeleteProgramSessionHandler deletes a program session
func DeleteProgramSessionHandler(c *gin.Context) {
	id := c.Param("id")
	db := database.DB

	if err := db.Where("id = ?", id).Delete(&models.ProgramSession{}).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete program session"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Program session deleted successfully"})
}
