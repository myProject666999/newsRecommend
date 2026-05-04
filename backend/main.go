package main

import (
	"fmt"
	"news-recommend/config"
	"news-recommend/database"
	"news-recommend/routes"
	"news-recommend/utils"

	"github.com/gin-gonic/gin"
)

func main() {
	config.InitConfig()

	utils.InitLogger()
	defer utils.Logger.Sync()

	database.InitDB()

	gin.SetMode(config.AppConfig.Server.Mode)

	r := gin.New()
	r.Use(utils.GinLogger(), utils.GinRecovery())

	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Authorization")
		c.Header("Access-Control-Expose-Headers", "Content-Length, Access-Control-Allow-Origin, Access-Control-Allow-Headers, Content-Type")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}

		c.Next()
	})

	routes.SetupRoutes(r)

	port := config.AppConfig.Server.Port
	addr := fmt.Sprintf(":%d", port)

	fmt.Printf("Server starting on port %d...\n", port)
	fmt.Printf("API URL: http://localhost:%d/api\n", port)
	fmt.Printf("Admin Account: admin / admin123\n")

	if err := r.Run(addr); err != nil {
		fmt.Printf("Failed to start server: %v\n", err)
	}
}
