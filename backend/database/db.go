package database

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	"news-recommend/config"
	"news-recommend/models"

	"golang.org/x/crypto/bcrypt"
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB() {
	dbConfig := config.AppConfig.Database

	var err error

	if dbConfig.Type == "sqlite" {
		dbPath := dbConfig.Sqlite.Path
		ensureDir(dbPath)

		DB, err = gorm.Open(sqlite.Open(dbPath), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
	} else {
		panic(fmt.Errorf("unsupported database type: %s", dbConfig.Type))
	}

	if err != nil {
		panic(fmt.Errorf("failed to connect database: %s", err))
	}

	err = DB.AutoMigrate(
		&models.User{},
		&models.News{},
		&models.Tag{},
		&models.NewsTag{},
		&models.UserTag{},
		&models.Comment{},
		&models.ReadHistory{},
		&models.CrawlTask{},
		&models.RecommendLog{},
	)
	if err != nil {
		panic(fmt.Errorf("failed to migrate database: %s", err))
	}

	initSeedData()

	fmt.Println("Database initialized successfully")
}

func ensureDir(dbPath string) {
	dir := filepath.Dir(dbPath)
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		os.MkdirAll(dir, 0755)
	}
}

func initSeedData() {
	var adminCount int64
	DB.Model(&models.User{}).Where("role = ?", "admin").Count(&adminCount)
	if adminCount == 0 {
		hashedPassword, _ := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
		admin := models.User{
			Username: "admin",
			Password: string(hashedPassword),
			Email:    "admin@example.com",
			Role:     "admin",
		}
		DB.Create(&admin)
		fmt.Println("Admin user created: admin / admin123")
	}

	var tagCount int64
	DB.Model(&models.Tag{}).Count(&tagCount)
	if tagCount == 0 {
		tags := []models.Tag{
			{Name: "科技"},
			{Name: "体育"},
			{Name: "娱乐"},
			{Name: "财经"},
			{Name: "政治"},
			{Name: "社会"},
			{Name: "教育"},
			{Name: "健康"},
		}
		DB.Create(&tags)
		fmt.Println("Default tags created")
	}

	var newsCount int64
	DB.Model(&models.News{}).Count(&newsCount)
	if newsCount == 0 {
		createSampleNews()
	}
}

func createSampleNews() {
	sampleNews := []models.News{
		{
			Title:       "人工智能技术新突破：大语言模型性能提升30%",
			Content:     "近日，全球顶级AI研究机构发布了最新研究成果，通过创新的架构设计和训练方法，新一代大语言模型在多项基准测试中性能提升超过30%。这一突破将为自然语言处理领域带来革命性变化，有望在智能客服、机器翻译、内容生成等领域得到更广泛的应用。专家表示，这标志着人工智能技术进入了一个新的发展阶段。",
			Summary:     "新一代大语言模型性能提升超30%，将为NLP领域带来革命性变化。",
			CoverImage:  "",
			Source:      "科技日报",
			SourceUrl:   "",
			Category:    "科技",
			PublishTime: time.Now().Add(-2 * time.Hour),
			ViewCount:   1520,
			CommentCount: 86,
			HotScore:    85.5,
		},
		{
			Title:       "世界杯预选赛：国足2-1逆转获胜，小组出线形势大好",
			Content:     "在刚刚结束的世界杯预选赛亚洲区比赛中，中国国家队在主场2-1逆转战胜对手。上半场0-1落后的情况下，下半场教练调整战术，连换三人，最终凭借两粒精彩进球完成逆转。此役过后，国足在小组积分榜上跃升至第二位，出线形势一片大好。球迷们纷纷表示，这是近年来国足表现最出色的一场比赛。",
			Summary:     "国足世预赛2-1逆转获胜，小组积分榜升至第二位。",
			CoverImage:  "",
			Source:      "体育周报",
			SourceUrl:   "",
			Category:    "体育",
			PublishTime: time.Now().Add(-5 * time.Hour),
			ViewCount:   3280,
			CommentCount: 256,
			HotScore:    92.3,
		},
		{
			Title:       "央行降准0.5个百分点，释放长期资金约1万亿元",
			Content:     "中国人民银行今日宣布，下调金融机构存款准备金率0.5个百分点，此次降准为全面降准，将释放长期资金约1万亿元。央行表示，此次降准旨在优化金融机构资金结构，增强金融机构支持实体经济的能力。分析人士认为，降准将有助于降低社会融资成本，对实体经济发展形成有力支撑。市场普遍预期，此举将对股市、债市产生积极影响。",
			Summary:     "央行全面降准0.5个百分点，释放长期资金约1万亿元。",
			CoverImage:  "",
			Source:      "财经时报",
			SourceUrl:   "",
			Category:    "财经",
			PublishTime: time.Now().Add(-8 * time.Hour),
			ViewCount:   2150,
			CommentCount: 124,
			HotScore:    78.9,
		},
		{
			Title:       "教育改革新政策出台：中小学课后服务全面升级",
			Content:     "教育部近日发布《关于进一步做好义务教育课后服务工作的通知》，要求各地中小学全面升级课后服务。新政策明确，课后服务时间不得早于当地正常下班时间，有条件的学校可提供延时托管服务。此外，课后服务内容将更加丰富，除作业辅导外，还将开展体育、艺术、科普等多种活动。专家表示，这一政策将有效缓解家长\"接送难\"问题，促进学生全面发展。",
			Summary:     "教育部发布课后服务新政策，中小学课后服务全面升级。",
			CoverImage:  "",
			Source:      "教育周刊",
			SourceUrl:   "",
			Category:    "教育",
			PublishTime: time.Now().Add(-12 * time.Hour),
			ViewCount:   1890,
			CommentCount: 98,
			HotScore:    65.4,
		},
		{
			Title:       "健康生活新趋势：中医养生受到年轻人追捧",
			Content:     "近年来，中医养生不再是中老年人的专利，越来越多的年轻人开始关注并践行中医养生理念。数据显示，90后、00后已成为中医养生产品的主要消费群体。艾灸、拔罐、中药茶饮等传统养生方式在年轻人中流行起来。专家认为，这一现象反映了当代年轻人对健康生活的重视，同时也体现了传统文化的传承与创新。建议年轻人在养生时要因人而异，最好在专业医师指导下进行。",
			Summary:     "中医养生受年轻人追捧，90后、00后成为主要消费群体。",
			CoverImage:  "",
			Source:      "健康生活",
			SourceUrl:   "",
			Category:    "健康",
			PublishTime: time.Now().Add(-24 * time.Hour),
			ViewCount:   1340,
			CommentCount: 67,
			HotScore:    52.8,
		},
	}

	for i := range sampleNews {
		DB.Create(&sampleNews[i])

		var tag models.Tag
		DB.Where("name = ?", sampleNews[i].Category).First(&tag)
		if tag.ID > 0 {
			newsTag := models.NewsTag{
				NewsID: sampleNews[i].ID,
				TagID:  tag.ID,
			}
			DB.Create(&newsTag)
		}
	}

	fmt.Println("Sample news data created")
}
