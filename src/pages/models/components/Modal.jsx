import { Button, Drawer, Space, Upload } from "antd";
import { Form, Input, Select, Row, Col } from "antd";
import { carsPatch, carsPost, categoriesList } from "../../../api/urls";
import { useLoad, usePatchRequest, usePostRequest } from "../../../api/request";
import { InboxOutlined, UploadOutlined } from "@ant-design/icons";
import { useState } from "react";
import { message } from "antd";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
const { Option } = Select;

const { Dragger } = Upload;

const GLBViewer = ({ fileUrl }) => {
  const { scene } = useGLTF(fileUrl);
  return <primitive object={scene} scale={2} />;
};

const ModelsModal = ({
  open,
  form,
  setOpen,
  setIsUpdate,
  isUpdate,
  reload,
}) => {
  const postRequest = usePostRequest({ url: carsPost });
  const patchRequest = usePatchRequest();
  const { response: categories, loading: CategoriesLoading } = useLoad({
    url: categoriesList,
  });

  const [fileUrl, setFileUrl] = useState(null);

  const props = {
    accept: ".glb",
    beforeUpload: (file) => {
      console.log("File details:", file);
      console.log("Detected MIME Type:", file.type);

      const isGLB = file.name.toLowerCase().endsWith(".glb");
      if (!isGLB) {
        message.error("You can only upload .glb files!");
        return false;
      }

      const url = URL.createObjectURL(file);
      setFileUrl(url);
      return false;
    },
  };

  const handleCancel = () => {
    setOpen(false);
    setIsUpdate(null);
    form.resetFields();
    setFileUrl(null);
  };

  const handleFinish = async (data) => {
    console.log("Form Data:", data);
    console.log("File URL:", fileUrl);

    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("category", data.category);
    formData.append("file", data.file.originFileObj || data.file); // Ensure it's a File object

    try {
      const { success } = isUpdate
        ? await patchRequest.request({
            url: carsPatch(isUpdate), // Make sure isUpdate is an ID
            data: formData,
            headers: { "Content-Type": "multipart/form-data" },
          })
        : await postRequest.request({
            data: formData,
            headers: { "Content-Type": "multipart/form-data" },
          });

      if (success) {
        reload();
        handleCancel();
        openSuccessNotification();
      }
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handleSubmit = () => {
    form.submit();
  };

  return (
    <>
      <Drawer
        title={`Model Add`}
        placement="right"
        size="large"
        closable={false}
        open={open}
        extra={
          <Space>
            <Button onClick={handleCancel}>Cancel</Button>
            <Button type="primary" onClick={handleSubmit}>
              OK
            </Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Row gutter={[16, 16]} layout="vertical">
            <Col span={12}>
              <Form.Item
                name="name"
                label="Car Name"
                rules={[
                  { required: true, message: "Please enter the car name" },
                ]}
              >
                <Input placeholder="Enter car name" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[
                  { required: true, message: "Please select a category" },
                ]}
              >
                <Select
                  placeholder="Select a category"
                  loading={CategoriesLoading}
                >
                  {categories?.map((category) => (
                    <Option key={category.id} value={category.id}>
                      {category.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="file"
                label="Upload 3D Model"
                rules={[
                  {
                    required: true,
                    message: "Please upload a 3D model",
                  },
                ]}
              >
                <Dragger {...props} showUploadList={false}>
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">
                    Click or drag a .glb file to upload
                  </p>
                </Dragger>
              </Form.Item>
            </Col>
            <Col span={24}>
              {fileUrl && (
                <Canvas
                  style={{
                    width: "100%",
                    height: "400px",
                    marginTop: "20px",
                  }}
                >
                  <ambientLight intensity={0.5} />
                  <directionalLight position={[2, 2, 2]} />
                  <GLBViewer fileUrl={fileUrl} />
                  <OrbitControls />
                </Canvas>
              )}
            </Col>
          </Row>
        </Form>
      </Drawer>
    </>
  );
};
export default ModelsModal;
