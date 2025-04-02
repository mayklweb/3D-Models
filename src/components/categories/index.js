"use client"

import { useEffect, useState } from "react"
import { Typography, Card, Table, Button, Space, Popconfirm, message } from "antd"
import Link from "next/link"
import { fetchCategories, deleteCategory,} from "@/lib/api"
import { Plus, Edit, Trash } from "lucide-react"

const { Title, Text } = Typography

export default function CategoriesPage() {
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const categoriesData = await fetchCategories()
        setCategories(categoriesData || [])
      } catch (error) {
        console.error("Error fetching categories:", error)
        message.error("Failed to load categories")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleDelete = async (id) => {
    try {
      await deleteCategory(id)
      message.success("Category deleted successfully")

      // Refresh the data
      const categoriesData = await fetchCategories()
      setCategories(categoriesData || [])
    } catch (error) {
      console.error("Error deleting category:", error)
      message.error("Failed to delete category")
    }
  }

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Space size="small">
          <Link href={`/dashboard/categories/${record.id}/edit`}>
            <Button type="primary" icon={<Edit size={16} />} size="small" />
          </Link>
          <Popconfirm
            title="Delete this category?"
            description="Are you sure you want to delete this category?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button danger icon={<Trash size={16} />} size="small" />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <>
      <div className="page-header">
        <Title level={2}>Categories</Title>
      </div>

      <Card
        title="Categories"
        extra={
          <Link href="/dashboard/categories/new">
            <Button type="primary" icon={<Plus size={16} />}>
              Add Category
            </Button>
          </Link>
        }
      >
        <Text type="secondary" style={{ display: "block", marginBottom: "16px" }}>
          Manage your car categories
        </Text>

        <Table dataSource={categories} columns={columns} rowKey="id" loading={loading} />
      </Card>
    </>
  )
}

