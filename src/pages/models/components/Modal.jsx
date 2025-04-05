import {
  Button,
  Collapse,
  Drawer,
  InputNumber,
  Space,
  Tabs,
  Upload,
} from "antd";
import { Form, Input, Select, Row, Col } from "antd";
import { carsPatch, carsPost, categoriesList } from "../../../api/urls";
import { useLoad, usePatchRequest, usePostRequest } from "../../../api/request";
import { InboxOutlined, UploadOutlined } from "@ant-design/icons";
import { useEffect, useMemo, useState } from "react";
import { message } from "antd";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
const { Option } = Select;

const { Dragger } = Upload;
const { Panel } = Collapse;

const ModelViewer = ({ fileUrl, position, rotation, scale }) => {
  // Add proper null/undefined checks
  if (!fileUrl || typeof fileUrl !== "string") return null;

  // useGLTF now accepts a second parameter for GLTFLoader options
  const { scene } = useGLTF(fileUrl, true);

  // Clone the scene to avoid modifying the original
  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    clone.position.set(...position);
    clone.rotation.set(...rotation);
    clone.scale.set(...scale);
    return clone;
  }, [scene, position, rotation, scale]);

  return <primitive object={clonedScene} />;
};

const ModelsModal = ({
  open,
  form,
  setOpen,
  setIsUpdate,
  isUpdate,
  reload,
  carFileUrl,
  setCarFileUrl,
  openSuccessNotification,
}) => {
  const postRequest = usePostRequest({ url: carsPost });
  const patchRequest = usePatchRequest();
  const { response: categories, loading: CategoriesLoading } = useLoad({
    url: categoriesList,
  });

  const [frontPlateFileUrl] = useState("/models/front_plate.glb");
  const [backPlateFileUrl] = useState("/models/back_plate.glb");
  const [activePlateTab, setActivePlateTab] = useState("front");
  const [showPlates, setShowPlates] = useState(false);
  const [carFileObject, setCarFileObject] = useState(null); // Separate state for the File object
  const [plateSettings, setPlateSettings] = useState({
    front: {
      position: [0, 0.25, 3.04],
      rotation: [0, 0, 0],
      scale: [0.8, 0.8, 0.8],
    },
    back: {
      position: [0, 0.3, -2.5],
      rotation: [0, Math.PI, 0],
      scale: [0.8, 0.8, 0.8],
    },
  });

  useEffect(() => {
    return () => {
      // Clean up object URLs when component unmounts
      if (carFileUrl) URL.revokeObjectURL(carFileUrl);
    };
  }, [carFileUrl]);

  const modelConfig = {
    colorMeshes: ["TEX.005"],
    licensePlate: {
      front: {
        position: [0, 0.25, 3.04],
        rotation: [-1.57079632679, 3.14159265359, 3.14159265359],
        scale: [0.1, 0.1, 0.1],
        textPosition: {
          main: [-0.125, 0.235, 3.05],
          region: [-0.21, 0.235, 3.05],
        },
        textScale: {
          main: [1.3, 1.2, 1],
          region: [1, 1.1, 1],
        },
        textSize: 0.031,
        letterSpacing: 0.01,
      },
      back: {
        position: [0, 0.6, -0.8],
        rotation: [-1.57079632679, 3.14159265359, 0],
        scale: [0.09, 0.1, 0.1],
        textPosition: {
          main: [0.11, 0.59, -0.8],
          region: [0.195, 0.59, -0.8],
        },
        textScale: {
          main: [1.5, 1.4, 1],
          region: [1.5, 1.2, 1],
        },
        textSize: 0.023,
        letterSpacing: {
          main: 0.009,
          region: 0.005,
        },
      },
    },
  };

  const availableColors = [
    {
      id: "nardo-grey",
      name: "Nardo Grey",
      hex: "#808080",
    },
    {
      id: "midnight-purple",
      name: "Midnight Purple",
      hex: "#2D1B4B",
    },
    {
      id: "frozen-black",
      name: "Frozen Black Metallic",
      hex: "#1B1B1B",
    },
    {
      id: "british-racing-green",
      name: "British Racing Green",
      hex: "#004225",
    },
    {
      id: "tanzanite-blue",
      name: "Tanzanite Blue Metallic",
      hex: "#1F2C5C",
    },
    {
      id: "sakhir-orange",
      name: "Sakhir Orange Metallic",
      hex: "#E25822",
    },
    {
      id: "chalk-grey",
      name: "Chalk Grey",
      hex: "#D6D3D1",
    },
    {
      id: "daytona-blue",
      name: "Daytona Blue",
      hex: "#0F4D92",
    },
    {
      id: "carbon-black",
      name: "Carbon Black Metallic",
      hex: "#1C1E21",
    },
    {
      id: "rosso-corsa",
      name: "Rosso Corsa",
      hex: "#D40000",
    },
    {
      id: "sepang-bronze",
      name: "Sepang Bronze Metallic",
      hex: "#8B6C42",
    },
    {
      id: "laguna-seca-blue",
      name: "Laguna Seca Blue",
      hex: "#4785B4",
    },
    {
      id: "santorini-blue",
      name: "Santorini Blue",
      hex: "#2469AD",
    },
    {
      id: "arctic-silver",
      name: "Arctic Silver Metallic",
      hex: "#D2D4D7",
    },
    {
      id: "lava-orange",
      name: "Lava Orange",
      hex: "#E86C29",
    },
  ];

  const carUploadProps = {
    accept: ".glb",
    beforeUpload: (file) => {
      const url = URL.createObjectURL(file);
      setCarFileUrl(url); // Store URL string
      setCarFileObject(file); // Store File object separately
      setShowPlates(true);
      return false;
    },
    showUploadList: false,
  };

  const handleCancel = () => {
    setOpen(false);
    setIsUpdate(null);
    form.resetFields();
    setCarFileUrl(null);
  };

  const handleFinish = async (data) => {
    const formData = new FormData();

    // Append all form fields
    formData.append("name", data.name);
    formData.append("category", data.category);
    formData.append("file", carFileUrl.file); // Append the actual File object
    formData.append("photo", carFileUrl.file); // Append the actual File object

    // Stringify JSON data
    formData.append("modelConfig", JSON.stringify(modelConfig));
    formData.append("availableColors", JSON.stringify(availableColors));

    try {
      const { success } = isUpdate
        ? await patchRequest.request({
            url: carsPatch(isUpdate),
            data: formData,
            // Don't set Content-Type header manually - the browser will set it with the correct boundary
          })
        : await postRequest.request({
            data: formData,
            // Don't set Content-Type header manually
          });

      if (success) {
        reload();
        handleCancel();
        openSuccessNotification();
      }
    } catch (error) {
      console.error("Upload failed:", error);
      message.error(
        error.response?.data?.message || "Upload failed. Please try again."
      );
    }

    // To inspect FormData contents:
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }
  };
  const handleSubmit = () => {
    form.submit();
  };

  const updatePlateSettings = (plateType, field, axis, value) => {
    setPlateSettings((prev) => ({
      ...prev,
      [plateType]: {
        ...prev[plateType],
        [field]: [
          ...prev[plateType][field].slice(0, axis),
          value,
          ...prev[plateType][field].slice(axis + 1),
        ],
      },
    }));
  };

  const renderPlateSettings = (plateType) => (
    <div style={{ padding: 16 }}>
      <h4>Position</h4>
      <Row gutter={16}>
        {["x", "y", "z"].map((axis, i) => (
          <Col span={8} key={axis}>
            <InputNumber
              value={plateSettings[plateType].position[i]}
              onChange={(value) =>
                updatePlateSettings(plateType, "position", i, value)
              }
              step={0.01}
              style={{ width: "100%" }}
              addonBefore={axis.toUpperCase()}
            />
          </Col>
        ))}
      </Row>

      <h4 style={{ marginTop: 16 }}>Rotation (radians)</h4>
      <Row gutter={16}>
        {["x", "y", "z"].map((axis, i) => (
          <Col span={8} key={axis}>
            <InputNumber
              value={plateSettings[plateType].rotation[i]}
              onChange={(value) =>
                updatePlateSettings(plateType, "rotation", i, value)
              }
              step={0.01}
              style={{ width: "100%" }}
              addonBefore={axis.toUpperCase()}
            />
          </Col>
        ))}
      </Row>

      <h4 style={{ marginTop: 16 }}>Scale</h4>
      <Row gutter={16}>
        {["x", "y", "z"].map((axis, i) => (
          <Col span={8} key={axis}>
            <InputNumber
              value={plateSettings[plateType].scale[i]}
              onChange={(value) =>
                updatePlateSettings(plateType, "scale", i, value)
              }
              step={0.01}
              min={0.01}
              style={{ width: "100%" }}
              addonBefore={axis.toUpperCase()}
            />
          </Col>
        ))}
      </Row>
    </div>
  );

  return (
    <>
      <Drawer
        style={{ width: "100%" }}
        title={`Model Add`}
        placement="right"
        size="large"
        width={"100%"}
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
          <div style={{ display: "flex", gap: 20 }}>
            <Row gutter={[16, 16]}>{}</Row>

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
              <Col span={8}>
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
                  <Dragger {...carUploadProps} style={{ marginBottom: 16 }}>
                    <p className="ant-upload-drag-icon">
                      <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">Upload Car Model (.glb)</p>
                  </Dragger>
                </Form.Item>
              </Col>

              <Col span={16}>
                <Canvas
                  style={{
                    width: "100%",
                    height: "500px",
                    border: "1px solid #d9d9d9",
                    background: "#f0f0f0",
                  }}
                >
                  <ambientLight intensity={0.5} />
                  <directionalLight position={[2, 2, 2]} />
                  {carFileUrl && (
                    <ModelViewer
                      fileUrl={carFileUrl}
                      position={[0, 0, 0]}
                      rotation={[0, 0, 0]}
                      scale={[1, 1, 1]}
                    />
                  )}
                  {showPlates && (
                    <>
                      <ModelViewer
                        fileUrl={frontPlateFileUrl}
                        position={plateSettings.front.position}
                        rotation={plateSettings.front.rotation}
                        scale={plateSettings.front.scale}
                      />
                      <ModelViewer
                        fileUrl={backPlateFileUrl}
                        position={plateSettings.back.position}
                        rotation={plateSettings.back.rotation}
                        scale={plateSettings.back.scale}
                      />
                    </>
                  )}
                  <OrbitControls />
                </Canvas>
                {!carFileUrl && (
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      textAlign: "center",
                      color: "#999",
                      width: "100%",
                    }}
                  >
                    <p>Upload a car model to begin</p>
                  </div>
                )}
              </Col>

              <Col span={12}>
                {showPlates && (
                  <Collapse
                    defaultActiveKey={["1"]}
                    items={[
                      {
                        key: "1",
                        label: "Number Plate Settings",
                        children: (
                          <Tabs
                            activeKey={activePlateTab}
                            onChange={setActivePlateTab}
                            items={[
                              {
                                key: "front",
                                label: "Front Plate",
                                children: renderPlateSettings("front"),
                              },
                              {
                                key: "back",
                                label: "Back Plate",
                                children: renderPlateSettings("back"),
                              },
                            ]}
                          />
                        ),
                      },
                    ]}
                  />
                )}
              </Col>
            </Row>
          </div>
        </Form>
      </Drawer>
    </>
  );
};
export default ModelsModal;
