import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Row, Col, Select, Input, Pagination, Spin, Empty, Tag } from 'antd'
import { SearchOutlined, EyeOutlined, MessageOutlined, CalendarOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { newsApi } from '../utils/api'

const { Search } = Input

function Home() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [newsList, setNewsList] = useState([])
  const [hotNews, setHotNews] = useState([])
  const [categories, setCategories] = useState([])
  const [currentCategory, setCurrentCategory] = useState('')
  const [keyword, setKeyword] = useState('')
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  })

  useEffect(() => {
    fetchCategories()
    fetchHotNews()
  }, [])

  useEffect(() => {
    fetchNews()
  }, [pagination.current, pagination.pageSize, currentCategory])

  const fetchCategories = async () => {
    try {
      const res = await newsApi.getCategories()
      if (res.code === 200) {
        setCategories(res.data || [])
      }
    } catch (error) {
      console.error('获取分类失败:', error)
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

  const fetchNews = async () => {
    setLoading(true)
    try {
      const params = {
        page: pagination.current,
        page_size: pagination.pageSize
      }
      if (currentCategory) {
        params.category = currentCategory
      }
      if (keyword) {
        params.keyword = keyword
      }

      const res = await newsApi.getList(params)
      if (res.code === 200) {
        setNewsList(res.data.list || [])
        setPagination(prev => ({
          ...prev,
          total: res.data.total || 0
        }))
      }
    } catch (error) {
      console.error('获取新闻列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value) => {
    setKeyword(value)
    setPagination(prev => ({ ...prev, current: 1 }))
    setTimeout(fetchNews, 0)
  }

  const handleCategoryChange = (value) => {
    setCurrentCategory(value)
    setPagination(prev => ({ ...prev, current: 1 }))
  }

  const handlePageChange = (page, pageSize) => {
    setPagination(prev => ({ ...prev, current: page, pageSize }))
  }

  return (
    <div className="page-container">
      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card style={{ marginBottom: 16 }}>
            <Row gutter={16} align="middle">
              <Col flex="none">
                <Select
                  style={{ width: 150 }}
                  placeholder="选择分类"
                  allowClear
                  value={currentCategory || undefined}
                  onChange={handleCategoryChange}
                  options={categories.map(cat => ({ label: cat, value: cat }))}
                />
              </Col>
              <Col flex="auto">
                <Search
                  placeholder="搜索新闻标题或内容..."
                  allowClear
                  enterButton={<SearchOutlined />}
                  size="large"
                  onSearch={handleSearch}
                />
              </Col>
            </Row>
          </Card>

          <Spin spinning={loading}>
            {newsList.length > 0 ? (
              newsList.map((news, index) => (
                <Card
                  key={news.id}
                  className="news-card"
                  hoverable
                  onClick={() => navigate(`/news/${news.id}`)}
                >
                  <div className="news-title">{news.title}</div>
                  <div className="news-summary">{news.summary || news.content?.substring(0, 150) + '...'}</div>
                  <div className="news-meta">
                    {news.category && (
                      <span className="category-tag">{news.category}</span>
                    )}
                    <span>
                      <EyeOutlined /> {news.view_count} 阅读
                    </span>
                    <span>
                      <MessageOutlined /> {news.comment_count} 评论
                    </span>
                    <span>
                      <CalendarOutlined /> {dayjs(news.publish_time).format('YYYY-MM-DD HH:mm')}
                    </span>
                  </div>
                </Card>
              ))
            ) : (
              <Empty description="暂无新闻数据" />
            )}

            {pagination.total > 0 && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  showSizeChanger
                  showQuickJumper
                  showTotal={(total) => `共 ${total} 条`}
                  onChange={handlePageChange}
                />
              </div>
            )}
          </Spin>
        </Col>

        <Col xs={24} lg={8}>
          <Card className="sidebar" title={
            <div className="sidebar-title">
              <span style={{ marginRight: 8 }}>🔥</span>
              时事热点
            </div>
          }>
            {hotNews.length > 0 ? (
              hotNews.map((news, index) => (
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
              <Empty description="暂无热点新闻" style={{ padding: 20 }} />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default Home
