import { useState, useEffect } from 'react'
import {
  Table,
  Button,
  Input,
  Space,
  Popconfirm,
  Tag,
  message,
  Card,
  Select,
  Modal,
  Form,
  Input as AntInput,
} from 'antd'
import {
  SearchOutlined,
  ReloadOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  EyeOutlined,
} from '@ant-design/icons'
import { newsApi } from '../utils/api'
import dayjs from 'dayjs'

const { Search } = Input
const { TextArea } = AntInput

function NewsManagement() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const [searchText, setSearchText] = useState('')
  const [categoryFilter, setCategoryFilter] = useState(null)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [form] = Form.useForm()

  const categories = [
    { value: '国内', label: '国内' },
    { value: '国际', label: '国际' },
    { value: '科技', label: '科技' },
    { value: '娱乐', label: '娱乐' },
    { value: '体育', label: '体育' },
    { value: '财经', label: '财经' },
    { value: '军事', label: '军事' },
    { value: '社会', label: '社会' },
  ]

  const fetchData = async (params = {}) => {
    setLoading(true)
    try {
      const query = {
        page: pagination.current,
        page_size: pagination.pageSize,
        keyword: searchText || undefined,
        category: categoryFilter || undefined,
        ...params,
      }
      const res = await newsApi.getList(query)
      if (res.success) {
        setData(res.data.news || [])
        setPagination((prev) => ({
          ...prev,
          total: res.data.total || 0,
        }))
      }
    } catch (error) {
      message.error(error.message || '获取新闻列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [pagination.current, pagination.pageSize])

  const handleSearch = (value) => {
    setSearchText(value)
    setPagination((prev) => ({ ...prev, current: 1 }))
    setTimeout(() => fetchData({ page: 1, keyword: value }), 0)
  }

  const handleCategoryFilter = (value) => {
    setCategoryFilter(value)
    setPagination((prev) => ({ ...prev, current: 1 }))
    setTimeout(() => fetchData({ page: 1, category: value }), 0)
  }

  const handleAdd = () => {
    setEditingItem(null)
    form.resetFields()
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingItem(record)
    form.setFieldsValue({
      title: record.title,
      summary: record.summary,
      category: record.category,
      content: record.content,
      source: record.source,
      tags: record.tags?.join(','),
    })
    setModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      const res = await newsApi.delete(id)
      if (res.success) {
        message.success('新闻已删除')
        fetchData()
      }
    } catch (error) {
      message.error(error.message || '删除失败')
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      const data = {
        ...values,
        tags: values.tags ? values.tags.split(',').map((t) => t.trim()).filter((t) => t) : [],
      }

      if (editingItem) {
        const res = await newsApi.update(editingItem.id, data)
        if (res.success) {
          message.success('更新成功')
          setModalVisible(false)
          fetchData()
        }
      } else {
        const res = await newsApi.create(data)
        if (res.success) {
          message.success('创建成功')
          setModalVisible(false)
          fetchData()
        }
      }
    } catch (error) {
      if (error.errorFields) return
      message.error(error.message || '操作失败')
    }
  }

  const handleReset = () => {
    setSearchText('')
    setCategoryFilter(null)
    setPagination({ current: 1, pageSize: 10, total: 0 })
    fetchData({ page: 1, keyword: undefined, category: undefined })
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      width: 250,
      ellipsis: true,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: (category) => (
        <Tag color="blue">{category || '未分类'}</Tag>
      ),
    },
    {
      title: '来源',
      dataIndex: 'source',
      key: 'source',
      width: 100,
    },
    {
      title: '阅读量',
      dataIndex: 'view_count',
      key: 'view_count',
      width: 90,
      sorter: true,
    },
    {
      title: '评论数',
      dataIndex: 'comment_count',
      key: 'comment_count',
      width: 90,
    },
    {
      title: '发布时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />}>
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除该新闻吗？此操作不可恢复。"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" danger size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space style={{ marginBottom: 16 }} wrap>
          <Search
            placeholder="搜索新闻标题"
            allowClear
            enterButton={<SearchOutlined />}
            onSearch={handleSearch}
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            placeholder="分类筛选"
            allowClear
            style={{ width: 150 }}
            value={categoryFilter}
            onChange={handleCategoryFilter}
            options={categories}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加新闻
          </Button>
          <Button icon={<ReloadOutlined />} onClick={handleReset}>
            重置
          </Button>
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={data}
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
        scroll={{ x: 1300 }}
      />

      <Modal
        title={editingItem ? '编辑新闻' : '添加新闻'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={800}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入标题' }]}
          >
            <Input placeholder="请输入新闻标题" />
          </Form.Item>
          <Form.Item
            name="category"
            label="分类"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select options={categories} placeholder="请选择分类" />
          </Form.Item>
          <Form.Item name="summary" label="摘要">
            <TextArea rows={2} placeholder="请输入新闻摘要" />
          </Form.Item>
          <Form.Item
            name="content"
            label="内容"
            rules={[{ required: true, message: '请输入内容' }]}
          >
            <TextArea rows={8} placeholder="请输入新闻内容" />
          </Form.Item>
          <Form.Item name="source" label="来源">
            <Input placeholder="请输入来源，如：新浪新闻" />
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Input placeholder="多个标签用逗号分隔，如：科技,互联网,人工智能" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default NewsManagement
