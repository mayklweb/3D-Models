"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Form, Input, Select, Button, Upload, Space, message } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useLoad, usePatchRequest, usePostRequest } from "@/services/request";
import { carsPatch, carsPost, categoriesList } from "@/services/urls";
import { useModelStore } from "@/store/store";

const { Option } = Select;

export default function ModelForm() {
  const router = useRouter();
  const [form] = Form.useForm();
  const postRequest = usePostRequest({ url: carsPost });
  const patchRequest = usePatchRequest();
  const [isUpdate, setIsUpdate] = useState(null);
  const [formData, setFormData] = useState(null);
  const [fileList, setFileList] = useState(null);
  const { selectedModel, clearSelectedModel } = useModelStore();

  useEffect(() => {
    if (selectedModel) {
      setFormData(selectedModel);
      form.setFieldsValue(selectedModel);
      setFileList([
        {
          uid: '-1',
          name: selectedModel.name,
          status: 'done',
          url: selectedModel.file,
        }
      ])
      console.log(selectedModel.file)
    }
    return () => clearSelectedModel(); // Sahifa o'zgarganda state tozalanadi
  }, [selectedModel, clearSelectedModel]);

  const {
    response: categories,
    loading,
    request: reload,
  } = useLoad({ url: categoriesList });

  const beforeUpload = (file) => {
    const isGlb = file.name.endsWith(".glb");
    if (!isGlb) {
      message.error("You can only upload GLB files!");
    }

    const isLt50M = file.size / 1024 / 1024 < 50;
    if (!isLt50M) {
      message.error("File must be smaller than 50MB!");
    }

    return false; 
  };



  const handleFinish = async (data) => {
    let formData = new FormData()
    formData.append('name', data.name)
    formData.append('category', data.category)
    formData.append('file', data.file)

    
    console.log(data);
    const { success } = isUpdate
      ? await patchRequest.request({ url: carsPatch(isUpdate), formData })
      : await postRequest.request({ data: formData });
    if (success) {
      reload();
      handleCanel();
    }
  };

  const handleCanel = () => {
    router.push('/models')
    setIsUpdate(null);
    form.resetFields();
  };

  const handleChange = ({ fileList: newFileList }) => {
    setFileList(newFileList);

    if (newFileList.length > 0) {
      form.setFieldsValue({ file: newFileList[0].originFileObj });
    } else {
      form.setFieldsValue({ file: undefined });
    }
  };

  console.log(fileList)

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleFinish}
      requiredMark={false}
    >
      <Form.Item
        label="Model Name"
        name="name"
        rules={[
          { required: true, message: "Please enter a model name", min: 2 },
        ]}
      >
        <Input placeholder="Enter model name" />
      </Form.Item>

      <Form.Item
        label="Category"
        name="category"
        rules={[{ required: true, message: "Please select a category" }]}
      >
        <Select placeholder="Select a category" loading={loading}>
          {categories?.map((category) => (
            <Option key={category.id} value={category.id}>
              {category.name}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        label="Model File (GLB)"
        name="file"
        rules={[{ required: true, message: "Please upload a GLB file" }]}
        extra="Upload a GLB file for your 3D model. Maximum file size: 50MB."
      >
        <Upload
          beforeUpload={beforeUpload}
          fileList={fileList}
          onChange={handleChange}
          maxCount={1}
          accept=".glb"
          listType="text"
        >
          <Button icon={<UploadOutlined />}>Upload GLB File</Button>
        </Upload>
      </Form.Item>

      <Form.Item>
        <Space>
          <Button type="primary" htmlType="submit" loading={isUpdate}>
            {isUpdate ? "Uploading..." : "Save Model"}
          </Button>
          <Button onClick={() => router.push("/models")}>Cancel</Button>
        </Space>
      </Form.Item>
    </Form>
  );
}
