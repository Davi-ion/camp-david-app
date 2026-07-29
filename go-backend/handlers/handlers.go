package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"camp-david-backend/database"
	"camp-david-backend/models"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

func getJWTSecret() []byte {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		secret = "CampDavid2026SecretKey!"
	}
	return []byte(secret)
}

func generateID() string {
	b := make([]byte, 12)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func hashPassword(plain string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(plain), bcrypt.DefaultCost)
	return string(bytes), err
}

// ─── AUTH ──────────────────────────────────────────────────────────

type LoginRequest struct {
	Identifier string `json:"identifier" binding:"required"`
	Password   string `json:"password" binding:"required"`
}

func LoginHandler(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email/Username and password are required"})
		return
	}

	db := database.DB
	var staff models.Staff

	err := db.Preload("RoleAssignment.Role").Preload("Platoon").
		Where("email = ? OR username = ?", req.Identifier, req.Identifier).
		First(&staff).Error

	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email/username or password"})
		return
	}

	if staff.Status != "active" {
		c.JSON(http.StatusForbidden, gin.H{"error": "Your account is deactivated. Contact camp director."})
		return
	}

	if staff.PasswordHash == nil || bcrypt.CompareHashAndPassword([]byte(*staff.PasswordHash), []byte(req.Password)) != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid email/username or password"})
		return
	}

	now := time.Now()
	db.Model(&staff).Update("lastLoginAt", now)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":    staff.ID,
		"name":  staff.Name,
		"email": staff.Email,
		"role":  staff.Role,
		"exp":   time.Now().Add(24 * time.Hour).Unix(),
	})

	tokenString, err := token.SignedString(getJWTSecret())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"token": tokenString,
		"user":  staff,
	})
}

type ForcePasswordChangeRequest struct {
	NewPassword string `json:"newPassword" binding:"required"`
}

func ForcePasswordChangeHandler(c *gin.Context) {
	staffID := c.GetString("userId")
	if staffID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var req ForcePasswordChangeRequest
	if err := c.ShouldBindJSON(&req); err != nil || len(req.NewPassword) < 8 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Password must be at least 8 characters"})
		return
	}

	db := database.DB
	hash, err := hashPassword(req.NewPassword)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to hash password"})
		return
	}

	err = db.Model(&models.Staff{}).Where("id = ?", staffID).
		Updates(map[string]interface{}{
			"passwordHash":        hash,
			"forcePasswordChange": false,
		}).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update password"})
		return
	}

	var staff models.Staff
	db.Preload("RoleAssignment.Role").Preload("Platoon").First(&staff, "id = ?", staffID)

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"id":    staff.ID,
		"name":  staff.Name,
		"email": staff.Email,
		"role":  staff.Role,
		"exp":   time.Now().Add(24 * time.Hour).Unix(),
	})
	tokenString, _ := token.SignedString(getJWTSecret())

	c.JSON(http.StatusOK, gin.H{
		"message": "Password updated successfully",
		"token":   tokenString,
		"user":    staff,
	})
}

func GetMeHandler(c *gin.Context) {
	staffID := c.GetString("userId")
	if staffID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	var staff models.Staff
	if err := database.DB.Preload("RoleAssignment.Role").Preload("Platoon").First(&staff, "id = ?", staffID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, staff)
}

// ─── CAMPERS ───────────────────────────────────────────────────────

func GetCampersHandler(c *gin.Context) {
	var campers []models.Camper
	db := database.DB.Preload("Platoon").Preload("Dorm").Preload("Counsellor")

	status := c.Query("status")
	if status != "" {
		db = db.Where("status = ?", status)
	}

	platoonID := c.Query("platoonId")
	if platoonID != "" {
		db = db.Where("platoonId = ?", platoonID)
	}

	db.Find(&campers)
	c.JSON(http.StatusOK, gin.H{"campers": campers})
}

func CreateCamperHandler(c *gin.Context) {
	var camper models.Camper
	if err := c.ShouldBindJSON(&camper); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	camper.ID = generateID()
	if err := database.DB.Create(&camper).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create camper"})
		return
	}

	c.JSON(http.StatusCreated, camper)
}

func UpdateCamperHandler(c *gin.Context) {
	id := c.Param("id")
	var camper models.Camper
	if err := database.DB.First(&camper, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Camper not found"})
		return
	}

	if err := c.ShouldBindJSON(&camper); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	database.DB.Save(&camper)
	c.JSON(http.StatusOK, camper)
}

func DeleteCamperHandler(c *gin.Context) {
	id := c.Param("id")
	database.DB.Delete(&models.Camper{}, "id = ?", id)
	c.JSON(http.StatusOK, gin.H{"message": "Camper deleted"})
}

