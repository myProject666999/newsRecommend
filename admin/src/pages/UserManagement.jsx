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
} from 'antd'
import { SearchOutlined, ReloadOutlined, DeleteOutlined } from '@ant-design/icons'
import { userApi } from '../utils/api'
import dayjs from 'dayjs'

const { Search } = Input

function UserManagement() {
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  })
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState(null)

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
      const res = await userApi.getList(query)
      if (res.success) {
        setData(res.data.users || [])
        setPagination((prev) => ({
          ...prev,
          total: res.data.total || 0,
        }))
      }
    } catch (error) {
      message.error(error.message || '获取用户列表失败')
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

  const handleStatusChange = async (id, status) => {
    try {
      const res = await userApi.updateStatus(id, status)
      if (res.success) {
        message.success(status === 1 ? '用户已启用' : '用户已禁用')
        fetchData()
      }
    } catch (error) {
      message.error(error.message || '操作失败')
    }
  }

  const handleDelete = async (id) => {
    try {
      const res = await userApi.delete(id)
      if (res.success) {
        message.success('用户已删除')
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
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 150,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      width: 100,
      render: (role) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role === 'admin' ? '管理员' : '普通用户'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 1 ? 'green' : 'default'}>
          {status === 1 ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '注册时间',
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
          {record.role !== 'admin' && (
            <>
              <Popconfirm
                title={record.status === 1 ? '确定要禁用该用户吗？' : '确定要启用该用户吗？'}
                onConfirm={() => handleStatusChange(record.id, record.status === 1 ? 0 : 1)}
              >
                <Button type="link" size="small">
                  {record.status === 1 ? '禁用' : '启用'}
                </Button>
              </Popconfirm>
              <Popconfirm
                title="确定要删除该用户吗？此操作不可恢复。"
                onConfirm={() => handleDelete(record.id)}
              >
                <Button type="link" danger size="small" icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            </>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space style={{ marginBottom: 16 }}>
          <Search
            placeholder="搜索用户名或邮箱"
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
              { value: 1, label: '启用' },
              { value: 0, label: '禁用' },
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
        scroll={{ x: 1200 }}
      />
    </div>
  )
}

export default UserManagement
