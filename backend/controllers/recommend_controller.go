package controllers

import (
	"math"
	"news-recommend/database"
	"news-recommend/models"
	"news-recommend/utils"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

func GetRecommendNews(c *gin.Context) {
	userID := c.GetUint("user_id")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	if limit < 1 || limit > 100 {
		limit = 20
	}

	ApplyWeightDecay(userID)

	userTagScores := make(map[uint]float64)
	var userTags []models.UserTag
	database.DB.Preload("Tag").Where("user_id = ?", userID).Find(&userTags)

	for _, ut := range userTags {
		userTagScores[ut.TagID] = ut.Weight
	}

	var allNews []models.News
	database.DB.Preload("NewsTags.Tag").
		Where("publish_time > ?", time.Now().AddDate(0, 0, -7)).
		Find(&allNews)

	type ScoredNews struct {
		News  models.News
		Score float64
		Type  string
	}

	var scoredNews []ScoredNews

	readNewsIDs := make(map[uint]bool)
	var readHistories []models.ReadHistory
	database.DB.Where("user_id = ?", userID).Find(&readHistories)
	for _, rh := range readHistories {
		readNewsIDs[rh.NewsID] = true
	}

	for _, news := range allNews {
		if readNewsIDs[news.ID] {
			continue
		}

		tagScore := 0.0
		matchCount := 0
		totalTags := len(news.NewsTags)

		if totalTags > 0 {
			for _, nt := range news.NewsTags {
				if weight, exists := userTagScores[nt.TagID]; exists {
					tagScore += weight
					matchCount++
				}
			}

			if matchCount > 0 {
				tagScore = tagScore * float64(matchCount) / float64(totalTags)
			}
		}

		now := time.Now()
		hoursSincePublish := now.Sub(news.PublishTime).Hours()
		timeDecay := 1.0 / (1 + hoursSincePublish/24)

		viewScore := float64(news.ViewCount) * 1.0
		commentScore := float64(news.CommentCount) * 3.0
		hotScore := (viewScore + commentScore) * timeDecay

		finalScore := tagScore*0.6 + hotScore*0.4

		var recommendType string
		if tagScore > hotScore {
			recommendType = "tag_based"
		} else {
			recommendType = "hot_based"
		}

		scoredNews = append(scoredNews, ScoredNews{
			News:  news,
			Score: finalScore,
			Type:  recommendType,
		})
	}

	for i := 0; i < len(scoredNews); i++ {
		for j := i + 1; j < len(scoredNews); j++ {
			if scoredNews[i].Score < scoredNews[j].Score {
				scoredNews[i], scoredNews[j] = scoredNews[j], scoredNews[i]
			}
		}
	}

	if len(scoredNews) > limit {
		scoredNews = scoredNews[:limit]
	}

	var result []models.News
	for _, sn := range scoredNews {
		result = append(result, sn.News)

		recommendLog := models.RecommendLog{
			UserID:        userID,
			NewsID:        sn.News.ID,
			RecommendType: sn.Type,
			Score:         sn.Score,
			CreatedAt:     time.Now(),
		}
		database.DB.Create(&recommendLog)
	}

	if len(result) == 0 {
		GetHotNews(c)
		return
	}

	utils.Success(c, result)
}

func ApplyWeightDecay(userID uint) {
	var userTags []models.UserTag
	database.DB.Where("user_id = ?", userID).Find(&userTags)

	now := time.Now()
	decayRate := 0.05
	maxDays := 30

	for _, ut := range userTags {
		daysSinceLastClick := now.Sub(ut.LastClick).Hours() / 24

		if daysSinceLastClick > 1 {
			decayFactor := 1.0
			if daysSinceLastClick < float64(maxDays) {
				decayFactor = math.Pow(1-decayRate, daysSinceLastClick)
			} else {
				decayFactor = math.Pow(1-decayRate, float64(maxDays))
			}

			newWeight := ut.Weight * decayFactor

			if newWeight < 0.01 {
				database.DB.Delete(&ut)
			} else {
				ut.Weight = newWeight
				database.DB.Save(&ut)
			}
		}
	}
}

func GetUserTags(c *gin.Context) {
	userID := c.GetUint("user_id")

	var userTags []models.UserTag
	database.DB.Preload("Tag").
		Where("user_id = ?", userID).
		Order("weight DESC").
		Find(&userTags)

	utils.Success(c, userTags)
}

func GetRecommendStats(c *gin.Context) {
	userID := c.GetUint("user_id")

	var tagCount int64
	database.DB.Model(&models.UserTag{}).Where("user_id = ?", userID).Count(&tagCount)

	var historyCount int64
	database.DB.Model(&models.ReadHistory{}).Where("user_id = ?", userID).Count(&historyCount)

	var recommendCount int64
	database.DB.Model(&models.RecommendLog{}).Where("user_id = ?", userID).Count(&recommendCount)

	utils.Success(c, gin.H{
		"tag_count":       tagCount,
		"history_count":   historyCount,
		"recommend_count": recommendCount,
	})
}