// ─── PLATOONS ──────────────────────────────────────────────────────

func GetPlatoonsHandler(c *gin.Context) {
	var platoons []models.Platoon
	database.DB.Preload("Leader").Preload("Staff").Preload("Campers").Find(&platoons)
	c.JSON(http.StatusOK, platoons)
}

func CreatePlatoonHandler(c *gin.Context) {
	var platoon models.Platoon
	if err := c.ShouldBindJSON(&platoon); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	platoon.ID = generateID()
	if err := database.DB.Create(&platoon).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create platoon"})
		return
	}

	c.JSON(http.StatusCreated, platoon)
}

func UpdatePlatoonHandler(c *gin.Context) {
	id := c.Param("id")
	var platoon models.Platoon
	if err := database.DB.First(&platoon, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Platoon not found"})
		return
	}

	if err := c.ShouldBindJSON(&platoon); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	database.DB.Save(&platoon)
	c.JSON(http.StatusOK, platoon)
}

// ─── DORMS ─────────────────────────────────────────────────────────

func GetDormsHandler(c *gin.Context) {
	var dorms []models.Dorm
	database.DB.Preload("Supervisor").Preload("AssistantSupervisor").Preload("Campers").Find(&dorms)
	c.JSON(http.StatusOK, dorms)
}

func CreateDormHandler(c *gin.Context) {
	var dorm models.Dorm
	if err := c.ShouldBindJSON(&dorm); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	dorm.ID = generateID()
	if err := database.DB.Create(&dorm).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create dorm"})
		return
	}

	c.JSON(http.StatusCreated, dorm)
}

// ─── INCIDENTS ─────────────────────────────────────────────────────

func GetIncidentsHandler(c *gin.Context) {
	var incidents []models.Incident
	database.DB.Preload("Camper").Preload("AssignedStaff").Preload("ReportedBy").Find(&incidents)
	c.JSON(http.StatusOK, incidents)
}

func CreateIncidentHandler(c *gin.Context) {
	var incident models.Incident
	if err := c.ShouldBindJSON(&incident); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	incident.ID = generateID()
	incident.ReportedAt = time.Now()
	if err := database.DB.Create(&incident).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to log incident"})
		return
	}

	c.JSON(http.StatusCreated, incident)
}

// ─── ANNOUNCEMENTS ─────────────────────────────────────────────────

func GetAnnouncementsHandler(c *gin.Context) {
	var announcements []models.Announcement
	database.DB.Order("createdAt desc").Find(&announcements)
	c.JSON(http.StatusOK, announcements)
}

func CreateAnnouncementHandler(c *gin.Context) {
	var ann models.Announcement
	if err := c.ShouldBindJSON(&ann); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ann.ID = generateID()
	ann.CreatedAt = time.Now()
	if err := database.DB.Create(&ann).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create announcement"})
		return
	}

	c.JSON(http.StatusCreated, ann)
}

// ─── DRILLS ────────────────────────────────────────────────────────

func GetDrillsHandler(c *gin.Context) {
	var drills []models.CampDrill
	database.DB.Preload("AssignedStaff").Preload("BackupStaff").Preload("Platoon").Preload("Checklist").Find(&drills)
	c.JSON(http.StatusOK, drills)
}

func CreateDrillHandler(c *gin.Context) {
	var drill models.CampDrill
	if err := c.ShouldBindJSON(&drill); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	drill.ID = generateID()
	if err := database.DB.Create(&drill).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create drill"})
		return
	}

	c.JSON(http.StatusCreated, drill)
}

// ─── USERS / STAFF ─────────────────────────────────────────────────

func GetUsersHandler(c *gin.Context) {
	db := database.DB

	var count int64
	db.Model(&models.Staff{}).Count(&count)
	if count <= 1 {
		SeedUsersLogic()
	}

	query := db.Model(&models.Staff{}).Preload("RoleAssignment.Role").Preload("Platoon")

	search := strings.TrimSpace(c.Query("search"))
	status := strings.TrimSpace(c.Query("status"))

	if search != "" {
		s := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR LOWER(username) LIKE ?", s, s, s)
	}

	if status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}

	var total int64
	query.Count(&total)

	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "50")
	page, _ := strconv.Atoi(pageStr)
	limit, _ := strconv.Atoi(limitStr)
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 200 {
		limit = 50
	}
	offset := (page - 1) * limit

	var staff []models.Staff
	query.Order("name asc").Offset(offset).Limit(limit).Find(&staff)

	c.JSON(http.StatusOK, gin.H{
		"users": staff,
		"total": total,
	})
}

