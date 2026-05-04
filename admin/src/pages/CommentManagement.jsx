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
} from 'antd'
import { SearchOutlined, ReloadOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import { commentApi } from '../utils/api'
import dayjs from 'dayjs'

const { Search } = Input

function CommentManagement() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState(null)
  const [detailModalVisible, setDetailModalVisible] = useState(false)
  const [selectedComment, setSelectedComment] = useState(null)

  const fetchData = async (params = {}) => {
    setLoading(true)
    try {
      const query = {
        page: pagination.current,
        page_size: pagination.pageSize,
        keyword: searchText || undefined,
        status: statusFilter !== null ? statusFilter : undefined,
        ...params,
      }
      const res = await commentApi.getList(query)
      if (res.success) {
        setData(res.data.comments || [])
        setPagination((prev) => ({
          ...prev,
          total: res.data.total || 0,
        }))
      }
    } catch (error) {
      message.error(error.message || '获取评论列表失败')
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

  const handleStatusFilter = (value) => {
    setStatusFilter(value)
    setPagination((prev) => ({ ...prev, current: 1 }))
    setTimeout(() => fetchData({ page: 1, status: value }), 0)
  }

  const handleViewDetail = (record) => {
    setSelectedComment(record)
    setDetailModalVisible(true)
  }

  const handleStatusChange = async (id, status) => {
    try {
      const res = await commentApi.updateStatus(id, status)
      if (res.success) {
        message.success(status === 1 ? '评论已审核通过' : '评论已隐藏')
        fetchData()
      }
    } catch (error) {
      message.error(error.message || '操作失败')
    }
  }

  const handleDelete = async (id) => {
    try {
      const res = await commentApi.delete(id)
      if (res.success) {
        message.success('评论已删除')
        fetchData()
      }
    } catch (error) {
      message.error(error.message || '删除失败')
    }
  }

  const handleReset = () => {
    setSearchText('')
    setStatusFilter(null)
    setPagination({ current: 1, pageSize: 10, total: 0 })
    fetchData({ page: 1, keyword: undefined, status: undefined })
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
    },
    {
      title: '评论用户',
      dataIndex: 'user_name',
      key: 'user_name',
      width: 120,
    },
    {
      title: '评论内容',
      dataIndex: 'content',
      key: 'content',
      width: 300,
      ellipsis: true,
    },
    {
      title: '新闻标题',
      dataIndex: 'news_title',
      key: 'news_title',
      width: 200,
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 1 ? 'green' : 'orange'}>
          {status === 1 ? '已审核' : '待审核'}
        </Tag>
      ),
    },
    {
      title: '评论时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss'),
    },
    {
      title: '操作',
      key: 'action',
      width: 250,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            详情
          </Button>
          {record.status === 0 && (
            <Button
              type="link"
              size="small"
              onClick={() => handleStatusChange(record.id, 1)}
            >
              审核通过
            </Button>
          )}
          {record.status === 1 && (
            <Button
              type="link"
              size="small"
              onClick={() => handleStatusChange(record.id, 0)}
            >
              隐藏
            </Button>
          )}
          <Popconfirm
            title="确定要删除该评论吗？此操作不可恢复。"
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
        <Space style={{ marginBottom: 16 }}>
          <Search
            placeholder="搜索评论内容或用户名"
            allowClear
            enterButton={<SearchOutlined />}
            onSearch={handleSearch}
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: 150 }}
            value={statusFilter}
            onChange={handleStatusFilter}
            options={[
              { value: 1, label: '已审核' },
              { value: 0, label: '待审核' },
            ]}
          />
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
        title="评论详情"
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            关闭
          </Button>,
        ]}
      >
        {selectedComment && (
          <div style={{ padding: '16px 0' }}>
            <p><strong>评论用户：</strong>{selectedComment.user_name}</p>
            <p><strong>评论时间：</strong>{dayjs(selectedComment.created_at).format('YYYY-MM-DD HH:mm:ss')}</p>
            <p><strong>新闻标题：</strong>{selectedComment.news_title}</p>
            <p><strong>状态：</strong>
              <Tag color={selectedComment.status === 1 ? 'green' : 'orange'}>
                {selectedComment.status === 1 ? '已审核' : '待审核'}
              </Tag>
            </p>
            <div>
              <strong>评论内容：</strong>
              <div style={{
                marginTop: 8,
                padding: 12,
                background: '#f5f5f5',
                borderRadius: 4,
                whiteSpace: 'pre-wrap',
                lineHeight: 1.8,
              }}>
                {selectedComment.content}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default CommentManagement
