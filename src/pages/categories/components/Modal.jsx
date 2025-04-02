import React, { useState } from "react";
import { Button, Form, Input, Modal, notification } from "antd";
import { categoriesPatch, categoriesPost } from "../../../api/urls";
import { usePatchRequest, usePostRequest } from "../../../api/request";

const CategoriesModal = ({
  open,
  form,
  setOpen,
  reload,
  isUpdate,
  setIsUpdate,
}) => {
  const [loading, setLoading] = useState(false);
  const postRequest = usePostRequest({ url: categoriesPost });
  const patchRequest = usePatchRequest();
  const [api, contextHolder] = notification.useNotification();

  const openSuccessNotification = () => {
    api.success({
      message: isUpdate
        ? "Cartegory updated successful!"
        : "Cartegory created successful!",
    });
  };

  const handleFinish = async (data) => {
    console.log(data);

    const { success } = isUpdate  
      ? await patchRequest.request({
          url: categoriesPatch(isUpdate),
          data,
        })
      : await postRequest.request({ data });
    if (success) {
      reload();
      handleCanel();
      openSuccessNotification();
    }
  };

  const handleCanel = () => {
    setOpen(false);
    setIsUpdate(null);
    form.resetFields();
  };

  const handleSubmit = () => {
    form.submit();
  };

  const handleCancel = () => {
    setOpen(false);
  };
  
  return (
    <>
      <Modal
        open={open}
        title="Title"
        onOk={handleSubmit}
        onCancel={handleCancel}
        footer={[
          <Button key="back" onClick={handleCancel}>
            Cancel
          </Button>,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={handleSubmit}
          >
            Submit
          </Button>,
        ]}
      >
        {contextHolder}
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item
            name="name"
            label="Category Name"
            rules={[
              { required: true, message: "Please enter the Category name" },
            ]}
          >
            <Input placeholder="Enter category name" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};
export default CategoriesModal;
