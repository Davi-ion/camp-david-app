package handlers

import (
	"net/http"
	"time"

	"camp-david-backend/database"
	"camp-david-backend/models"

	"github.com/gin-gonic/gin"
)

// GetAllAttendanceHandler returns all attendance records formatted as sessionId -> camperId -> status
func GetAllAttendanceHandler(c *gin.Context) {
	db := database.DB
	var records []models.AttendanceRecord

	if err := db.Find(&records).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch attendance records"})
		return
	}

	attendanceMap := make(map[string]map[string]string)
	for _, r := range records {
		if r.SessionID == "" || r.CamperID == nil || *r.CamperID == "" {
			continue
		}
		if _, exists := attendanceMap[r.SessionID]; !exists {
			attendanceMap[r.SessionID] = make(map[string]string)
		}
		attendanceMap[r.SessionID][*r.CamperID] = r.Status
	}

	c.JSON(http.StatusOK, attendanceMap)
}

type MarkAttendanceRequest struct {
	SessionKey string  `json:"sessionKey" binding:"required"`
	CamperID   string  `json:"camperId" binding:"required"`
	Status     *string `json:"status"` // "present", "absent", "excused", or null/empty to clear
	StaffID    *string `json:"staffId"`
}

// MarkAttendanceHandler marks or clears a single camper's attendance record
func MarkAttendanceHandler(c *gin.Context) {
	var req MarkAttendanceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "sessionKey and camperId are required"})
		return
	}

	db := database.DB

	// If status is nil or empty, delete the record
	if req.Status == nil || *req.Status == "" {
		db.Where("sessionId = ? AND camperId = ?", req.SessionKey, req.CamperID).
			Delete(&models.AttendanceRecord{})
		c.JSON(http.StatusOK, gin.H{"message": "Attendance record cleared"})
		return
	}

	var existing models.AttendanceRecord
	err := db.Where("sessionId = ? AND camperId = ?", req.SessionKey, req.CamperID).First(&existing).Error

	now := time.Now()
	if err == nil {
		// Update existing record
		existing.Status = *req.Status
		existing.Timestamp = now
		existing.UpdatedAt = now
		if req.StaffID != nil && *req.StaffID != "" {
			existing.RecordedByID = req.StaffID
		}
		if err := db.Save(&existing).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update attendance record"})
			return
		}
		c.JSON(http.StatusOK, existing)
		return
	}

	// Create new record
	id := generateID()
	newRecord := models.AttendanceRecord{
		ID:           id,
		SessionID:    req.SessionKey,
		CamperID:     &req.CamperID,
		Status:       *req.Status,
		Timestamp:    now,
		RecordedByID: req.StaffID,
		CreatedAt:    now,
		UpdatedAt:    now,
	}

	if err := db.Create(&newRecord).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create attendance record"})
		return
	}

	c.JSON(http.StatusCreated, newRecord)
}

type BulkMarkAttendanceRequest struct {
	SessionKey string   `json:"sessionKey" binding:"required"`
	CamperIDs  []string `json:"camperIds" binding:"required"`
	Status     string   `json:"status" binding:"required"`
	StaffID    *string  `json:"staffId"`
}

// BulkMarkAttendanceHandler marks attendance for multiple campers
func BulkMarkAttendanceHandler(c *gin.Context) {
	var req BulkMarkAttendanceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "sessionKey, camperIds, and status are required"})
		return
	}

	db := database.DB
	now := time.Now()

	for _, camperID := range req.CamperIDs {
		if camperID == "" {
			continue
		}
		var existing models.AttendanceRecord
		err := db.Where("sessionId = ? AND camperId = ?", req.SessionKey, camperID).First(&existing).Error
		if err == nil {
			existing.Status = req.Status
			existing.Timestamp = now
			existing.UpdatedAt = now
			if req.StaffID != nil && *req.StaffID != "" {
				existing.RecordedByID = req.StaffID
			}
			db.Save(&existing)
		} else {
			cid := camperID
			newRecord := models.AttendanceRecord{
				ID:           generateID(),
				SessionID:    req.SessionKey,
				CamperID:     &cid,
				Status:       req.Status,
				Timestamp:    now,
				RecordedByID: req.StaffID,
				CreatedAt:    now,
				UpdatedAt:    now,
			}
			db.Create(&newRecord)
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Bulk attendance updated successfully", "count": len(req.CamperIDs)})
}

// GetSessionAttendanceHandler fetches all records for a given session
func GetSessionAttendanceHandler(c *gin.Context) {
	sessionID := c.Param("sessionId")
	db := database.DB

	var records []models.AttendanceRecord
	if err := db.Preload("Camper").Preload("Staff").Preload("RecordedBy").
		Where("sessionId = ?", sessionID).Find(&records).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch session attendance"})
		return
	}

	c.JSON(http.StatusOK, records)
}
