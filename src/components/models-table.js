"use client"

import { useState } from "react"
import Link from "next/link"
import { Table, Button, Dropdown, Menu, Tag, Typography, Popconfirm } from "antd"
import { CubeOutlined, EditOutlined, EyeOutlined, MoreOutlined, DeleteOutlined } from "@ant-design/icons"

// Sample data - in a real app, this would come from your database
const sampleModels = [
  { id: 1, name: "Robot Character", category: "Characters", file: "robot.glb", dateAdded: "2023-10-15" },
  { id: 2, name: "Office Chair", category: "Furniture", file: "chair.glb", dateAdded: "2023-10-12" },
  { id: 3, name: "Sports Car", category: "Vehicles", file: "car.glb", dateAdded: "2023-10-10" },
  { id: 4, name: "Potted Plant", category: "Nature", file: "plant.glb", dateAdded: "2023-10-08" },
  { id: 5, name: "Smartphone", category: "Electronics", file: "phone.glb", dateAdded: "2023-10-05" },
]

export default function ModelsTable() {
  const [models, setModels] = useState(sampleModels)

  const handleDelete = (id) => {
    // In a real app, you would call an API to delete the model
    setModels(models.filter((model) => model.id !== id))
  }

  const columns = [
    {
      title: "",
      key: "icon",
      width: 50,
      render: () => <CubeOutlined style={{ fontSize: 16, color: "#8c8c8c" }} />,
    },
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      render: (text) => <Typography.Text strong>{text}</Typography.Text>,
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      render: (category) => <Tag color="blue">{category}</Tag>,
    },
    {
      title: "File",
      dataIndex: "file",
      key: "file",
    },
    {
      title: "Date Added",
      dataIndex: "dateAdded",
      key: "dateAdded",
    },
    {
      title: "Actions",
      key: "actions",
      align: "right",
      render: (_, record) => (
        <Dropdown
          overlay={
            <Menu
              items={[
                {
                  key: "preview",
                  icon: <EyeOutlined />,
                  label: "Preview",
                },
                {
                  key: "edit",
                  icon: <EditOutlined />,
                  label: "Edit",
                },
                {
                  type: "divider",
                },
                {
                  key: "delete",
                  icon: <DeleteOutlined />,
                  label: (
                    <Popconfirm
                      title="Are you sure you want to delete this model?"
                      onConfirm={() => handleDelete(record.id)}
                      okText="Yes"
                      cancelText="No"
                    >
                      <Typography.Text type="danger">Delete</Typography.Text>
                    </Popconfirm>
                  ),
                  danger: true,
                },
              ]}
            />
          }
          trigger={["click"]}
        >
          <Button icon={<MoreOutlined />} size="small" />
        </Dropdown>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      dataSource={models}
      rowKey="id"
      locale={{
        emptyText: (
          <div className="py-8 text-center">
            <Typography.Text type="secondary">
              No models found.{" "}
              <Link href="/models/add" style={{ color: "#1890ff" }}>
                Add your first model
              </Link>
            </Typography.Text>
          </div>
        ),
      }}
    />
  )
}

