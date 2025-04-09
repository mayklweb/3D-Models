import React, { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import {
  Button,
  Collapse,
  Drawer,
  InputNumber,
  Space,
  Tabs,
  Upload,
  Form,
  Input,
  Select,
  Row,
  Col,
  message,
  Slider,
  Switch,
} from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { useLoad, usePatchRequest, usePostRequest } from "../../../api/request";
import { carsPost, categoriesList, carsPatch } from "../../../api/urls";

const { Option } = Select;
const { Dragger } = Upload;
const { Panel } = Collapse;

const ModelViewer = ({
  fileUrl,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  materialSettings = {},
  onMaterialsLoaded,
}) => {
  const { scene } = useGLTF(fileUrl, true);
  const sceneRef = useRef();

  useEffect(() => {
    if (!scene) return;

    const clone = scene.clone();
    clone.position.set(...position);
    clone.rotation.set(...rotation);
    clone.scale.set(...scale);

    const materialsList = [];
    clone.traverse((child) => {
      if (child.material) {
        const materialsArray = Array.isArray(child.material)
          ? child.material
          : [child.material];

        materialsArray.forEach((material) => {
          if (!materialsList.some((m) => m.uuid === material.uuid)) {
            materialsList.push({
              uuid: material.uuid,
              name: material.name || "unnamed",
              type: material.type,
              isMeshStandardMaterial: material.isMeshStandardMaterial,
              color: material.color.clone(),
              map: material.map,
              metalness: material.metalness,
              roughness: material.roughness,
            });
          }
        });
      }
    });

    if (onMaterialsLoaded) {
      onMaterialsLoaded(materialsList);
    }

    sceneRef.current = clone;

    return () => {
      clone.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];
          materials.forEach((material) => material.dispose());
        }
      });
    };
  }, [scene, position.join(","), rotation.join(","), scale.join(",")]);

  useEffect(() => {
    if (!sceneRef.current) return;

    sceneRef.current.traverse((child) => {
      if (child.material) {
        const materialsArray = Array.isArray(child.material)
          ? child.material
          : [child.material];

        materialsArray.forEach((material) => {
          if (materialSettings[material.uuid]) {
            const settings = materialSettings[material.uuid];
            if (settings.color) material.color.copy(settings.color);
            if (settings.metalness !== undefined)
              material.metalness = settings.metalness;
            if (settings.roughness !== undefined)
              material.roughness = settings.roughness;
            material.needsUpdate = true;
          }
        });
      }
    });
  }, [materialSettings]);

  return sceneRef.current ? <primitive object={sceneRef.current} /> : null;
};