func CreateUserHandler(c *gin.Context) {
	var req struct {
		Name       string  `json:"name" binding:"required"`
		Email      *string `json:"email"`
		Username   *string `json:"username"`
		Password   string  `json:"password"`
		Role       string  `json:"role"`
		Department *string `json:"department"`
		Phone      *string `json:"phone"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	defaultPassword := req.Password
	if defaultPassword == "" {
		defaultPassword = "CampDavid@2026!"
	}
	pwdHash, _ := hashPassword(defaultPassword)

	staff := models.Staff{
		ID:                  generateID(),
		Name:                req.Name,
		Email:               req.Email,
		Username:            req.Username,
		PasswordHash:        &pwdHash,
		Role:                req.Role,
		Department:          req.Department,
		Phone:               req.Phone,
		Status:              "active",
		ForcePasswordChange: true,
	}

	if err := database.DB.Create(&staff).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	c.JSON(http.StatusCreated, staff)
}

func UpdateUserRoleHandler(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Role string `json:"role" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var staff models.Staff
	if err := database.DB.First(&staff, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	staff.Role = req.Role
	if err := database.DB.Save(&staff).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update role"})
		return
	}

	LogAudit(c, "UPDATE_USER_ROLE", "User", staff.ID, staff.Name, "Updated role to "+req.Role)

	c.JSON(http.StatusOK, gin.H{"message": "Role updated successfully", "user": staff})
}

// ─── AUDIT & ACTIVITY LOGS ─────────────────────────────────────────

func LogAudit(c *gin.Context, action string, targetType, targetID, targetName, detail string) {
	userID := ""
	userName := "System Admin"
	if c != nil {
		if u, exists := c.Get("userID"); exists {
			userID, _ = u.(string)
		}
		if name, exists := c.Get("name"); exists {
			userName, _ = name.(string)
		} else if uname, exists := c.Get("userName"); exists {
			userName, _ = uname.(string)
		}
	}
	ip := ""
	if c != nil {
		ip = c.ClientIP()
	}

	log := models.AuditLog{
		ID:         generateID(),
		UserID:     userID,
		UserName:   userName,
		Action:     action,
		TargetType: strPtr(targetType),
		TargetID:   strPtr(targetID),
		TargetName: strPtr(targetName),
		Detail:     strPtr(detail),
		IPAddress:  strPtr(ip),
		CreatedAt:  time.Now(),
	}
	database.DB.Create(&log)
}

func seedInitialAuditLogs() {
	now := time.Now()
	sampleLogs := []models.AuditLog{
		{
			ID:         generateID(),
			UserID:     "user-1",
			UserName:   "David Mbacha",
			Action:     "UPDATE_USER_ROLE",
			TargetType: strPtr("User"),
			TargetID:   strPtr("user-5"),
			TargetName: strPtr("Femi Richard"),
			Detail:     strPtr("Role updated to Super Admin"),
			IPAddress:  strPtr("127.0.0.1"),
			CreatedAt:  now.Add(-10 * time.Minute),
		},
		{
			ID:         generateID(),
			UserID:     "user-2",
			UserName:   "Ruth Cookey",
			Action:     "CREATE_ANNOUNCEMENT",
			TargetType: strPtr("Announcement"),
			TargetID:   strPtr("ann-1"),
			TargetName: strPtr("Camp David 2026 Orientation"),
			Detail:     strPtr("Published announcement for all campers and staff"),
			IPAddress:  strPtr("127.0.0.1"),
			CreatedAt:  now.Add(-45 * time.Minute),
		},
		{
			ID:         generateID(),
			UserID:     "user-3",
			UserName:   "Christine Usifoh",
			Action:     "CREATE_CAMPER",
			TargetType: strPtr("Camper"),
			TargetID:   strPtr("cmp-101"),
			TargetName: strPtr("Emmanuel Adebayo"),
			Detail:     strPtr("Registered new camper assigned to Platoon ALPHA"),
			IPAddress:  strPtr("127.0.0.1"),
			CreatedAt:  now.Add(-2 * time.Hour),
		},
		{
			ID:         generateID(),
			UserID:     "user-4",
			UserName:   "Chinecherem Ikejide",
			Action:     "UPDATE_ATTENDANCE",
			TargetType: strPtr("RollCall"),
			TargetID:   strPtr("rc-day1-devotion"),
			TargetName: strPtr("Day 1 Morning Devotion"),
			Detail:     strPtr("Marked attendance for Dorm mistresses group"),
			IPAddress:  strPtr("127.0.0.1"),
			CreatedAt:  now.Add(-3 * time.Hour),
		},
		{
			ID:         generateID(),
			UserID:     "user-1",
			UserName:   "David Mbacha",
			Action:     "SYSTEM_SEED",
			TargetType: strPtr("System"),
			TargetID:   strPtr("seed-2026"),
			TargetName: strPtr("Camp David Roster Database"),
			Detail:     strPtr("Seeded 56 staff members and 200 campers into MySQL database"),
			IPAddress:  strPtr("127.0.0.1"),
			CreatedAt:  now.Add(-5 * time.Hour),
		},
	}
	for _, l := range sampleLogs {
		database.DB.Create(&l)
	}
}

func GetAuditLogsHandler(c *gin.Context) {
	db := database.DB

	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "50")
	page, _ := strconv.Atoi(pageStr)
	limit, _ := strconv.Atoi(limitStr)
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 200 {
		limit = 50
	}
	offset := (page - 1) * limit

	var total int64
	db.Model(&models.AuditLog{}).Count(&total)

	if total == 0 {
		seedInitialAuditLogs()
		db.Model(&models.AuditLog{}).Count(&total)
	}

	var logs []models.AuditLog
	db.Order("createdAt desc").Offset(offset).Limit(limit).Find(&logs)

	c.JSON(http.StatusOK, gin.H{
		"logs":  logs,
		"total": total,
	})
}

