import React, { useEffect, useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
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
} from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import { useLoad, usePatchRequest, usePostRequest } from "../../../api/request";
import { carsPost, categoriesList, carsPatch } from "../../../api/urls";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";

const { Option } = Select;
const { Dragger } = Upload;
const { Panel } = Collapse;

const LicenseText = ({
  text,
  position,
  rotation,
  scale = [1, 1, 1], // Default scale to 1 if not provided
  size = 0.1, // Make this your primary size control
  color = "black",
  letterSpacing = 0.1,
}) => {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Text
        font="/fonts/FE-FONT.ttf"
        fontSize={size} // Use this as the main size control
        lineHeight={1}
        letterSpacing={letterSpacing}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {text}
      </Text>
    </group>
  );
};

const ModelViewer = ({
  fileUrl,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  materialSettings = {},
  onMaterialsLoaded,
  onModelLoaded,
}) => {
  const { scene } = useGLTF(fileUrl, true);
  const sceneRef = useRef();

  useEffect(() => {
    if (!scene) return;

    const clone = scene.clone();

    // Calculate bounding box to center the model
    const bbox = new THREE.Box3().setFromObject(clone);
    const center = new THREE.Vector3();
    bbox.getCenter(center);

    // Offset the model to center it on X and Z, and position at top (Y)
    // clone.position.x -= center.x;
    // clone.position.z -= center.z;

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

    if (onModelLoaded) {
      onModelLoaded({
        width: bbox.max.x - bbox.min.x,
        height: bbox.max.y - bbox.min.y,
        length: bbox.max.z - bbox.min.z,
        center: center,
      });
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

const PlateViewer = ({
  fileUrl,
  position,
  rotation,
  scale,
  plateType,
  plateSettings,
  plateText = { main: "777ZZZ", region: "00" },
}) => {
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

  return (
    <group>
      {sceneRef.current && <primitive object={sceneRef.current} />}
      {plateText && (
        <>
          <LicenseText
            text={plateText.main}
            position={plateSettings[plateType].textPosition.main}
            rotation={[0, 0, 0]}
            scale={plateSettings[plateType].textScale.main}
            size={plateSettings[plateType].textSize}
            letterSpacing={plateSettings[plateType].letterSpacing} // Now using single value
          />
          <LicenseText
            text={plateText.region}
            position={plateSettings[plateType].textPosition.region}
            rotation={[0, 0, 0]}
            scale={plateSettings[plateType].textScale.region}
            size={
              plateSettings[plateType].regionTextSize ||
              plateSettings[plateType].textSize * 0.8
            }
            letterSpacing={plateSettings[plateType].letterSpacing * 0.8} // You can still apply a multiplier if needed
          />
        </>
      )}
    </group>
  );
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
  showPlates,
  setShowPlates,
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
  const [carFileObject, setCarFileObject] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [materialSettings, setMaterialSettings] = useState({});
  const [modelScale, setModelScale] = useState(1);
  const [modelDimensions, setModelDimensions] = useState(null);
  const [plateText, setPlateText] = useState({
    front: { main: "777ZZZ", region: "01" },
    back: { main: "777ZZZ", region: "01" },
  });

  const [plateSettings, setPlateSettings] = useState({
    front: {
      position: [0, 0.3, 1.2],
      rotation: [0, 0, 0],
      scale: [0.8, 0.8, 0.8],
      textPosition: {
        main: [-0.02, 0.05, 0.02],
        region: [-0.03, 0.05, 0.02],
      },
      textScale: {
        main: [1, 1, 1], // Changed to [1, 1, 1] since we're using fontSize now
        region: [1, 1, 1], // Changed to [1, 1, 1]
      },
      textSize: 0.15, // Increased from 0.015
      regionTextSize: 0.12, // Increased from 0.012
      letterSpacing: 0.003, // Changed from object to single value
    },
    back: {
      position: [0, 0.3, -1.2],
      rotation: [0, Math.PI, 0],
      scale: [0.8, 0.8, 0.8],
      textPosition: {
        main: [0.02, 0.05, -0.02],
        region: [0.03, 0.05, -0.02],
      },
      textScale: {
        main: [1, 1, 1], // Changed to [1, 1, 1]
        region: [1, 1, 1], // Changed to [1, 1, 1]
      },
      textSize: 0.12, // Increased from 0.012
      regionTextSize: 0.1, // Increased from 0.01
      letterSpacing: 0.003, // Changed from object to single value
    },
  });

  const modelConfig = useMemo(
    () => ({
      colorMeshes: [modelColor],
      licensePlate: {
        front: { ...plateSettings.front },
        back: { ...plateSettings.back },
      },
      scale: modelScale,
    }),
    [modelColor, plateSettings, modelScale]
  );

  const availableColors = [
    { id: "nardo-grey", name: "Nardo Grey", hex: "#808080" },
    { id: "midnight-purple", name: "Midnight Purple", hex: "#2D1B4B" },
    { id: "frozen-black", name: "Frozen Black Metallic", hex: "#1B1B1B" },
    {
      id: "british-racing-green",
      name: "British Racing Green",
      hex: "#004225",
    },
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

  useEffect(() => {
    if (modelDimensions) {
      const length = modelDimensions.length;
      const height = modelDimensions.height;
      setPlateSettings((prev) => ({
        front: {
          ...prev.front,
          position: [0, height * 0.5 + 0.1, length * 0.5 + 0.2],
        },
        back: {
          ...prev.back,
          position: [0, height * 0.5 + 0.1, -length * 0.5 - 0.2],
        },
      }));
    }
  }, [modelDimensions]);

  useEffect(() => {
    if (isUpdate) {
      form.setFieldsValue({
        name: isUpdate.name,
        category: isUpdate.category,
      });

      setModelScale(isUpdate.modelConfig?.scale || 1);
      setPlateText(
        isUpdate.plateText || {
          front: { main: "777ZZZ", region: "01" },
          back: { main: "777ZZZ", region: "01" },
        }
      );

      setPlateSettings({
        front: {
          position: isUpdate.modelConfig?.licensePlate?.front?.position || [
            0, 0.3, 1.2,
          ],
          rotation: isUpdate.modelConfig?.licensePlate?.front?.rotation || [
            0, 0, 0,
          ],
          scale: isUpdate.modelConfig?.licensePlate?.front?.scale || [
            0.8, 0.8, 0.8,
          ],
          textPosition: isUpdate.modelConfig?.licensePlate?.front
            ?.textPosition || {
            main: [-0.02, 0.05, 0.02],
            region: [-0.03, 0.05, 0.02],
          },
          textScale: isUpdate.modelConfig?.licensePlate?.front?.textScale || {
            main: [0.8, 0.8, 0.8],
            region: [0.6, 0.6, 0.6],
          },
          textSize:
            isUpdate.modelConfig?.licensePlate?.front?.textSize || 0.015,
          regionTextSize:
            isUpdate.modelConfig?.licensePlate?.front?.regionTextSize || 0.012,
            letterSpacing: isUpdate.modelConfig?.licensePlate?.front?.letterSpacing?.main || 0.003
        },
        back: {
          position: isUpdate.modelConfig?.licensePlate?.back?.position || [
            0, 0.3, -1.2,
          ],
          rotation: isUpdate.modelConfig?.licensePlate?.back?.rotation || [
            0,
            Math.PI,
            0,
          ],
          scale: isUpdate.modelConfig?.licensePlate?.back?.scale || [
            0.8, 0.8, 0.8,
          ],
          textPosition: isUpdate.modelConfig?.licensePlate?.back
            ?.textPosition || {
            main: [0.02, 0.05, -0.02],
            region: [0.03, 0.05, -0.02],
          },
          textScale: isUpdate.modelConfig?.licensePlate?.back?.textScale || {
            main: [0.8, 0.8, 0.8],
            region: [0.6, 0.6, 0.6],
          },
          textSize: isUpdate.modelConfig?.licensePlate?.back?.textSize || 0.012,
          regionTextSize:
            isUpdate.modelConfig?.licensePlate?.back?.regionTextSize || 0.01,
            letterSpacing: isUpdate.modelConfig?.licensePlate?.back?.letterSpacing?.main || 0.003,
        },
      });

      if (isUpdate.modelUrl) {
        setCarFileUrl(isUpdate.modelUrl);
        setShowPlates(true);
      }
    } else {
      form.resetFields();
      setModelScale(1);
      setPlateText({
        front: { main: "777ZZZ", region: "01" },
        back: { main: "777ZZZ", region: "01" },
      });
      setPlateSettings({
        front: {
          position: [0, 0.3, 1.2],
          rotation: [0, 0, 0],
          scale: [0.8, 0.8, 0.8],
          textPosition: {
            main: [-0.02, 0.05, 0.02],
            region: [-0.03, 0.05, 0.02],
          },
          textScale: {
            main: [0.8, 0.8, 0.8],
            region: [0.6, 0.6, 0.6],
          },
          textSize: 0.015,
          regionTextSize: 0.012,
          letterSpacing: {
            main: 0.003,
            region: 0.002,
          },
        },
        back: {
          position: [0, 0.3, -1.2],
          rotation: [0, Math.PI, 0],
          scale: [0.8, 0.8, 0.8],
          textPosition: {
            main: [0.02, 0.05, -0.02],
            region: [0.03, 0.05, -0.02],
          },
          textScale: {
            main: [0.8, 0.8, 0.8],
            region: [0.6, 0.6, 0.6],
          },
          textSize: 0.012,
          regionTextSize: 0.01,
          letterSpacing: {
            main: 0.003,
            region: 0.002,
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
    setPlateText({
      front: { main: "777ZZZ", region: "01" },
      back: { main: "777ZZZ", region: "01" },
    });
    setPlateSettings({
      front: {
        position: [0, 0.3, 1.2],
        rotation: [0, 0, 0],
        scale: [0.8, 0.8, 0.8],
        textPosition: {
          main: [-0.02, 0.05, 0.02],
          region: [-0.03, 0.05, 0.02],
        },
        textScale: {
          main: [0.8, 0.8, 0.8],
          region: [0.6, 0.6, 0.6],
        },
        textSize: 0.015,
        regionTextSize: 0.012,
        letterSpacing: {
          main: 0.003,
          region: 0.002,
        },
      },
      back: {
        position: [0, 0.3, -1.2],
        rotation: [0, Math.PI, 0],
        scale: [0.8, 0.8, 0.8],
        textPosition: {
          main: [0.02, 0.05, -0.02],
          region: [0.03, 0.05, -0.02],
        },
        textScale: {
          main: [0.8, 0.8, 0.8],
          region: [0.6, 0.6, 0.6],
        },
        textSize: 0.012,
        regionTextSize: 0.01,
        letterSpacing: {
          main: 0.003,
          region: 0.002,
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
    formData.append("plateText", JSON.stringify(plateText));
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

  const renderTextSettings = (plateType) => (
    <div style={{ padding: 16 }}>
      <h4>Text Content</h4>
      <Row gutter={16}>
        <Col span={12}>
          <h5>Main Text</h5>
          <Input
            value={plateText[plateType].main}
            onChange={(e) =>
              setPlateText((prev) => ({
                ...prev,
                [plateType]: { ...prev[plateType], main: e.target.value },
              }))
            }
            style={{ marginBottom: 16 }}
          />
        </Col>
        <Col span={12}>
          <h5>Region Text</h5>
          <Input
            value={plateText[plateType].region}
            onChange={(e) =>
              setPlateText((prev) => ({
                ...prev,
                [plateType]: { ...prev[plateType], region: e.target.value },
              }))
            }
            style={{ marginBottom: 16 }}
          />
        </Col>
      </Row>

      <h4>Text Size</h4>
      <Row gutter={16}>
        <Col span={12}>
          <h5>Main Text Size</h5>
          <Slider
            min={-1}
            max={1}
            step={0.001}
            value={plateSettings[plateType].textSize}
            onChange={(value) =>
              setPlateSettings((prev) => ({
                ...prev,
                [plateType]: {
                  ...prev[plateType],
                  textSize: value,
                },
              }))
            }
            tooltip={{ formatter: (value) => value?.toFixed(3) }}
          />
          <InputNumber
            min={-1}
            max={1}
            step={0.001}
            value={plateSettings[plateType].textSize}
            onChange={(value) =>
              setPlateSettings((prev) => ({
                ...prev,
                [plateType]: {
                  ...prev[plateType],
                  textSize: value,
                },
              }))
            }
            style={{ width: "100%", marginTop: 8 }}
          />
        </Col>
        <Col span={12}>
          <h5>Region Text Size</h5>
          <Slider
            min={-1}
            max={1}
            step={0.001}
            value={
              plateSettings[plateType].regionTextSize ||
              plateSettings[plateType].textSize * 0.8
            }
            onChange={(value) =>
              setPlateSettings((prev) => ({
                ...prev,
                [plateType]: {
                  ...prev[plateType],
                  regionTextSize: value,
                },
              }))
            }
            tooltip={{ formatter: (value) => value?.toFixed(3) }}
          />
          <InputNumber
            min={0.005}
            max={5}
            step={0.001}
            value={
              plateSettings[plateType].regionTextSize ||
              plateSettings[plateType].textSize * 0.8
            }
            onChange={(value) =>
              setPlateSettings((prev) => ({
                ...prev,
                [plateType]: {
                  ...prev[plateType],
                  regionTextSize: value,
                },
              }))
            }
            style={{ width: "100%", marginTop: 8 }}
          />
        </Col>
      </Row>

      <h4>Text Positioning</h4>
      <Tabs>
        <Tabs.TabPane tab="Main Text" key="main">
          {["x", "y", "z"].map((axis, i) => (
            <div key={axis} style={{ marginBottom: 16 }}>
              <label>{axis.toUpperCase()} Position</label>
              <Slider
                min={-5}
                max={5}
                step={0.001}
                value={plateSettings[plateType].textPosition.main[i]}
                onChange={(value) => {
                  const newPosition = [
                    ...plateSettings[plateType].textPosition.main,
                  ];
                  newPosition[i] = value;
                  setPlateSettings((prev) => ({
                    ...prev,
                    [plateType]: {
                      ...prev[plateType],
                      textPosition: {
                        ...prev[plateType].textPosition,
                        main: newPosition,
                      },
                    },
                  }));
                }}
                tooltip={{ formatter: (value) => value?.toFixed(3) }}
              />
              <InputNumber
                min={-5}
                max={5}
                step={0.001}
                value={plateSettings[plateType].textPosition.main[i]}
                onChange={(value) => {
                  const newPosition = [
                    ...plateSettings[plateType].textPosition.main,
                  ];
                  newPosition[i] = value;
                  setPlateSettings((prev) => ({
                    ...prev,
                    [plateType]: {
                      ...prev[plateType],
                      textPosition: {
                        ...prev[plateType].textPosition,
                        main: newPosition,
                      },
                    },
                  }));
                }}
                style={{ width: "100%", marginTop: 8 }}
              />
            </div>
          ))}
        </Tabs.TabPane>
        <Tabs.TabPane tab="Region Text" key="region">
          {["x", "y", "z"].map((axis, i) => (
            <div key={axis} style={{ marginBottom: 16 }}>
              <label>{axis.toUpperCase()} Position</label>
              <Slider
                min={-5}
                max={5}
                step={0.001}
                value={plateSettings[plateType].textPosition.region[i]}
                onChange={(value) => {
                  const newPosition = [
                    ...plateSettings[plateType].textPosition.region,
                  ];
                  newPosition[i] = value;
                  setPlateSettings((prev) => ({
                    ...prev,
                    [plateType]: {
                      ...prev[plateType],
                      textPosition: {
                        ...prev[plateType].textPosition,
                        region: newPosition,
                      },
                    },
                  }));
                }}
                tooltip={{ formatter: (value) => value?.toFixed(3) }}
              />
              <InputNumber
                min={-5}
                max={5}
                step={0.001}
                value={plateSettings[plateType].textPosition.region[i]}
                onChange={(value) => {
                  const newPosition = [
                    ...plateSettings[plateType].textPosition.region,
                  ];
                  newPosition[i] = value;
                  setPlateSettings((prev) => ({
                    ...prev,
                    [plateType]: {
                      ...prev[plateType],
                      textPosition: {
                        ...prev[plateType].textPosition,
                        region: newPosition,
                      },
                    },
                  }));
                }}
                style={{ width: "100%", marginTop: 8 }}
              />
            </div>
          ))}
        </Tabs.TabPane>
      </Tabs>

      <h4>Text Spacing</h4>
      <div style={{ marginBottom: 16 }}>
        <label>Letter Spacing (affects both texts)</label>
        <Slider
          min={-0.02}
          max={0.02}
          step={0.001}
          value={plateSettings[plateType].letterSpacing}
          onChange={(value) => {
            setPlateSettings((prev) => ({
              ...prev,
              [plateType]: {
                ...prev[plateType],
                letterSpacing: value,
              },
            }));
          }}
          tooltip={{ formatter: (value) => value?.toFixed(3) }}
        />
        <InputNumber
          min={-0.02}
          max={0.02}
          step={0.001}
          value={plateSettings[plateType].letterSpacing}
          onChange={(value) => {
            setPlateSettings((prev) => ({
              ...prev,
              [plateType]: {
                ...prev[plateType],
                letterSpacing: value,
              },
            }));
          }}
          style={{ width: "100%", marginTop: 8 }}
        />
      </div>
    </div>
  );

  const renderPlateSettings = (plateType) => (
    <Tabs>
      <Tabs.TabPane tab="Plate Position" key="position">
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
          <div style={{ marginBottom: 16 }}>
            <label>Uniform Scale</label>
            <Slider
              min={0.1}
              max={2}
              step={0.01}
              value={plateSettings[plateType].scale[0]}
              onChange={(value) => {
                updatePlateSettings(plateType, "scale", 0, value);
                updatePlateSettings(plateType, "scale", 1, value);
                updatePlateSettings(plateType, "scale", 2, value);
              }}
              tooltip={{ formatter: (value) => value?.toFixed(2) }}
            />
            <InputNumber
              min={0.1}
              max={2}
              step={0.01}
              value={plateSettings[plateType].scale[0]}
              onChange={(value) => {
                updatePlateSettings(plateType, "scale", 0, value);
                updatePlateSettings(plateType, "scale", 1, value);
                updatePlateSettings(plateType, "scale", 2, value);
              }}
              style={{ width: "100%", marginTop: 8 }}
            />
          </div>
        </div>
      </Tabs.TabPane>
      <Tabs.TabPane tab="Text Settings" key="text">
        {renderTextSettings(plateType)}
      </Tabs.TabPane>
    </Tabs>
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

            {showPlates && (
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
            )}

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
                  onModelLoaded={setModelDimensions}
                />
              )}

              {showPlates && (
                <>
                  <PlateViewer
                    fileUrl={frontPlateFileUrl}
                    position={plateSettings.front.position}
                    rotation={plateSettings.front.rotation}
                    scale={plateSettings.front.scale}
                    plateType="front"
                    plateSettings={plateSettings}
                    plateText={plateText.front}
                  />
                  <PlateViewer
                    fileUrl={backPlateFileUrl}
                    position={plateSettings.back.position}
                    rotation={plateSettings.back.rotation}
                    scale={plateSettings.back.scale}
                    plateType="back"
                    plateSettings={plateSettings}
                    plateText={plateText.back}
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
