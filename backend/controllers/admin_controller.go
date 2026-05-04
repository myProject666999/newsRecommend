package controllers

import (
	"errors"
	"news-recommend/database"
	"news-recommend/models"
	"news-recommend/utils"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

func GetDashboardStats(c *gin.Context) {
	var userCount int64
	database.DB.Model(&models.User{}).Where("role = ?", "user").Count(&userCount)

	var newsCount int64
	database.DB.Model(&models.News{}).Count(&newsCount)

	var commentCount int64
	database.DB.Model(&models.Comment{}).Count(&commentCount)

	var todayViews int64
	todayStart := time.Now().Truncate(24 * time.Hour)
	database.DB.Model(&models.ReadHistory{}).Where("read_time >= ?", todayStart).Count(&todayViews)

	var recentNews []models.News
	database.DB.Order("publish_time DESC").Limit(10).Find(&recentNews)

	var recentComments []models.Comment
	database.DB.Preload("User").Preload("News").
		Order("created_at DESC").Limit(10).Find(&recentComments)

	var categoryStats []struct {
		Category string
		Count    int64
	}
	database.DB.Model(&models.News{}).
		Select("category, COUNT(*) as count").
		Where("category != ''").
		Group("category").
		Scan(&categoryStats)

	utils.Success(c, gin.H{
		"user_count":        userCount,
		"news_count":        newsCount,
		"comment_count":     commentCount,
		"today_views":       todayViews,
		"recent_news":       recentNews,
		"recent_comments":   recentComments,
		"category_stats":    categoryStats,
	})
}

func GetUsers(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	keyword := c.Query("keyword")

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	query := database.DB.Model(&models.User{}).Where("role = ?", "user")

	if keyword != "" {
		query = query.Where("username LIKE ? OR email LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	}

	var total int64
	query.Count(&total)

	var users []models.User
	offset := (page - 1) * pageSize
	query.Preload("UserTags.Tag").
		Order("created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&users)

	utils.Success(c, gin.H{
		"users": users,
		"total": total,
		"page":  page,
	})
}

func UpdateUserStatus(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := strconv.ParseUint(userIDStr, 10, 64)
	if err != nil {
		utils.BadRequest(c, "无效的用户ID")
		return
	}

	var req struct {
		Status string `json:"status"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	result := database.DB.Model(&models.User{}).Where("id = ?", userID).Update("role", req.Status)
	if result.Error != nil {
		utils.InternalServerError(c, "更新失败")
		return
	}

	utils.SuccessWithMessage(c, "更新成功", nil)
}

func DeleteUser(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := strconv.ParseUint(userIDStr, 10, 64)
	if err != nil {
		utils.BadRequest(c, "无效的用户ID")
		return
	}

	result := database.DB.Delete(&models.User{}, userID)
	if result.Error != nil {
		utils.InternalServerError(c, "删除失败")
		return
	}

	utils.SuccessWithMessage(c, "删除成功", nil)
}

func AdminGetNews(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	category := c.Query("category")
	keyword := c.Query("keyword")

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	query := database.DB.Model(&models.News{})

	if category != "" {
		query = query.Where("category = ?", category)
	}

	if keyword != "" {
		query = query.Where("title LIKE ? OR source LIKE ?", "%"+keyword+"%", "%"+keyword+"%")
	}

	var total int64
	query.Count(&total)

	var newsList []models.News
	offset := (page - 1) * pageSize
	query.Preload("NewsTags.Tag").
		Order("publish_time DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&newsList)

	utils.Success(c, gin.H{
		"news":  newsList,
		"total": total,
		"page":  page,
	})
}

func CreateNews(c *gin.Context) {
	var req struct {
		Title       string   `json:"title" binding:"required"`
		Content     string   `json:"content"`
		Summary     string   `json:"summary"`
		CoverImage  string   `json:"cover_image"`
		Source      string   `json:"source"`
		SourceUrl   string   `json:"source_url"`
		Category    string   `json:"category"`
		PublishTime string   `json:"publish_time"`
		Tags        []string `json:"tags"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	publishTime := time.Now()
	if req.PublishTime != "" {
		parsedTime, err := time.Parse("2006-01-02 15:04:05", req.PublishTime)
		if err == nil {
			publishTime = parsedTime
		}
	}

	news := models.News{
		Title:       req.Title,
		Content:     req.Content,
		Summary:     req.Summary,
		CoverImage:  req.CoverImage,
		Source:      req.Source,
		SourceUrl:   req.SourceUrl,
		Category:    req.Category,
		PublishTime: publishTime,
	}

	if err := database.DB.Create(&news).Error; err != nil {
		utils.InternalServerError(c, "创建失败: "+err.Error())
		return
	}

	for _, tagName := range req.Tags {
		tagName = strings.TrimSpace(tagName)
		if tagName == "" {
			continue
		}

		var tag models.Tag
		if err := database.DB.Where("name = ?", tagName).First(&tag).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				tag = models.Tag{Name: tagName}
				if err := database.DB.Create(&tag).Error; err != nil {
					continue
				}
			} else {
				continue
			}
		}

		var newsTag models.NewsTag
		if err := database.DB.Where("news_id = ? AND tag_id = ?", news.ID, tag.ID).First(&newsTag).Error; err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				newsTag = models.NewsTag{
					NewsID: news.ID,
					TagID:  tag.ID,
				}
				database.DB.Create(&newsTag)
			}
		}
	}

	utils.SuccessWithMessage(c, "创建成功", gin.H{"id": news.ID})
}

func UpdateNews(c *gin.Context) {
	newsIDStr := c.Param("id")
	newsID, err := strconv.ParseUint(newsIDStr, 10, 64)
	if err != nil {
		utils.BadRequest(c, "无效的新闻ID")
		return
	}

	var req struct {
		Title       string   `json:"title"`
		Content     string   `json:"content"`
		Summary     string   `json:"summary"`
		CoverImage  string   `json:"cover_image"`
		Source      string   `json:"source"`
		SourceUrl   string   `json:"source_url"`
		Category    string   `json:"category"`
		PublishTime string   `json:"publish_time"`
		Tags        []string `json:"tags"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	updates := make(map[string]interface{})
	if req.Title != "" {
		updates["title"] = req.Title
	}
	if req.Content != "" {
		updates["content"] = req.Content
	}
	if req.Summary != "" {
		updates["summary"] = req.Summary
	}
	if req.CoverImage != "" {
		updates["cover_image"] = req.CoverImage
	}
	if req.Source != "" {
		updates["source"] = req.Source
	}
	if req.SourceUrl != "" {
		updates["source_url"] = req.SourceUrl
	}
	if req.Category != "" {
		updates["category"] = req.Category
	}

	if req.PublishTime != "" {
		parsedTime, err := time.Parse("2006-01-02 15:04:05", req.PublishTime)
		if err == nil {
			updates["publish_time"] = parsedTime
		}
	}

	if len(updates) > 0 {
		if err := database.DB.Model(&models.News{}).Where("id = ?", newsID).Updates(updates).Error; err != nil {
			utils.InternalServerError(c, "更新失败: "+err.Error())
			return
		}
	}

	if req.Tags != nil {
		database.DB.Where("news_id = ?", newsID).Delete(&models.NewsTag{})
		for _, tagName := range req.Tags {
			tagName = strings.TrimSpace(tagName)
			if tagName == "" {
				continue
			}

			var tag models.Tag
			if err := database.DB.Where("name = ?", tagName).First(&tag).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					tag = models.Tag{Name: tagName}
					if err := database.DB.Create(&tag).Error; err != nil {
						continue
					}
				} else {
					continue
				}
			}

			newsTag := models.NewsTag{
				NewsID: uint(newsID),
				TagID:  tag.ID,
			}
			database.DB.Create(&newsTag)
		}
	}

	utils.SuccessWithMessage(c, "更新成功", nil)
}

func DeleteNews(c *gin.Context) {
	newsIDStr := c.Param("id")
	newsID, err := strconv.ParseUint(newsIDStr, 10, 64)
	if err != nil {
		utils.BadRequest(c, "无效的新闻ID")
		return
	}

	result := database.DB.Delete(&models.News{}, newsID)
	if result.Error != nil {
		utils.InternalServerError(c, "删除失败")
		return
	}

	database.DB.Where("news_id = ?", newsID).Delete(&models.NewsTag{})
	database.DB.Where("news_id = ?", newsID).Delete(&models.Comment{})

	utils.SuccessWithMessage(c, "删除成功", nil)
}

func AdminGetComments(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))
	status := c.Query("status")
	keyword := c.Query("keyword")

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	query := database.DB.Model(&models.Comment{})

	if status != "" {
		statusInt, _ := strconv.Atoi(status)
		query = query.Where("status = ?", statusInt)
	}

	if keyword != "" {
		query = query.Where("content LIKE ?", "%"+keyword+"%")
	}

	var total int64
	query.Count(&total)

	var comments []models.Comment
	offset := (page - 1) * pageSize
	query.Preload("User").Preload("News").
		Order("created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&comments)

	result := make([]gin.H, 0, len(comments))
	for _, comment := range comments {
		item := gin.H{
			"id":         comment.ID,
			"content":    comment.Content,
			"status":     comment.Status,
			"created_at": comment.CreatedAt,
		}
		if comment.User.ID > 0 {
			item["user_name"] = comment.User.Username
		}
		if comment.News.ID > 0 {
			item["news_title"] = comment.News.Title
		}
		result = append(result, item)
	}

	utils.Success(c, gin.H{
		"comments": result,
		"total":    total,
		"page":     page,
	})
}

func UpdateCommentStatus(c *gin.Context) {
	commentIDStr := c.Param("id")
	commentID, err := strconv.ParseUint(commentIDStr, 10, 64)
	if err != nil {
		utils.BadRequest(c, "无效的评论ID")
		return
	}

	var req struct {
		Status int `json:"status" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	result := database.DB.Model(&models.Comment{}).Where("id = ?", commentID).Update("status", req.Status)
	if result.Error != nil {
		utils.InternalServerError(c, "更新失败")
		return
	}

	utils.SuccessWithMessage(c, "更新成功", nil)
}

func AdminDeleteComment(c *gin.Context) {
	commentIDStr := c.Param("id")
	commentID, err := strconv.ParseUint(commentIDStr, 10, 64)
	if err != nil {
		utils.BadRequest(c, "无效的评论ID")
		return
	}

	var comment models.Comment
	if err := database.DB.First(&comment, commentID).Error; err != nil {
		utils.NotFound(c, "评论不存在")
		return
	}

	if err := database.DB.Delete(&comment).Error; err != nil {
		utils.InternalServerError(c, "删除失败")
		return
	}

	database.DB.Model(&models.News{}).
		Where("id = ?", comment.NewsID).
		UpdateColumn("comment_count", gorm.Expr("comment_count - 1"))

	utils.SuccessWithMessage(c, "删除成功", nil)
}

func AdminUpdatePassword(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req UpdatePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	var user models.User
	if err := database.DB.First(&user, userID).Error; err != nil {
		utils.NotFound(c, "用户不存在")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.OldPassword)); err != nil {
		utils.BadRequest(c, "原密码错误")
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		utils.InternalServerError(c, "密码加密失败")
		return
	}

	user.Password = string(hashedPassword)
	if err := database.DB.Save(&user).Error; err != nil {
		utils.InternalServerError(c, "更新密码失败: "+err.Error())
		return
	}

	utils.SuccessWithMessage(c, "密码更新成功", nil)
}

func GetCrawlTasks(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	var total int64
	database.DB.Model(&models.CrawlTask{}).Count(&total)

	var tasks []models.CrawlTask
	offset := (page - 1) * pageSize
	database.DB.Order("created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&tasks)

	result := make([]gin.H, 0, len(tasks))
	for _, task := range tasks {
		result = append(result, gin.H{
			"id":            task.ID,
			"source":        task.Source,
			"category":      task.Category,
			"count":         task.TotalCount,
			"success_count": task.SuccessCount,
			"status":        task.Status,
			"error_message": task.ErrorMsg,
			"created_at":    task.CreatedAt,
			"start_time":    task.StartTime,
			"end_time":      task.EndTime,
		})
	}

	utils.Success(c, gin.H{
		"tasks": result,
		"total": total,
		"page":  page,
	})
}

func CreateCrawlTask(c *gin.Context) {
	var req struct {
		Source   string `json:"source" binding:"required"`
		Category string `json:"category"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	task := models.CrawlTask{
		Source:   req.Source,
		Category: req.Category,
		Status:   "pending",
	}

	if err := database.DB.Create(&task).Error; err != nil {
		utils.InternalServerError(c, "创建失败: "+err.Error())
		return
	}

	utils.SuccessWithMessage(c, "创建成功", gin.H{"id": task.ID})
}

func GetTags(c *gin.Context) {
	var tags []models.Tag
	database.DB.Order("name ASC").Find(&tags)

	utils.Success(c, tags)
}

func CreateTag(c *gin.Context) {
	var req struct {
		Name string `json:"name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误")
		return
	}

	var existingTag models.Tag
	if database.DB.Where("name = ?", req.Name).First(&existingTag).Error == nil {
		utils.BadRequest(c, "标签已存在")
		return
	}

	tag := models.Tag{Name: req.Name}
	if err := database.DB.Create(&tag).Error; err != nil {
		utils.InternalServerError(c, "创建失败")
		return
	}

	utils.SuccessWithMessage(c, "创建成功", gin.H{"id": tag.ID})
}

func DeleteTag(c *gin.Context) {
	tagIDStr := c.Param("id")
	tagID, err := strconv.ParseUint(tagIDStr, 10, 64)
	if err != nil {
		utils.BadRequest(c, "无效的标签ID")
		return
	}

	result := database.DB.Delete(&models.Tag{}, tagID)
	if result.Error != nil {
		utils.InternalServerError(c, "删除失败")
		return
	}

	database.DB.Where("tag_id = ?", tagID).Delete(&models.NewsTag{})
	database.DB.Where("tag_id = ?", tagID).Delete(&models.UserTag{})

	utils.SuccessWithMessage(c, "删除成功", nil)
}
