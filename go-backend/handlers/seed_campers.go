package handlers

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"

	"camp-david-backend/database"
	"camp-david-backend/models"

	"github.com/gin-gonic/gin"
)

//go:embed campers_seed.json
var campersJSON []byte

type SeedCamperRecord struct {
	Name               string `json:"name"`
	RegistrationNumber string `json:"registrationNumber"`
	Platoon            string `json:"platoon"`
	Gender             string `json:"gender"`
	TShirtSize         string `json:"tshirtSize"`
	Dorm               string `json:"dorm"`
	Age                *int   `json:"age"`
}

func SeedCampersLogic() (int, int, int, error) {
	db := database.DB
	if db == nil {
		return 0, 0, 0, fmt.Errorf("database connection is nil")
	}

	// 1. Seed Platoons
	platoonNames := []string{
		"Alfa", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf",
		"Kilo", "Lima", "Mike", "Oscar", "Quebec", "Romeo", "Sierra", "Tango", "Victor",
	}

	platoonMap := make(map[string]string)
	platoonsCreated := 0

	for _, pName := range platoonNames {
		var existing models.Platoon
		err := db.Where("LOWER(name) = ?", strings.ToLower(pName)).First(&existing).Error
		if err != nil {
			newP := models.Platoon{
				ID:       generateID(),
				Name:     pName,
				Emoji:    "🏴",
				ColorHex: strPtr("#1B7865"),
				Status:   "active",
			}
			if err := db.Create(&newP).Error; err == nil {
				platoonMap[strings.ToLower(pName)] = newP.ID
				platoonsCreated++
			} else {
				log.Printf("[SEED ERROR] Failed to create platoon %s: %v", pName, err)
			}
		} else {
			platoonMap[strings.ToLower(pName)] = existing.ID
		}
	}

	// 2. Seed Dorms
	dormDefs := []struct {
		Name     string
		Gender   string
		Capacity int
	}{
		{Name: "LQF1", Gender: "Female", Capacity: 50},
		{Name: "LQF2", Gender: "Female", Capacity: 50},
		{Name: "LQM1", Gender: "Male", Capacity: 50},
		{Name: "LQM2", Gender: "Male", Capacity: 50},
	}

	dormMap := make(map[string]string)
	dormsCreated := 0

	for _, dDef := range dormDefs {
		var existing models.Dorm
		err := db.Where("LOWER(name) = ?", strings.ToLower(dDef.Name)).First(&existing).Error
		if err != nil {
			newD := models.Dorm{
				ID:       generateID(),
				Name:     dDef.Name,
				Gender:   dDef.Gender,
				Capacity: dDef.Capacity,
				Status:   "active",
			}
			if err := db.Create(&newD).Error; err == nil {
				dormMap[strings.ToLower(dDef.Name)] = newD.ID
				dormsCreated++
			} else {
				log.Printf("[SEED ERROR] Failed to create dorm %s: %v", dDef.Name, err)
			}
		} else {
			dormMap[strings.ToLower(dDef.Name)] = existing.ID
		}
	}

	// 3. Seed Campers in batch
	var records []SeedCamperRecord
	if err := json.Unmarshal(campersJSON, &records); err != nil {
		return platoonsCreated, dormsCreated, 0, fmt.Errorf("failed to unmarshal campers JSON: %v", err)
	}

	var existingCampers []models.Camper
	db.Select("id", "registrationNumber").Find(&existingCampers)
	existingMap := make(map[string]models.Camper)
	for _, ec := range existingCampers {
		if ec.RegistrationNumber != nil {
			existingMap[*ec.RegistrationNumber] = ec
		}
	}

	var toCreate []models.Camper
	campersUpserted := 0

	for _, r := range records {
		var platoonID *string
		if pid, ok := platoonMap[strings.ToLower(r.Platoon)]; ok {
			platoonID = &pid
		}

		var dormID *string
		if did, ok := dormMap[strings.ToLower(r.Dorm)]; ok {
			dormID = &did
		}

		regNo := r.RegistrationNumber
		if existing, ok := existingMap[regNo]; ok {
			existing.Name = r.Name
			existing.Gender = strPtr(r.Gender)
			existing.TShirtSize = strPtr(r.TShirtSize)
			existing.Age = r.Age
			existing.PlatoonID = platoonID
			existing.DormID = dormID
			existing.Status = "active"
			db.Save(&existing)
			campersUpserted++
		} else {
			toCreate = append(toCreate, models.Camper{
				ID:                 generateID(),
				RegistrationNumber: &regNo,
				Name:               r.Name,
				Gender:             strPtr(r.Gender),
				TShirtSize:         strPtr(r.TShirtSize),
				Age:                r.Age,
				PlatoonID:          platoonID,
				DormID:             dormID,
				QRCode:             strPtr(regNo),
				Status:             "active",
			})
		}
	}

	if len(toCreate) > 0 {
		if err := db.CreateInBatches(&toCreate, 100).Error; err != nil {
			log.Printf("[SEED ERROR] CreateInBatches failed: %v", err)
		} else {
			campersUpserted += len(toCreate)
		}
	}

	// Ensure all campers in DB have an active status
	db.Exec("UPDATE Camper SET status = 'active' WHERE status IS NULL OR status = '' OR status = 'NULL'")

	return platoonsCreated, dormsCreated, campersUpserted, nil
}

func SeedCampersEndpointHandler(c *gin.Context) {
	platoonsCreated, dormsCreated, campersUpserted, err := SeedCampersLogic()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":          "Campers seeded successfully!",
		"platoonsCreated": platoonsCreated,
		"dormsCreated":    dormsCreated,
		"campersProcessed": campersUpserted,
	})
}