// ─── ROLES ─────────────────────────────────────────────────────────

func GetRolesHandler(c *gin.Context) {
	var roles []models.Role
	database.DB.Find(&roles)
	c.JSON(http.StatusOK, roles)
}

// ─── GLOBAL SEARCH ────────────────────────────────────────────────

func GlobalSearchHandler(c *gin.Context) {
	q := strings.TrimSpace(c.Query("q"))
	if len(q) < 2 {
		c.JSON(http.StatusOK, gin.H{"campers": []models.Camper{}, "staff": []models.Staff{}})
		return
	}

	db := database.DB
	var campers []models.Camper
	var staff []models.Staff

	searchPattern := "%" + q + "%"

	db.Preload("Platoon").Where("name LIKE ? OR registrationNumber LIKE ?", searchPattern, searchPattern).Limit(5).Find(&campers)
	db.Where("name LIKE ? OR email LIKE ? OR username LIKE ?", searchPattern, searchPattern, searchPattern).Limit(5).Find(&staff)

	c.JSON(http.StatusOK, gin.H{
		"campers": campers,
		"staff":   staff,
	})
}

// ─── REPORTS ───────────────────────────────────────────────────────

func GetReportsHandler(c *gin.Context) {
	db := database.DB
	var totalCampers int64
	var totalStaff int64
	var openIncidents int64
	var totalPlatoons int64
	var totalDorms int64

	db.Model(&models.Camper{}).Where("status = ?", "active").Count(&totalCampers)
	db.Model(&models.Staff{}).Where("status = ?", "active").Count(&totalStaff)
	db.Model(&models.Incident{}).Where("status = ?", "open").Count(&openIncidents)
	db.Model(&models.Platoon{}).Count(&totalPlatoons)
	db.Model(&models.Dorm{}).Count(&totalDorms)

	c.JSON(http.StatusOK, gin.H{
		"campers":       totalCampers,
		"staff":         totalStaff,
		"openIncidents": openIncidents,
		"platoons":      totalPlatoons,
		"dorms":         totalDorms,
	})
}

// ─── HEALTH ────────────────────────────────────────────────────────

func HealthHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "ok",
		"ts":     time.Now().Format(time.RFC3339),
		"engine": "Go (GORM)",
	})
}

// ─── SEED ──────────────────────────────────────────────────────────

func strPtr(s string) *string { return &s }

func SeedHandler(c *gin.Context) {
	db := database.DB

	defaultPassword := "CampDavid@2026!"
	hash, _ := hashPassword(defaultPassword)

	// Admin staff
	adminEmail := "admin@campdavid.org"
	adminUser := "admin"
	admin := models.Staff{
		ID:                  generateID(),
		Name:                "Super Admin",
		Email:               &adminEmail,
		Username:            &adminUser,
		PasswordHash:        &hash,
		Role:                "Super Admin",
		Department:          strPtr("Executive"),
		Status:              "active",
		ForcePasswordChange: false,
	}

	db.Where(models.Staff{Email: &adminEmail}).FirstOrCreate(&admin)

	usersSeeded, _ := SeedUsersLogic()
	platoonsCreated, dormsCreated, campersProcessed, err := SeedCampersLogic()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":          "Database, test users and campers seeded successfully via GORM!",
		"testUsersCount":  len(usersSeeded),
		"platoonsCreated": platoonsCreated,
		"dormsCreated":    dormsCreated,
		"campersProcessed": campersProcessed,
	})
}
