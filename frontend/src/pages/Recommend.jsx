import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Spin, Empty, Tag, Statistic, Button } from 'antd'
import { EyeOutlined, MessageOutlined, CalendarOutlined, StarOutlined, ReloadOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { recommendApi, newsApi } from '../utils/api'

function Recommend() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [recommendNews, setRecommendNews] = useState([])
  const [hotNews, setHotNews] = useState([])
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetchRecommendNews()
    fetchHotNews()
    fetchStats()
  }, [])

  const fetchRecommendNews = async () => {
    setLoading(true)
    try {
      const res = await recommendApi.getRecommend({ limit: 20 })
      if (res.code === 200) {
        setRecommendNews(res.data || [])
      }
    } catch (error) {
      console.error('获取推荐新闻失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchHotNews = async () => {
    try {
      const res = await newsApi.getHot({ limit: 10 })
      if (res.code === 200) {
        setHotNews(res.data || [])
      }
    } catch (error) {
      console.error('获取热点新闻失败:', error)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await recommendApi.getStats()
      if (res.code === 200) {
        setStats(res.data)
      }
    } catch (error) {
      console.error('获取推荐统计失败:', error)
    }
  }

  const getRandomColor = (index) => {
    const colors = [
      'magenta', 'purple', 'blue', 'cyan', 'green',
      'lime', 'yellow', 'orange', 'red', 'volcano',
      'geekblue', 'gold'
    ]
    return colors[index % colors.length]
  }

  return (
    <div className="page-container">
      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="兴趣标签数"
              value={stats?.tag_count || 0}
              prefix={<StarOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="浏览历史"
              value={stats?.history_count || 0}
              suffix="篇"
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="已推荐新闻"
              value={stats?.recommend_count || 0}
              suffix="篇"
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card
            actions={[
              <Button
                type="link"
                icon={<ReloadOutlined />}
                onClick={fetchRecommendNews}
              >
                刷新推荐
              </Button>
            ]}
          >
            <Statistic
              title="当前推荐"
              value={recommendNews.length}
              suffix="篇"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <StarOutlined style={{ color: '#722ed1', fontSize: 20 }} />
                <span style={{ fontSize: 18, fontWeight: 'bold' }}>为您推荐</span>
              </div>
            }
            extra={
              <Button type="link" onClick={fetchRecommendNews} loading={loading}>
                <ReloadOutlined /> 换一批
              </Button>
            }
          >
            <Spin spinning={loading}>
              {recommendNews.length > 0 ? (
                recommendNews.map((news, index) => (
                  <Card
                    key={news.id}
                    className="news-card"
                    hoverable
                    onClick={() => navigate(`/news/${news.id}`)}
                    style={{ position: 'relative' }}
                  >
                    <div className="news-title">{news.title}</div>
                    <div className="news-summary">
                      {news.summary || news.content?.substring(0, 150) + '...'}
                    </div>
                    <div className="news-meta">
                      {news.category && (
                        <Tag color={getRandomColor(index)}>{news.category}</Tag>
                      )}
                      <span><EyeOutlined /> {news.view_count} 阅读</span>
                      <span><MessageOutlined /> {news.comment_count} 评论</span>
                      <span><CalendarOutlined /> {dayjs(news.publish_time).format('YYYY-MM-DD HH:mm')}</span>
                    </div>
                  </Card>
                ))
              ) : (
                <Empty
                  description={
                    <div>
                      <p>暂无个性化推荐</p>
                      <p style={{ color: '#999', fontSize: 12 }}>多浏览新闻，系统会为您生成个性化推荐</p>
                    </div>
                  }
                />
              )}
            </Spin>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card className="sidebar" title={
            <div className="sidebar-title">
              <span style={{ marginRight: 8 }}>🔥</span>
              热门推荐
            </div>
          }>
            {hotNews.length > 0 ? (
              hotNews.slice(0, 10).map((news, index) => (
                <div
                  key={news.id}
                  className="hot-list-item"
                  onClick={() => navigate(`/news/${news.id}`)}
                >
                  <div className={`hot-rank ${index < 3 ? `top-${index + 1}` : 'other'}`}>
                    {index + 1}
                  </div>
                  <div className="hot-list-title">{news.title}</div>
                </div>
              ))
            ) : (
              <Empty description="暂无热门新闻" style={{ padding: 20 }} />
            )}
          </Card>

          <Card
            className="sidebar"
            style={{ marginTop: 24 }}
            title={
              <div className="sidebar-title">
                <span style={{ marginRight: 8 }}>💡</span>
                推荐算法说明
              </div>
            }
          >
            <div style={{ fontSize: 13, color: '#666', lineHeight: 2 }}>
              <p><strong>1. 权重衰减</strong></p>
              <p style={{ marginLeft: 20, marginBottom: 12 }}>
                用户兴趣标签权重随时间衰减，避免推荐过度重复。
              </p>
              
              <p><strong>2. 标签推荐</strong></p>
              <p style={{ marginLeft: 20, marginBottom: 12 }}>
                根据用户标签与新闻标签的匹配比例进行推荐。
              </p>
              
              <p><strong>3. 热点推荐</strong></p>
              <p style={{ marginLeft: 20 }}>
                综合阅读量、评论量、发布时间计算新闻热度。
              </p>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Recommend
