"use client";

import { useState } from "react";
import { Button, Table, Space, Typography, Form, App, Spin } from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CarOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { useLoad } from "@/services/request";
import { carsDelete, carsList } from "@/services/urls";
import useDeleteModal from "@/components/useDeleteModal";
import { useRouter } from "next/navigation";
import { useModelStore } from "@/store/store";

const { Title, Text } = Typography;

export default function Models() {
  const [form] = Form.useForm();
  const router = useRouter();

  const setSelectedModel = useModelStore((state) => state.setSelectedModel);
  const [categories, setCategories] = useState([]);

  const deleteModal = useDeleteModal();

  const {
    response: cars,
    loading,
    request: reload,
  } = useLoad({ url: carsList });

  const handleEdit = (model) => {
    setSelectedModel(model);
    router.push("/models/add");
  };

  const handleAdd = () => {
    router.push("/models/add");
  };

  const handleViewCar = (car) => {
    setCurrentCar(car);
    setModalMode("view");
    form.setFieldsValue(car);
    setIsModalOpen(true);
  };

  const columns = [
    {
      title: "ID",
      dataIndex: "id",
    },
    {
      title: "Name",
      dataIndex: "name",
    },
    {
      title: "Category",
      dataIndex: "category",
    },
    {
      title: "Actions",
      render: (item) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => handleEdit(item)} />
          <Button icon={<EyeOutlined />} onClick={handleAdd} />
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => deleteModal(carsDelete(item.id), reload)}
          />
        </Space>
      ),
    },
  ];

  return (
    <App>
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div>
            <Title level={2}>Car Models</Title>
          </div>
          <Space>
            <Link href="/models/add">
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                Add Car
              </Button>
            </Link>
          </Space>
        </div>

        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "50px 0",
            }}
          >
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={cars}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            locale={{
              emptyText: (
                <div style={{ padding: "24px 0", textAlign: "center" }}>
                  <div style={{ marginBottom: 16 }}>
                    <CarOutlined style={{ fontSize: 24, opacity: 0.5 }} />
                  </div>
                  <Text type="secondary">No cars found</Text>
                  <div style={{ marginTop: 16 }}>
                    <Button type="primary" onClick={handleAdd}>
                      Add your first car
                    </Button>
                  </div>
                </div>
              ),
            }}
          />
        )}
      </div>
    </App>
  );
}
