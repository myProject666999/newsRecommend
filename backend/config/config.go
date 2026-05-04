package config

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/spf13/viper"
)

type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	JWT      JWTConfig
	Log      LogConfig
}

type ServerConfig struct {
	Port int
	Mode string
}

type DatabaseConfig struct {
	Type   string
	Sqlite SqliteConfig
}

type SqliteConfig struct {
	Path string
}

type JWTConfig struct {
	Secret string
	Expire int
}

type LogConfig struct {
	Level      string
	Filename   string
	MaxSize    int
	MaxBackups int
	MaxAge     int
}

var AppConfig *Config

func InitConfig() {
	execPath, err := os.Executable()
	if err != nil {
		panic(fmt.Errorf("get executable path failed: %s", err))
	}
	execDir := filepath.Dir(execPath)

	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(filepath.Join(execDir, "config"))
	viper.AddConfigPath("./config")
	viper.AddConfigPath(".")

	err = viper.ReadInConfig()
	if err != nil {
		panic(fmt.Errorf("read config file failed: %s", err))
	}

	AppConfig = &Config{}
	if err := viper.Unmarshal(AppConfig); err != nil {
		panic(fmt.Errorf("unmarshal config failed: %s", err))
	}

	fmt.Printf("Config loaded successfully. Server port: %d\n", AppConfig.Server.Port)
}
