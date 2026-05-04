package routes

import (
	"news-recommend/controllers"
	"news-recommend/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(r *gin.Engine) {
	r.Use(middleware.OptionalAuth())

	api := r.Group("/api")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", controllers.Register)
			auth.POST("/login", controllers.Login)
		}

		news := api.Group("/news")
		{
			news.GET("", controllers.GetNewsList)
			news.GET("/hot", controllers.GetHotNews)
			news.GET("/categories", controllers.GetCategories)
			news.GET("/:id", controllers.GetNewsDetail)
		}

		comments := api.Group("/comments")
		{
			comments.GET("/news/:news_id", controllers.GetNewsComments)
		}

		authRequired := api.Group("")
		authRequired.Use(middleware.JWTAuth())
		{
			user := authRequired.Group("/user")
			{
				user.GET("/profile", controllers.GetCurrentUser)
				user.PUT("/profile", controllers.UpdateUserInfo)
				user.PUT("/password", controllers.UpdatePassword)
				user.GET("/history", controllers.GetReadHistory)
				user.GET("/tags", controllers.GetUserTags)
				user.GET("/comments", controllers.GetMyComments)
				user.DELETE("/comments/:id", controllers.DeleteComment)
			}

			authRequired.POST("/comments", controllers.CreateComment)

			recommend := authRequired.Group("/recommend")
			{
				recommend.GET("", controllers.GetRecommendNews)
				recommend.GET("/stats", controllers.GetRecommendStats)
			}
		}

		admin := api.Group("/admin")
		admin.Use(middleware.JWTAuth(), middleware.AdminAuth())
		{
			admin.GET("/dashboard", controllers.GetDashboardStats)

			adminUsers := admin.Group("/users")
			{
				adminUsers.GET("", controllers.GetUsers)
				adminUsers.PUT("/:id/status", controllers.UpdateUserStatus)
				adminUsers.DELETE("/:id", controllers.DeleteUser)
			}

			adminNews := admin.Group("/news")
			{
				adminNews.GET("", controllers.AdminGetNews)
				adminNews.POST("", controllers.CreateNews)
				adminNews.PUT("/:id", controllers.UpdateNews)
				adminNews.DELETE("/:id", controllers.DeleteNews)
			}

			adminComments := admin.Group("/comments")
			{
				adminComments.GET("", controllers.AdminGetComments)
				adminComments.PUT("/:id/status", controllers.UpdateCommentStatus)
				adminComments.DELETE("/:id", controllers.AdminDeleteComment)
			}

			adminTags := admin.Group("/tags")
			{
				adminTags.GET("", controllers.GetTags)
				adminTags.POST("", controllers.CreateTag)
				adminTags.DELETE("/:id", controllers.DeleteTag)
			}

			adminCrawl := admin.Group("/crawl")
			{
				adminCrawl.GET("/tasks", controllers.GetCrawlTasks)
				adminCrawl.POST("/tasks", controllers.CreateCrawlTask)
			}

			admin.PUT("/password", controllers.AdminUpdatePassword)
		}
	}
}