const PlateViewer = ({ fileUrl, position, rotation, scale }) => {
  const { scene } = useGLTF(fileUrl, true);
  const sceneRef = useRef();

  useEffect(() => {
    if (!scene) return;

    const clone = scene.clone();
    clone.position.set(...position);
    clone.rotation.set(...rotation);
    clone.scale.set(...scale);
    sceneRef.current = clone;

    return () => {
      clone.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          const materials = Array.isArray(child.material)
            ? child.material
            : [child.material];
          materials.forEach((material) => material.dispose());
        }
      });
    };
  }, [scene, position, rotation, scale]);

  return sceneRef.current ? <primitive object={sceneRef.current} /> : null;
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
  const [modelColor, setModelColor] = useState("");
  const [showPlates, setShowPlates] = useState(false);
  const [carFileObject, setCarFileObject] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [materialSettings, setMaterialSettings] = useState({});
  const [modelScale, setModelScale] = useState(1);
  console.log(modelScale);
  
  const [plateSettings, setPlateSettings] = useState({
    front: {
      position: [0, 0.5, 2.5],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
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
      position: [0, 0.5, -2.5],
      rotation: [0, Math.PI, 0],
      scale: [1, 1, 1],
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
  });

  // Create memoized modelConfig that updates when dependencies change
  const modelConfig = useMemo(() => ({
    colorMeshes: [modelColor],
    licensePlate: {
      front: { ...plateSettings.front },
      back: { ...plateSettings.back },
    },
    scale: modelScale,
  }), [modelColor, plateSettings, modelScale]);

  const availableColors = [
    { id: "nardo-grey", name: "Nardo Grey", hex: "#808080" },
    { id: "midnight-purple", name: "Midnight Purple", hex: "#2D1B4B" },
    { id: "frozen-black", name: "Frozen Black Metallic", hex: "#1B1B1B" },
    { id: "british-racing-green", name: "British Racing Green", hex: "#004225" },
    { id: "tanzanite-blue", name: "Tanzanite Blue Metallic", hex: "#1F2C5C" },
    { id: "sakhir-orange", name: "Sakhir Orange Metallic", hex: "#E25822" },
    { id: "chalk-grey", name: "Chalk Grey", hex: "#D6D3D1" },
    { id: "daytona-blue", name: "Daytona Blue", hex: "#0F4D92" },
    { id: "carbon-black", name: "Carbon Black Metallic", hex: "#1C1E21" },
    { id: "rosso-corsa", name: "Rosso Corsa", hex: "#D40000" },
    { id: "sepang-bronze", name: "Sepang Bronze Metallic", hex: "#8B6C42" },
    { id: "laguna-seca-blue", name: "Laguna Seca Blue", hex: "#4785B4" },
    { id: "santorini-blue", name: "Santorini Blue", hex: "#2469AD" },
    { id: "arctic-silver", name: "Arctic Silver Metallic", hex: "#D2D4D7" },
    { id: "lava-orange", name: "Lava Orange", hex: "#E86C29" },
  ];

  const carUploadProps = {
    accept: ".glb",
    beforeUpload: (file) => {
      const url = URL.createObjectURL(file);
      setCarFileUrl(url);
      setCarFileObject(file);
      setShowPlates(true);
      return false;
    },
    showUploadList: false,
  };

  // Initialize form with API data when in edit mode
  useEffect(() => {
    if (isUpdate) {
      form.setFieldsValue({
        name: isUpdate.name,
        category: isUpdate.category,
      });

      setModelScale(isUpdate.modelConfig?.scale || 1);
      
      setPlateSettings({
        front: {
          position: isUpdate.modelConfig?.licensePlate?.front?.position || [0, 0.5, 2.5],
          rotation: isUpdate.modelConfig?.licensePlate?.front?.rotation || [0, 0, 0],
          scale: isUpdate.modelConfig?.licensePlate?.front?.scale || [1, 1, 1],
          textPosition: isUpdate.modelConfig?.licensePlate?.front?.textPosition || {
            main: [-0.125, 0.235, 3.05],
            region: [-0.21, 0.235, 3.05],
          },
          textScale: isUpdate.modelConfig?.licensePlate?.front?.textScale || {
            main: [1.3, 1.2, 1],
            region: [1, 1.1, 1],
          },
          textSize: isUpdate.modelConfig?.licensePlate?.front?.textSize || 0.031,
          letterSpacing: isUpdate.modelConfig?.licensePlate?.front?.letterSpacing || 0.01,
        },
        back: {
          position: isUpdate.modelConfig?.licensePlate?.back?.position || [0, 0.5, -2.5],
          rotation: isUpdate.modelConfig?.licensePlate?.back?.rotation || [0, Math.PI, 0],
          scale: isUpdate.modelConfig?.licensePlate?.back?.scale || [1, 1, 1],
          textPosition: isUpdate.modelConfig?.licensePlate?.back?.textPosition || {
            main: [0.11, 0.59, -0.8],
            region: [0.195, 0.59, -0.8],
          },
          textScale: isUpdate.modelConfig?.licensePlate?.back?.textScale || {
            main: [1.5, 1.4, 1],
            region: [1.5, 1.2, 1],
          },
          textSize: isUpdate.modelConfig?.licensePlate?.back?.textSize || 0.023,
          letterSpacing: isUpdate.modelConfig?.licensePlate?.back?.letterSpacing || {
            main: 0.009,
            region: 0.005,
          },
        },
      });

      if (isUpdate.modelUrl) {
        setCarFileUrl(isUpdate.modelUrl);
        setShowPlates(true);
      }
    } else {
      form.resetFields();
      setModelScale(1);
      setPlateSettings({
        front: {
          position: [0, 0.5, 2.5],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
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
          position: [0, 0.5, -2.5],
          rotation: [0, Math.PI, 0],
          scale: [1, 1, 1],
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
      });
      setCarFileUrl(null);
      setShowPlates(false);
    }
  }, [isUpdate, form]);

  const handleCancel = () => {
    setOpen(false);
    setIsUpdate(null);
    form.resetFields();
    setCarFileUrl(null);
    setMaterials([]);
    setMaterialSettings({});
    setModelScale(1);
    setPlateSettings({
      front: {
        position: [0, 0.5, 2.5],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
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
        position: [0, 0.5, -2.5],
        rotation: [0, Math.PI, 0],
        scale: [1, 1, 1],
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
    });
  };

  const handleFinish = async (data) => {
    const formData = new FormData();
    formData.append("name", data.name);
    formData.append("category", data.category);
    if (carFileObject) {
      formData.append("file", carFileObject);
    }
    formData.append("modelConfig", JSON.stringify(modelConfig));
    formData.append("availableColors", JSON.stringify(availableColors));

    try {
      const { success } = isUpdate
        ? await patchRequest.request({
            url: carsPatch(isUpdate),
            data: formData,
          })
        : await postRequest.request({ data: formData });

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

  const updateMaterialProperty = (materialId, property, value) => {
    setMaterialSettings((prev) => ({
      ...prev,
      [materialId]: {
        ...prev[materialId],
        [property]: value,
      },
    }));
  };

  const getColorValue = (materialId) => {
    const currentColor =
      materialSettings[materialId]?.color ||
      materials.find((m) => m.uuid === materialId)?.color;
    return currentColor ? `#${currentColor.getHexString()}` : "#ffffff";
  };

  const handleMaterialSelect = (uuid) => {
    const selected = materials.find((m) => m.uuid === uuid);
    setSelectedMaterial(uuid);
    if (selected) {
      setModelColor(selected.name);
    }
  };

  const renderPlateSettings = (plateType) => (
    <div style={{ padding: 16 }}>
      <h4>Position</h4>
      {["x", "y", "z"].map((axis, i) => (
        <div key={axis} style={{ marginBottom: 16 }}>
          <label>{axis.toUpperCase()}</label>
          <Slider
            min={-5}
            max={5}
            step={0.01}
            value={plateSettings[plateType].position[i]}
            onChange={(value) =>
              updatePlateSettings(plateType, "position", i, value)
            }
            tooltip={{ formatter: (value) => value?.toFixed(2) }}
          />
          <InputNumber
            min={-5}
            max={5}
            step={0.01}
            value={plateSettings[plateType].position[i]}
            onChange={(value) =>
              updatePlateSettings(plateType, "position", i, value)
            }
            style={{ width: "100%", marginTop: 8 }}
          />
        </div>
      ))}

      <h4 style={{ marginTop: 24 }}>Rotation (radians)</h4>
      {["x", "y", "z"].map((axis, i) => (
        <div key={axis} style={{ marginBottom: 16 }}>
          <label>{axis.toUpperCase()}</label>
          <Slider
            min={-Math.PI}
            max={Math.PI}
            step={0.01}
            value={plateSettings[plateType].rotation[i]}
            onChange={(value) =>
              updatePlateSettings(plateType, "rotation", i, value)
            }
            tooltip={{ formatter: (value) => value?.toFixed(2) }}
          />
          <InputNumber
            min={-Math.PI}
            max={Math.PI}
            step={0.01}
            value={plateSettings[plateType].rotation[i]}
            onChange={(value) =>
              updatePlateSettings(plateType, "rotation", i, value)
            }
            style={{ width: "100%", marginTop: 8 }}
          />
        </div>
      ))}

      <h4 style={{ marginTop: 24 }}>Scale</h4>
      {["x", "y", "z"].map((axis, i) => (
        <div key={axis} style={{ marginBottom: 16 }}>
          <label>{axis.toUpperCase()}</label>
          <Slider
            min={0.1}
            max={2}
            step={0.01}
            value={plateSettings[plateType].scale[i]}
            onChange={(value) =>
              updatePlateSettings(plateType, "scale", i, value)
            }
            tooltip={{ formatter: (value) => value?.toFixed(2) }}
          />
          <InputNumber
            min={0.1}
            max={2}
            step={0.01}
            value={plateSettings[plateType].scale[i]}
            onChange={(value) =>
              updatePlateSettings(plateType, "scale", i, value)
            }
            style={{ width: "100%", marginTop: 8 }}
          />
        </div>
      ))}
    </div>
  );

  const renderMaterialControls = () => (
    <Collapse style={{ marginTop: "20px" }} defaultActiveKey={["1"]}>
      <Panel header="Material Settings" key="1">
        <div style={{ padding: 16 }}>
          <Select
            style={{ width: "100%", marginBottom: 16 }}
            placeholder="Select a material to edit"
            onChange={handleMaterialSelect}
            value={selectedMaterial}
          >
            {materials.map((material) => (
              <Option key={material.uuid} value={material.uuid}>
                {material.name}
              </Option>
            ))}
          </Select>

          {selectedMaterial && (
            <div>
              <h4>Selected Material: {modelColor}</h4>
              <h4>Color</h4>
              <input
                type="color"
                value={getColorValue(selectedMaterial)}
                onChange={(e) =>
                  updateMaterialProperty(
                    selectedMaterial,
                    "color",
                    new THREE.Color(e.target.value)
                  )
                }
                style={{ width: "100%", marginBottom: 16 }}
              />

              <h4>Metalness</h4>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={
                  materialSettings[selectedMaterial]?.metalness ??
                  materials.find((m) => m.uuid === selectedMaterial)
                    ?.metalness ??
                  0
                }
                onChange={(value) =>
                  updateMaterialProperty(selectedMaterial, "metalness", value)
                }
                tooltip={{ formatter: (value) => value?.toFixed(2) }}
              />
              <InputNumber
                min={0}
                max={1}
                step={0.01}
                value={
                  materialSettings[selectedMaterial]?.metalness ??
                  materials.find((m) => m.uuid === selectedMaterial)
                    ?.metalness ??
                  0
                }
                onChange={(value) =>
                  updateMaterialProperty(selectedMaterial, "metalness", value)
                }
                style={{ width: "100%", marginTop: 8 }}
              />

              <h4>Roughness</h4>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={
                  materialSettings[selectedMaterial]?.roughness ??
                  materials.find((m) => m.uuid === selectedMaterial)
                    ?.roughness ??
                  0.5
                }
                onChange={(value) =>
                  updateMaterialProperty(selectedMaterial, "roughness", value)
                }
                tooltip={{ formatter: (value) => value?.toFixed(2) }}
              />
              <InputNumber
                min={0}
                max={1}
                step={0.01}
                value={
                  materialSettings[selectedMaterial]?.roughness ??
                  materials.find((m) => m.uuid === selectedMaterial)
                    ?.roughness ??
                  0.5
                }
                onChange={(value) =>
                  updateMaterialProperty(selectedMaterial, "roughness", value)
                }
                style={{ width: "100%", marginTop: 8 }}
              />
            </div>
          )}
        </div>
      </Panel>
    </Collapse>
  );

  return (
    <Drawer
      title={`${isUpdate ? "Edit" : "Add"} Model`}
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
        <Row gutter={[16, 16]}>
          <Col span={10}>
            <Form.Item
              name="name"
              label="Car Name"
              rules={[{ required: true, message: "Please enter the car name" }]}
            >
              <Input placeholder="Enter car name" />
            </Form.Item>

            <Form.Item
              name="category"
              label="Category"
              rules={[{ required: true, message: "Please select a category" }]}
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

            <Form.Item
              name="file"
              label="Upload 3D Model"
              rules={[
                { required: !isUpdate, message: "Please upload a 3D model" },
              ]}
            >
              <Dragger {...carUploadProps} style={{ marginBottom: 16 }}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">Upload Car Model (.glb)</p>
              </Dragger>
            </Form.Item>

            <Form.Item label="Show License Plates">
              <Switch
                checked={showPlates}
                onChange={(checked) => setShowPlates(checked)}
              />
            </Form.Item>

            {showPlates && (
              <Collapse defaultActiveKey={["1"]}>
                <Panel header="Number Plate Settings" key="1">
                  <Tabs
                    style={{ marginTop: 10 }}
                    activeKey={activePlateTab}
                    onChange={setActivePlateTab}
                  >
                    <Tabs.TabPane tab="Front Plate" key="front">
                      {renderPlateSettings("front")}
                    </Tabs.TabPane>
                    <Tabs.TabPane tab="Back Plate" key="back">
                      {renderPlateSettings("back")}
                    </Tabs.TabPane>
                  </Tabs>
                </Panel>
              </Collapse>
            )}

            <Collapse style={{ marginTop: "20px" }} defaultActiveKey={["1"]}>
              <Panel header="Model Size" key="1">
                <div style={{ padding: 16 }}>
                  <Slider
                    min={0.1}
                    max={3}
                    step={0.01}
                    value={modelScale}
                    onChange={setModelScale}
                    tooltip={{ formatter: (value) => value?.toFixed(2) }}
                  />
                  <InputNumber
                    min={0.1}
                    max={3}
                    step={0.01}
                    value={modelScale}
                    onChange={setModelScale}
                    style={{ width: "100%", marginTop: 8 }}
                  />
                </div>
              </Panel>
            </Collapse>

            {materials.length > 0 && renderMaterialControls()}
          </Col>

          <Col span={14}>
            <Canvas
              style={{
                position: "sticky",
                top: 0,
                width: "100%",
                height: "500px",
                border: "1px solid #d9d9d9",
                background: "#f0f0f0",
              }}
            >
              <ambientLight intensity={0.5} />
              <directionalLight position={[2, 2, 2]} intensity={1} />
              <directionalLight position={[-2, 2, -2]} intensity={0.5} />
              <OrbitControls />

              {carFileUrl && (
                <ModelViewer
                  fileUrl={carFileUrl}
                  position={[0, 0, 0]}
                  rotation={[0, 0, 0]}
                  scale={[modelScale, modelScale, modelScale]}
                  materialSettings={materialSettings}
                  onMaterialsLoaded={setMaterials}
                />
              )}

              {showPlates && (
                <>
                  <PlateViewer
                    fileUrl={frontPlateFileUrl}
                    position={plateSettings.front.position}
                    rotation={plateSettings.front.rotation}
                    scale={plateSettings.front.scale}
                  />
                  <PlateViewer
                    fileUrl={backPlateFileUrl}
                    position={plateSettings.back.position}
                    rotation={plateSettings.back.rotation}
                    scale={plateSettings.back.scale}
                  />
                  <axesHelper args={[5]} />
                </>
              )}
            </Canvas>
          </Col>
        </Row>
      </Form>
    </Drawer>
  );
};

export default ModelsModal;