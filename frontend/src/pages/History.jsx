import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, List, Spin, Empty, Tag, Button, Statistic, Row, Col, message, Popconfirm } from 'antd'
import { EyeOutlined, MessageOutlined, CalendarOutlined, DeleteOutlined, HistoryOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { userApi } from '../utils/api'

function History() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [historyList, setHistoryList] = useState([])

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await userApi.getHistory()
      if (res.code === 200) {
        setHistoryList(res.data || [])
      }
    } catch (error) {
      console.error('获取浏览历史失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getReadDuration = (duration) => {
    if (!duration) return '-'
    if (duration < 60) return `${duration}秒`
    return `${Math.floor(duration / 60)}分${duration % 60}秒`
  }

  return (
    <div className="page-container" style={{ maxWidth: 900 }}>
      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic
              title="总浏览量"
              value={historyList.length}
              suffix="篇"
              prefix={<HistoryOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card>
            <Statistic
              title="今日浏览"
              value={historyList.filter(h => 
                dayjs(h.read_time).isSame(dayjs(), 'day')
              ).length}
              suffix="篇"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={8}>
          <Card
            actions={[
              <Button type="link" icon={<DeleteOutlined />} disabled={historyList.length === 0}>
                清空历史
              </Button>
            ]}
          >
            <Statistic
              title="最早浏览"
              value={historyList.length > 0 
                ? dayjs(historyList[historyList.length - 1]?.read_time).format('MM-DD')
                : '-'
              }
            />
          </Card>
        </Col>
      </Row>

      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <HistoryOutlined style={{ color: '#1890ff', fontSize: 20 }} />
            <span style={{ fontSize: 18, fontWeight: 'bold' }}>浏览历史</span>
          </div>
        }
        extra={
          historyList.length > 0 && (
            <Popconfirm
              title="确定要清空所有浏览历史吗？"
              onConfirm={() => {
                message.info('历史记录功能开发中')
              }}
              okText="确定"
              cancelText="取消"
            >
              <Button type="link" danger icon={<DeleteOutlined />}>
                清空历史
              </Button>
            </Popconfirm>
          )
        }
      >
        <Spin spinning={loading}>
          {historyList.length > 0 ? (
            <List
              itemLayout="vertical"
              dataSource={historyList}
              renderItem={(item, index) => (
                <List.Item
                  key={item.id}
                  style={{ cursor: 'pointer', padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}
                  onClick={() => item.news && navigate(`/news/${item.news.id}`)}
                  hoverable
                  actions={[
                    <span style={{ color: '#999', fontSize: 12 }}>
                      <CalendarOutlined /> {dayjs(item.read_time).format('YYYY-MM-DD HH:mm')}
                    </span>
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <h3 
                        className="news-title"
                        style={{ marginBottom: 8 }}
                      >
                        {item.news?.title || '新闻已删除'}
                      </h3>
                    }
                    description={
                      <div>
                        {item.news?.summary && (
                          <p style={{ color: '#666', marginBottom: 8 }}>
                            {item.news.summary.substring(0, 150)}...
                          </p>
                        )}
                        <div className="news-meta">
                          {item.news?.category && (
                            <Tag color="purple">{item.news.category}</Tag>
                          )}
                          {item.news?.view_count !== undefined && (
                            <span><EyeOutlined /> {item.news.view_count} 阅读</span>
                          )}
                          {item.news?.comment_count !== undefined && (
                            <span><MessageOutlined /> {item.news.comment_count} 评论</span>
                          )}
                          {item.duration > 0 && (
                            <span>阅读时长: {getReadDuration(item.duration)}</span>
                          )}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty
              description={
                <div>
                  <p style={{ fontSize: 16, marginBottom: 8 }}>暂无浏览历史</p>
                  <p style={{ color: '#999' }}>快去浏览新闻吧</p>
                  <Button 
                    type="primary" 
                    style={{ marginTop: 16 }}
                    onClick={() => navigate('/')}
                  >
                    去首页
                  </Button>
                </div>
              }
            />
          )}
        </Spin>
      </Card>
    </div>
  )
}

export default History
