import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Spin, Empty, Button, Input, List, Avatar, message, Tag, Divider } from 'antd'
import { UserOutlined, EyeOutlined, MessageOutlined, CalendarOutlined, LikeOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { newsApi, commentApi } from '../utils/api'
import { useUserStore } from '../store/userStore'

const { TextArea } = Input

function NewsDetail() {
  const { id } = useParams()
  const { isLoggedIn } = useUserStore()
  const [loading, setLoading] = useState(false)
  const [news, setNews] = useState(null)
  const [comments, setComments] = useState([])
  const [commentLoading, setCommentLoading] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (id) {
      fetchNewsDetail()
      fetchComments()
    }
  }, [id])

  const fetchNewsDetail = async () => {
    setLoading(true)
    try {
      const res = await newsApi.getDetail(id)
      if (res.code === 200) {
        setNews(res.data)
      }
    } catch (error) {
      console.error('获取新闻详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    setCommentLoading(true)
    try {
      const res = await commentApi.getByNews(id, { page_size: 50 })
      if (res.code === 200) {
        setComments(res.data.list || [])
      }
    } catch (error) {
      console.error('获取评论失败:', error)
    } finally {
      setCommentLoading(false)
    }
  }

  const handleSubmitComment = async () => {
    if (!isLoggedIn) {
      message.warning('请先登录后再评论')
      return
    }

    if (!commentText.trim()) {
      message.warning('请输入评论内容')
      return
    }

    setSubmitting(true)
    try {
      const res = await commentApi.create({
        news_id: parseInt(id),
        content: commentText.trim()
      })
      if (res.code === 200) {
        message.success('评论成功')
        setCommentText('')
        fetchComments()
        setNews(prev => ({
          ...prev,
          comment_count: (prev?.comment_count || 0) + 1
        }))
      }
    } catch (error) {
      message.error(error.message || '评论失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-container" style={{ maxWidth: 900 }}>
      <Spin spinning={loading}>
        {news ? (
          <Card className="news-detail-container">
            <h1 className="news-detail-title">{news.title}</h1>
            
            <div className="news-detail-info">
              <span>来源: {news.source || '新浪新闻'}</span>
              <span><EyeOutlined /> {news.view_count} 阅读</span>
              <span><MessageOutlined /> {news.comment_count} 评论</span>
              <span><CalendarOutlined /> {dayjs(news.publish_time).format('YYYY-MM-DD HH:mm')}</span>
            </div>

            {news.category && (
              <div style={{ marginBottom: 16 }}>
                <Tag color="purple">{news.category}</Tag>
                {news.news_tags?.map((nt, index) => (
                  <Tag key={index} color="blue">{nt.tag?.name}</Tag>
                ))}
              </div>
            )}

            {news.summary && (
              <div style={{ 
                padding: 16, 
                background: '#f5f5f5', 
                borderRadius: 8, 
                marginBottom: 24,
                borderLeft: '4px solid #667eea'
              }}>
                <strong>摘要：</strong>{news.summary}
              </div>
            )}

            <div 
              className="news-detail-content"
              dangerouslySetInnerHTML={{ __html: news.content }}
            />

            <Divider />

            <div className="comment-section">
              <h3 style={{ marginBottom: 16 }}>
                <MessageOutlined style={{ marginRight: 8 }} />
                评论 ({comments.length})
              </h3>

              <div style={{ marginBottom: 24 }}>
                <TextArea
                  rows={3}
                  placeholder={isLoggedIn ? "发表您的评论..." : "请先登录后再评论"}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={!isLoggedIn}
                  style={{ marginBottom: 12 }}
                />
                <div style={{ textAlign: 'right' }}>
                  <Button
                    type="primary"
                    onClick={handleSubmitComment}
                    loading={submitting}
                    disabled={!isLoggedIn}
                  >
                    发表评论
                  </Button>
                </div>
              </div>

              <Spin spinning={commentLoading}>
                {comments.length > 0 ? (
                  <List
                    dataSource={comments}
                    renderItem={(comment) => (
                      <List.Item className="comment-item">
                        <List.Item.Meta
                          avatar={
                            <Avatar 
                              icon={<UserOutlined />}
                              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                            />
                          }
                          title={
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span>{comment.user?.username || '匿名用户'}</span>
                              <span className="comment-time">
                                {dayjs(comment.created_at).format('YYYY-MM-DD HH:mm')}
                              </span>
                            </div>
                          }
                          description={<div className="comment-content">{comment.content}</div>}
                        />
                      </List.Item>
                    )}
                  />
                ) : (
                  <Empty description="暂无评论，快来抢沙发吧！" />
                )}
              </Spin>
            </div>
          </Card>
        ) : (
          <Empty description="新闻不存在或已被删除" />
        )}
      </Spin>
    </div>
  )
}

export default NewsDetail
