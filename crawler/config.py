class Config:
    SINA_NEWS_CATEGORIES = {
        'tech': '科技',
        'sports': '体育',
        'ent': '娱乐',
        'finance': '财经',
        'politics': '政治',
        'society': '社会',
        'edu': '教育',
        'health': '健康'
    }

    SINA_NEWS_URLS = {
        'tech': 'https://tech.sina.com.cn/',
        'sports': 'https://sports.sina.com.cn/',
        'ent': 'https://ent.sina.com.cn/',
        'finance': 'https://finance.sina.com.cn/',
        'politics': 'https://news.sina.com.cn/china/',
        'society': 'https://news.sina.com.cn/society/',
        'edu': 'https://edu.sina.com.cn/',
        'health': 'https://health.sina.com.cn/'
    }

    REQUEST_HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive'
    }

    REQUEST_TIMEOUT = 15
    REQUEST_RETRY_TIMES = 3
    REQUEST_RETRY_DELAY = 2

    CONCURRENT_REQUESTS = 5

    DATABASE_CONFIG = {
        'type': 'sqlite',
        'sqlite_path': '../backend/data/news.db',
    }
