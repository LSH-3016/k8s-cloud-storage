package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	// Set Gin mode
	gin.SetMode(gin.ReleaseMode)

	// K8s client 초기화
	if err := initK8sClient(); err != nil {
		log.Printf("Warning: K8s client init failed: %v", err)
	}

	router := gin.Default()

	// CORS configuration
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// Health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// API routes
	api := router.Group("/api")
	{
		api.GET("/files", listFiles)
		api.GET("/files/download", downloadFile)
		api.POST("/files/upload", uploadFile)
		api.DELETE("/files", deleteFile)
		api.POST("/files/move", moveFile)
		api.POST("/files/copy", copyFile)
		api.POST("/files/rename", renameFile)
		api.POST("/files/mkdir", createDirectory)
		api.GET("/files/thumbnail", getThumbnail)
		api.GET("/system/stats", getSystemStats)
		
		// K8s routes
		api.GET("/k8s/resources", getK8sResources)
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
