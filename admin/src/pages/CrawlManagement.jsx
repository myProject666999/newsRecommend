import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Tag,
  message,
  Card,
  Modal,
  Form,
  Select,
  InputNumber,
  Descriptions,
  Statistic,
  Row,
  Col,
  Alert,
  Divider,
} from 'antd'
import {
  BugOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
} from '@ant-design/icons'
import { crawlApi } from '../utils/api'
import dayjs from 'dayjs'

function CrawlManagement() {
  const [loading, setLoading] = useState(false)
  const [tasks, setTasks] = useState([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  const categories = [
    { value: '国内', label: '国内新闻' },
    { value: '国际', label: '国际新闻' },
    { value: '科技', label: '科技新闻' },
    { value: '娱乐', label: '娱乐新闻' },
    { value: '体育', label: '体育新闻' },
    { value: '财经', label: '财经新闻' },
    { value: '军事', label: '军事新闻' },
    { value: '社会', label: '社会新闻' },
  ]

  const fetchTasks = async (params = {}) => {
    setLoading(true)
    try {
      const query = {
        page: pagination.current,
        page_size: pagination.pageSize,
        ...params,
      }
      const res = await crawlApi.getTasks(query)
      if (res.success) {
        setTasks(res.data.tasks || [])
        setPagination((prev) => ({
          ...prev,
          total: res.data.total || 0,
        }))
      }
    } catch (error) {
      message.error(error.message || '获取任务列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [pagination.current, pagination.pageSize])

  const handleAddTask = () => {
    form.resetFields()
    form.setFieldsValue({
      category: '科技',
      count: 20,
    })
    setModalVisible(true)
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const res = await crawlApi.createTask({
        category: values.category,
        count: values.count,
      })
      if (res.success) {
        message.success('任务创建成功，爬虫已开始运行')
        setModalVisible(false)
        fetchTasks({ page: 1 })
      }
    } catch (error) {
      if (error.errorFields) return
      message.error(error.message || '创建任务失败')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <LoadingOutlined />
      case 'running':
        return <PlayCircleOutlined style={{ color: '#1890ff' }} />
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />
      case 'failed':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
      default:
        return null
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'default'
      case 'running':
        return 'processing'
      case 'completed':
        return 'success'
      case 'failed':
        return 'error'
      default:
        return 'default'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return '等待中'
      case 'running':
        return '运行中'
      case 'completed':
        return '已完成'
      case 'failed':
        return '失败'
      default:
        return status
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
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: '爬取数量',
      dataIndex: 'count',
      key: 'count',
      width: 100,
    },
    {
      title: '成功数量',
      dataIndex: 'success_count',
      key: 'success_count',
      width: 100,
      render: (count) => <span style={{ color: '#52c41a', fontWeight: 500 }}>{count || 0}</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status) => (
        <Tag icon={getStatusIcon(status)} color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '错误信息',
      dataIndex: 'error_message',
      key: 'error_message',
      width: 200,
      ellipsis: true,
      render: (msg) => msg || '-',
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
  ]

  return (
    <div>
      <Alert
        message="爬虫系统说明"
        description={
          <div>
            <p><strong>功能：</strong>通过Python实现新浪新闻的爬取，可爬取新闻页面上的标题、文本、图片、视频链接（保留排版）</p>
            <p><strong>使用方式：</strong>创建爬取任务后，系统会自动执行爬虫程序，将新闻数据保存到数据库。</p>
            <p><strong>支持分类：</strong>国内、国际、科技、娱乐、体育、财经、军事、社会</p>
          </div>
        }
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
      />

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="总任务数"
              value={pagination.total}
              prefix={<BugOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="运行中任务"
              value={tasks.filter((t) => t.status === 'running').length}
              prefix={<PlayCircleOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="已完成任务"
              value={tasks.filter((t) => t.status === 'completed').length}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card size="small">
            <Statistic
              title="失败任务"
              value={tasks.filter((t) => t.status === 'failed').length}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      <Card
        size="small"
        title={
          <span>
            <BugOutlined style={{ marginRight: 8 }} />
            爬虫任务管理
          </span>
        }
        extra={
          <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleAddTask}>
            创建爬取任务
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={tasks}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 条记录`,
            onChange: (page, pageSize) => {
              setPagination((prev) => ({ ...prev, current: page, pageSize }))
            },
          }}
          scroll={{ x: 1100 }}
        />
      </Card>

      <Divider />

      <Card size="small" title="爬虫技术说明">
        <Descriptions column={1} size="small">
          <Descriptions.Item label="技术栈">
            Python + Requests + BeautifulSoup4 + LXML
          </Descriptions.Item>
          <Descriptions.Item label="爬取内容">
            新闻标题、正文内容、图片链接、视频链接、来源、发布时间
          </Descriptions.Item>
          <Descriptions.Item label="数据处理">
            自动提取新闻标签、自动去重（根据URL和标题）
          </Descriptions.Item>
          <Descriptions.Item label="运行方式">
            命令行执行：<code>python sina_crawler.py -c 科技 -n 20</code>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      <Modal
        title="创建爬取任务"
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="category"
            label="新闻分类"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select options={categories} placeholder="请选择新闻分类" />
          </Form.Item>
          <Form.Item
            name="count"
            label="爬取数量"
            rules={[{ required: true, message: '请输入爬取数量' }]}
          >
            <InputNumber
              min={1}
              max={200}
              style={{ width: '100%' }}
              placeholder="请输入要爬取的新闻数量"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default CrawlManagement
