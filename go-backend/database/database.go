package database

import (
	"fmt"
	"log"
	"os"
	"time"

	"camp-david-backend/models"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func ConnectDB() *gorm.DB {
	host := os.Getenv("MYSQL_HOST")
	if host == "" {
		host = "srv1427.hstgr.io"
	}
	port := os.Getenv("MYSQL_PORT")
	if port == "" {
		port = "3306"
	}
	user := os.Getenv("MYSQL_USER")
	if user == "" {
		user = "u859677653_camp_david"
	}
	password := os.Getenv("MYSQL_PASSWORD")
	if password == "" {
		password = "*Reedb4b4"
	}
	dbName := os.Getenv("MYSQL_DB")
	if dbName == "" {
		dbName = "u859677653_camp_david_db"
	}

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		user, password, host, port, dbName)

	log.Printf("[GORM] Connecting to Remote MySQL at %s:%s/%s as %s...", host, port, dbName, user)

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("[GORM] Failed to connect to database: %v", err)
	}

	sqlDB, err := db.DB()
	if err == nil {
		sqlDB.SetMaxIdleConns(5)
		sqlDB.SetMaxOpenConns(20)
		sqlDB.SetConnMaxLifetime(30 * time.Minute)
	}

	log.Println("[GORM] Successfully connected to Remote MySQL!")

	log.Println("[GORM] Auto-migrating database schemas...")
	db.AutoMigrate(
		&models.Staff{},
		&models.Platoon{},
		&models.Dorm{},
		&models.Camper{},
		&models.Incident{},
		&models.Announcement{},
		&models.CampDrill{},
		&models.Role{},
		&models.RoleAssignment{},
	)

	DB = db
	return db
}
