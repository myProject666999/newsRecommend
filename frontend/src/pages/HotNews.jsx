import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, List, Spin, Empty, Tag, Statistic, Row, Col } from 'antd'
import { EyeOutlined, MessageOutlined, CalendarOutlined, FireOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { newsApi } from '../utils/api'

function HotNews() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [hotNews, setHotNews] = useState([])

  useEffect(() => {
    fetchHotNews()
  }, [])

  const fetchHotNews = async () => {
    setLoading(true)
    try {
      const res = await newsApi.getHot({ limit: 50 })
      if (res.code === 200) {
        setHotNews(res.data || [])
      }
    } catch (error) {
      console.error('获取热点新闻失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getHotRankClass = (index) => {
    if (index < 3) return `top-${index + 1}`
    return 'other'
  }

  return (
    <div className="page-container">
      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="热点新闻总数"
              value={hotNews.length}
              prefix={<FireOutlined style={{ color: '#ff4d4f' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="总阅读量"
              value={hotNews.reduce((sum, n) => sum + (n.view_count || 0), 0)}
              prefix={<EyeOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="总评论数"
              value={hotNews.reduce((sum, n) => sum + (n.comment_count || 0), 0)}
              prefix={<MessageOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="平均热度"
              value={hotNews.length > 0 
                ? (hotNews.reduce((sum, n) => sum + (n.hot_score || 0), 0) / hotNews.length).toFixed(1)
                : 0
              }
              suffix="分"
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FireOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />
            <span style={{ fontSize: 18, fontWeight: 'bold' }}>时事热点排行榜</span>
          </div>
        }
      >
        <Spin spinning={loading}>
          {hotNews.length > 0 ? (
            <List
              itemLayout="vertical"
              dataSource={hotNews}
              renderItem={(news, index) => (
                <List.Item
                  key={news.id}
                  onClick={() => navigate(`/news/${news.id}`)}
                  style={{ cursor: 'pointer', padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}
                  hoverable
                >
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ flexShrink: 0 }}>
                      <div className={`hot-rank ${getHotRankClass(index)}`} style={{ fontSize: 16, width: 32, height: 32 }}>
                        {index + 1}
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: 18, marginBottom: 8, cursor: 'pointer' }}
                        className="news-title">
                        {news.title}
                      </h3>
                      <p style={{ color: '#666', marginBottom: 12 }}>
                        {news.summary || news.content?.substring(0, 200) + '...'}
                      </p>
                      <div className="news-meta">
                        {news.category && (
                          <Tag color="purple">{news.category}</Tag>
                        )}
                        <span><EyeOutlined /> {news.view_count} 阅读</span>
                        <span><MessageOutlined /> {news.comment_count} 评论</span>
                        <span><CalendarOutlined /> {dayjs(news.publish_time).format('YYYY-MM-DD HH:mm')}</span>
                        {news.hot_score > 0 && (
                          <span style={{ color: '#ff4d4f', fontWeight: 'bold' }}>
                            热度: {news.hot_score.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无热点新闻数据" />
          )}
        </Spin>
      </Card>
    </div>
  )
}

export default HotNews
