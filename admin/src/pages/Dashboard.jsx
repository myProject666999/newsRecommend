import { useState, useEffect } from 'react'
import { Row, Col, Card, Statistic, List, Empty, Spin, Table, Tag } from 'antd'
import {
  UserOutlined,
  FileTextOutlined,
  MessageOutlined,
  EyeOutlined,
  FireOutlined
} from '@ant-design/icons'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts'
import dayjs from 'dayjs'
import { adminApi } from '../utils/api'

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7']

function Dashboard() {
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getDashboard()
      if (res.code === 200) {
        setStats(res.data)
      }
    } catch (error) {
      console.error('获取仪表盘数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const categoryData = stats?.category_stats?.map((item, index) => ({
    name: item.category,
    value: item.count,
    color: COLORS[index % COLORS.length]
  })) || []

  const recentNewsColumns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: 300
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category) => category ? <Tag color="purple">{category}</Tag> : '-'
    },
    {
      title: '阅读量',
      dataIndex: 'view_count',
      key: 'view_count',
      width: 100,
      render: (count) => <span style={{ fontWeight: 500 }}>{count}</span>
    },
    {
      title: '评论量',
      dataIndex: 'comment_count',
      key: 'comment_count',
      width: 100
    },
    {
      title: '发布时间',
      dataIndex: 'publish_time',
      key: 'publish_time',
      width: 180,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
    }
  ]

  const recentCommentsColumns = [
    {
      title: '用户',
      dataIndex: ['user', 'username'],
      key: 'user',
      width: 100
    },
    {
      title: '新闻标题',
      dataIndex: ['news', 'title'],
      key: 'news_title',
      ellipsis: true,
      width: 250
    },
    {
      title: '评论内容',
      dataIndex: 'content',
      key: 'content',
      ellipsis: true,
      width: 200
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status) => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? '正常' : '隐藏'}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 160,
      render: (time) => dayjs(time).format('YYYY-MM-DD HH:mm')
    }
  ]

  return (
    <Spin spinning={loading}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="用户总数"
              value={stats?.user_count || 0}
              prefix={<UserOutlined style={{ color: '#667eea' }} />}
              valueStyle={{ color: '#667eea' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="新闻总数"
              value={stats?.news_count || 0}
              prefix={<FileTextOutlined style={{ color: '#764ba2' }} />}
              valueStyle={{ color: '#764ba2' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="评论总数"
              value={stats?.comment_count || 0}
              prefix={<MessageOutlined style={{ color: '#f093fb' }} />}
              valueStyle={{ color: '#f093fb' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="今日浏览量"
              value={stats?.today_views || 0}
              prefix={<EyeOutlined style={{ color: '#f5576c' }} />}
              valueStyle={{ color: '#f5576c' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={12}>
          <Card title={<span><FireOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />分类统计</span>}>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Empty description="暂无分类数据" style={{ padding: 40 }} />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={<span><FileTextOutlined style={{ color: '#667eea', marginRight: 8 }} />最近新闻</span>}>
            {stats?.recent_news && stats.recent_news.length > 0 ? (
              <Table
                dataSource={stats.recent_news}
                rowKey="id"
                size="small"
                pagination={false}
                columns={recentNewsColumns}
                scroll={{ x: 700 }}
              />
            ) : (
              <Empty description="暂无新闻数据" style={{ padding: 40 }} />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card title={<span><MessageOutlined style={{ color: '#764ba2', marginRight: 8 }} />最近评论</span>}>
            {stats?.recent_comments && stats.recent_comments.length > 0 ? (
              <Table
                dataSource={stats.recent_comments}
                rowKey="id"
                size="small"
                pagination={false}
                columns={recentCommentsColumns}
                scroll={{ x: 750 }}
              />
            ) : (
              <Empty description="暂无评论数据" style={{ padding: 40 }} />
            )}
          </Card>
        </Col>
      </Row>
    </Spin>
  )
}

export default Dashboard
