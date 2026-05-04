package controllers

import (
	"news-recommend/database"
	"news-recommend/models"
	"news-recommend/utils"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

func GetNewsList(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	category := c.Query("category")
	keyword := c.Query("keyword")

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 10
	}

	query := database.DB.Model(&models.News{}).Preload("NewsTags.Tag")

	if category != "" {
		query = query.Where("category = ?", category)
	}

	if keyword != "" {
		query = query.Where("title LIKE ? OR content LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	}

	var total int64
	query.Count(&total)

	var newsList []models.News
	offset := (page - 1) * pageSize
	query.Order("publish_time DESC").Offset(offset).Limit(pageSize).Find(&newsList)

	utils.Success(c, gin.H{
		"list":      newsList,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

func GetHotNews(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	if limit < 1 || limit > 50 {
		limit = 10
	}

	var newsList []models.News
	database.DB.Model(&models.News{}).
		Preload("NewsTags.Tag").
		Order("hot_score DESC").
		Limit(limit).
		Find(&newsList)

	utils.Success(c, newsList)
}

func GetNewsDetail(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 64)
	if err != nil {
		utils.BadRequest(c, "无效的新闻ID")
		return
	}

	var news models.News
	if err := database.DB.Preload("NewsTags.Tag").First(&news, id).Error; err != nil {
		utils.NotFound(c, "新闻不存在")
		return
	}

	database.DB.Model(&news).Update("view_count", news.ViewCount+1)

	userID, exists := c.Get("user_id")
	if exists {
		readHistory := models.ReadHistory{
			UserID:   userID.(uint),
			NewsID:   news.ID,
			ReadTime: time.Now(),
		}
		database.DB.Create(&readHistory)

		for _, newsTag := range news.NewsTags {
			var userTag models.UserTag
			result := database.DB.Where("user_id = ? AND tag_id = ?", userID, newsTag.TagID).First(&userTag)

			if result.Error != nil {
				userTag = models.UserTag{
					UserID:    userID.(uint),
					TagID:     newsTag.TagID,
					Weight:    1.0,
					LastClick: time.Now(),
				}
				database.DB.Create(&userTag)
			} else {
				userTag.Weight = userTag.Weight + 0.5
				userTag.LastClick = time.Now()
				database.DB.Save(&userTag)
			}
		}
	}

	utils.Success(c, news)
}

func GetCategories(c *gin.Context) {
	var categories []string
	database.DB.Model(&models.News{}).
		Distinct("category").
		Where("category != ''").
		Pluck("category", &categories)

	utils.Success(c, categories)
}

func UpdateHotScore() {
	var newsList []models.News
	database.DB.Find(&newsList)

	now := time.Now()
	for _, news := range newsList {
		hoursSincePublish := now.Sub(news.PublishTime).Hours()
		timeDecay := 1.0 / (1 + hoursSincePublish/24)

		viewScore := float64(news.ViewCount) * 1.0
		commentScore := float64(news.CommentCount) * 3.0

		hotScore := (viewScore + commentScore) * timeDecay

		database.DB.Model(&news).Update("hot_score", hotScore)
	}
}
