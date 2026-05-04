package models

import (
	"gorm.io/gorm"
	"time"
)

type User struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Username     string         `gorm:"uniqueIndex;size:50;not null" json:"username"`
	Password     string         `gorm:"size:255;not null" json:"-"`
	Email        string         `gorm:"size:100" json:"email"`
	Phone        string         `gorm:"size:20" json:"phone"`
	Avatar       string         `gorm:"size:255" json:"avatar"`
	Role         string         `gorm:"size:20;default:'user'" json:"role"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
	UserTags     []UserTag      `json:"user_tags,omitempty"`
	Comments     []Comment      `json:"comments,omitempty"`
	ReadHistories []ReadHistory `json:"read_histories,omitempty"`
}

type News struct {
	ID           uint           `gorm:"primaryKey" json:"id"`
	Title        string         `gorm:"size:500;not null" json:"title"`
	Content      string         `gorm:"type:text" json:"content"`
	Summary      string         `gorm:"size:1000" json:"summary"`
	CoverImage   string         `gorm:"size:500" json:"cover_image"`
	Source       string         `gorm:"size:100" json:"source"`
	SourceUrl    string         `gorm:"size:500" json:"source_url"`
	Category     string         `gorm:"size:50;index" json:"category"`
	PublishTime  time.Time      `json:"publish_time"`
	ViewCount    int            `gorm:"default:0" json:"view_count"`
	CommentCount int            `gorm:"default:0" json:"comment_count"`
	HotScore     float64        `gorm:"default:0;index" json:"hot_score"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`
	NewsTags     []NewsTag      `json:"news_tags,omitempty"`
	Comments     []Comment      `json:"comments,omitempty"`
}

type Tag struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Name      string         `gorm:"uniqueIndex;size:50;not null" json:"name"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	NewsTags  []NewsTag      `json:"news_tags,omitempty"`
	UserTags  []UserTag      `json:"user_tags,omitempty"`
}

type NewsTag struct {
	ID     uint `gorm:"primaryKey" json:"id"`
	NewsID uint `gorm:"uniqueIndex:idx_news_tag;not null" json:"news_id"`
	TagID  uint `gorm:"uniqueIndex:idx_news_tag;not null" json:"tag_id"`
	News   News `gorm:"foreignKey:NewsID" json:"-"`
	Tag    Tag  `gorm:"foreignKey:TagID" json:"tag,omitempty"`
}

type UserTag struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"uniqueIndex:idx_user_tag;not null" json:"user_id"`
	TagID     uint      `gorm:"uniqueIndex:idx_user_tag;not null" json:"tag_id"`
	Weight    float64   `gorm:"default:1.0;not null" json:"weight"`
	LastClick time.Time `json:"last_click"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
	User      User      `gorm:"foreignKey:UserID" json:"-"`
	Tag       Tag       `gorm:"foreignKey:TagID" json:"tag,omitempty"`
}

type Comment struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	UserID    uint           `gorm:"not null;index" json:"user_id"`
	NewsID    uint           `gorm:"not null;index" json:"news_id"`
	Content   string         `gorm:"type:text;not null" json:"content"`
	Status    int            `gorm:"default:1" json:"status"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
	User      User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
	News      News           `gorm:"foreignKey:NewsID" json:"news,omitempty"`
}

type ReadHistory struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"not null;index" json:"user_id"`
	NewsID    uint      `gorm:"not null;index" json:"news_id"`
	ReadTime  time.Time `json:"read_time"`
	Duration  int       `gorm:"default:0" json:"duration"`
	User      User      `gorm:"foreignKey:UserID" json:"-"`
	News      News      `gorm:"foreignKey:NewsID" json:"news,omitempty"`
}

type CrawlTask struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	Source      string         `gorm:"size:50;not null" json:"source"`
	Category    string         `gorm:"size:50" json:"category"`
	Status      string         `gorm:"size:20;default:'pending'" json:"status"`
	StartTime   *time.Time     `json:"start_time"`
	EndTime     *time.Time     `json:"end_time"`
	TotalCount  int            `gorm:"default:0" json:"total_count"`
	SuccessCount int           `gorm:"default:0" json:"success_count"`
	ErrorMsg    string         `gorm:"type:text" json:"error_msg"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"-"`
}

type RecommendLog struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	UserID      uint      `gorm:"index" json:"user_id"`
	NewsID      uint      `gorm:"not null" json:"news_id"`
	RecommendType string    `gorm:"size:20" json:"recommend_type"`
	Score       float64   `json:"score"`
	CreatedAt   time.Time `json:"created_at"`
}
