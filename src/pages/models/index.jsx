import { useState } from "react";
import { Button, Space, Typography, Form, App, notification } from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
} from "@ant-design/icons";

import useDeleteModal from "../../hooks/useDeleteModal";
import { carsDelete, carsList } from "../../api/urls";
import { useLoad } from "../../hooks/request";
import ModelsTable from "./components/Table";
import ModelsModal from "./components/Modal";

const { Title } = Typography;

export default function Models() {
  const [form] = Form.useForm();
  const [open, setOpen] = useState(false);
  const [isUpdate, setIsUpdate] = useState(null);
  const [showPlates, setShowPlates] = useState(false);

  const deleteModal = useDeleteModal();
  const [carFileUrl, setCarFileUrl] = useState(null);
  const [apiUrl, setApiUrl] = useState(null); // API dan kelgan eski model URL
  


  const {
    response: cars,
    loading,
    request: reload,
  } = useLoad({ url: carsList });


  const handleAdd = () => {
    setOpen(true);
  };

  const [api, contextHolder] = notification.useNotification();

  const openSuccessNotification = () => {
    api.success({
      message: isUpdate
        ? "Model updated successful!"
        : "Model created successful!",
    });
  };

  const handleEdit = (item) => {
    setCarFileUrl(item.file)
    console.log(item.file);
    setShowPlates(true)
    form.setFieldsValue(item);
    setIsUpdate(item.id);
    setOpen(true);
  };

  const handleViewCar = (car) => {
    // console.log(car);
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
          <Button icon={<EyeOutlined />} onClick={handleViewCar(item)} />
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
        {contextHolder}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div>
            <Title level={3}>Models</Title>
          </div>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
              Add Car
            </Button>
          </Space>
        </div>

        <ModelsTable
          cars={cars}
          columns={columns}
          loading={loading}
          handleAdd={handleAdd}
        />
        <ModelsModal
          form={form}
          open={open}
          reload={reload}
          setOpen={setOpen}
          isUpdate={isUpdate}
          setIsUpdate={setIsUpdate}
          carFileUrl={carFileUrl}
          setCarFileUrl={setCarFileUrl}
          apiUrl={apiUrl}
          setApiUrl={setApiUrl}
          openSuccessNotification={openSuccessNotification}
          showPlates={showPlates}
          setShowPlates={setShowPlates}
        />
      </div>
    </App>
  );
}
