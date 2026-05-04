import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Tag,
  message,
  Card,
  Modal,
  Form,
  Input,
  Statistic,
  Row,
  Col,
  Descriptions,
} from 'antd'
import {
  PlusOutlined,
  DeleteOutlined,
  ReloadOutlined,
  BarChartOutlined,
  FireOutlined,
  TagOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { tagApi } from '../utils/api'

function TagManagement() {
  const [loading, setLoading] = useState(false)
  const [tags, setTags] = useState([])
  const [recommendStats, setRecommendStats] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  const fetchTags = async () => {
    setLoading(true)
    try {
      const res = await tagApi.getList()
      if (res.success) {
        setTags(res.data.tags || [])
      }
    } catch (error) {
      message.error(error.message || '获取标签列表失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchRecommendStats = async () => {
    try {
      const res = await tagApi.getList()
      if (res.success) {
        setRecommendStats({
          totalTags: res.data.tags?.length || 0,
          hotTags: res.data.tags?.slice(0, 5) || [],
        })
      }
    } catch (error) {
      console.error('获取推荐统计失败', error)
    }
  }

  useEffect(() => {
    fetchTags()
    fetchRecommendStats()
  }, [])

  const handleAdd = () => {
    form.resetFields()
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const res = await tagApi.create({
        name: values.name,
        description: values.description,
      })
      if (res.success) {
        message.success('标签创建成功')
        setModalVisible(false)
        fetchTags()
        fetchRecommendStats()
      }
    } catch (error) {
      if (error.errorFields) return
      message.error(error.message || '创建失败')
    }
  }

  const handleDelete = async (id) => {
    try {
      const res = await tagApi.delete(id)
      if (res.success) {
        message.success('标签已删除')
        fetchTags()
        fetchRecommendStats()
      }
    } catch (error) {
      message.error(error.message || '删除失败')
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '标签名称',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name) => (
        <Tag color="blue" style={{ fontSize: 14, padding: '4px 12px' }}>
          {name}
        </Tag>
      ),
    },
    {
      title: '标签描述',
      dataIndex: 'description',
      key: 'description',
      width: 300,
      ellipsis: true,
    },
    {
      title: '关联新闻数',
      dataIndex: 'news_count',
      key: 'news_count',
      width: 120,
      render: (count) => count || 0,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Button
          type="link"
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record.id)}
        >
          删除
        </Button>
      ),
    },
  ]

  return (
    <div>
      <Card
        size="small"
        style={{ marginBottom: 16 }}
        title={
          <span>
            <BarChartOutlined style={{ marginRight: 8 }} />
            推荐算法说明
          </span>
        }
      >
        <Descriptions column={1} size="small">
          <Descriptions.Item label="权重衰减算法">
            <Tag color="blue">日衰减率 5%</Tag>
            用户兴趣标签权重随时间衰减，避免内容推荐过度重复。
            每次用户阅读新闻时，相关标签权重增加，其他标签权重衰减。
          </Descriptions.Item>
          <Descriptions.Item label="标签推荐算法">
            <Tag color="green">标签匹配度计算</Tag>
            根据用户兴趣标签与新闻标签的匹配程度进行推荐，
            匹配度 = (用户标签权重 × 新闻标签权重) / 总权重。
          </Descriptions.Item>
          <Descriptions.Item label="热点推荐算法">
            <Tag color="orange">热点评分</Tag>
            热点评分 = 阅读量 × 1 + 评论量 × 3 + 时间衰减因子，
            时间越近、互动越多的新闻热度越高。
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="总标签数"
              value={recommendStats?.totalTags || 0}
              prefix={<TagOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="热门标签数"
              value={Math.min(recommendStats?.totalTags || 0, 10)}
              prefix={<FireOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="推荐算法"
              value={3}
              prefix={<BarChartOutlined />}
              suffix="种"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="权重衰减率"
              value={5}
              prefix={<UserOutlined />}
              suffix="%/天"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        size="small"
        title={
          <span>
            <TagOutlined style={{ marginRight: 8 }} />
            标签管理
          </span>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            添加标签
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={tags}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 20,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title="添加标签"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="标签名称"
            rules={[{ required: true, message: '请输入标签名称' }]}
          >
            <Input placeholder="请输入标签名称，如：科技、娱乐、体育等" />
          </Form.Item>
          <Form.Item name="description" label="标签描述">
            <Input.TextArea rows={3} placeholder="请输入标签描述（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default TagManagement
