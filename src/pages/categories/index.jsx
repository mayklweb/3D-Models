import { useState } from "react";
import { Button, Table, Space, Typography, Form, App, Spin } from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CarOutlined,
} from "@ant-design/icons";

import useDeleteModal from "../../hooks/useDeleteModal";
import { categoriesDelete, categoriesList } from "../../api/urls";
import { useLoad } from "../../hooks/request";
import CategoriesTable from "./components/Table";
import CategoriesModal from "./components/Modal";

const { Title } = Typography;

export default function Categories() {
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const deleteModal = useDeleteModal();
  const [isUpdate, setIsUpdate] = useState(null);

  const {
    response: categories,
    loading,
    request: reload,
  } = useLoad({ url: categoriesList });

  const handleAdd = () => {
    setOpen(true);
  };

  const handleEdit = (item) => {
    form.setFieldsValue(item);
    setIsUpdate(item.id);
    setOpen(true);
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
          <Button
            icon={<DeleteOutlined />}
            danger
            onClick={() => deleteModal(categoriesDelete(item.id), reload)}
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
            <Title level={3}>Categories</Title>
          </div>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Add Car
            </Button>
          </Space>
        </div>

        <CategoriesTable
          loading={loading}
          categories={categories}
          columns={columns}
          handleAdd={handleAdd}
        />
        <CategoriesModal
          open={open}
          form={form}
          setOpen={setOpen}
          isUpdate={isUpdate}
          setIsUpdate={setIsUpdate}
          reload={reload}
        />
      </div>
    </App>
  );
}
