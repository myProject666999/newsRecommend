package controllers

import (
	"news-recommend/database"
	"news-recommend/models"
	"news-recommend/utils"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type CreateCommentRequest struct {
	NewsID  uint   `json:"news_id" binding:"required"`
	Content string `json:"content" binding:"required,max=500"`
}

func CreateComment(c *gin.Context) {
	userID := c.GetUint("user_id")

	var req CreateCommentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		utils.BadRequest(c, "参数错误: "+err.Error())
		return
	}

	var news models.News
	if err := database.DB.First(&news, req.NewsID).Error; err != nil {
		utils.NotFound(c, "新闻不存在")
		return
	}

	comment := models.Comment{
		UserID:    userID,
		NewsID:    req.NewsID,
		Content:   req.Content,
		Status:    1,
		CreatedAt: time.Now(),
	}

	if err := database.DB.Create(&comment).Error; err != nil {
		utils.InternalServerError(c, "评论创建失败: "+err.Error())
		return
	}

	database.DB.Model(&news).Update("comment_count", news.CommentCount+1)

	utils.SuccessWithMessage(c, "评论成功", gin.H{
		"id":         comment.ID,
		"created_at": comment.CreatedAt,
	})
}

func GetNewsComments(c *gin.Context) {
	newsIDStr := c.Param("news_id")
	newsID, err := strconv.ParseUint(newsIDStr, 10, 64)
	if err != nil {
		utils.BadRequest(c, "无效的新闻ID")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	var total int64
	database.DB.Model(&models.Comment{}).
		Where("news_id = ? AND status = 1", newsID).
		Count(&total)

	var comments []models.Comment
	offset := (page - 1) * pageSize
	database.DB.Preload("User").
		Where("news_id = ? AND status = 1", newsID).
		Order("created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&comments)

	utils.Success(c, gin.H{
		"list":      comments,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

func GetMyComments(c *gin.Context) {
	userID := c.GetUint("user_id")

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "20"))

	if page < 1 {
		page = 1
	}
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	var total int64
	database.DB.Model(&models.Comment{}).
		Where("user_id = ?", userID).
		Count(&total)

	var comments []models.Comment
	offset := (page - 1) * pageSize
	database.DB.Preload("News").
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Offset(offset).
		Limit(pageSize).
		Find(&comments)

	utils.Success(c, gin.H{
		"list":      comments,
		"total":     total,
		"page":      page,
		"page_size": pageSize,
	})
}

func DeleteComment(c *gin.Context) {
	userID := c.GetUint("user_id")
	userRole := c.GetString("role")

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

	if comment.UserID != userID && userRole != "admin" {
		utils.Forbidden(c, "无权限删除此评论")
		return
	}

	if err := database.DB.Delete(&comment).Error; err != nil {
		utils.InternalServerError(c, "删除失败: "+err.Error())
		return
	}

	database.DB.Model(&models.News{}).
		Where("id = ?", comment.NewsID).
		UpdateColumn("comment_count", gorm.Expr("comment_count - 1"))

	utils.SuccessWithMessage(c, "删除成功", nil)
}
