"use client"

import { useEffect, useRef, useState } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, useGLTF } from "@react-three/drei"
import { Spin, Button, Typography, Space } from "antd"
import { LoadingOutlined } from "@ant-design/icons"

const { Text } = Typography


function Model({ modelPath }) {
  const { scene } = useGLTF(modelPath)
  return <primitive object={scene} />
}

export default function ModelPreview({ modelPath = "/assets/3d/duck.glb" }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const timerRef = useRef()

  useEffect(() => {
    // Simulate loading time
    timerRef.current = setTimeout(() => {
      setLoading(false)
    }, 2000)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  if (loading) {
    return (
      <div className="flex h-[300px] items-center justify-center border border-dashed" style={{ borderRadius: 8 }}>
        <Space direction="vertical" align="center">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
          <Text type="secondary">Loading 3D model...</Text>
        </Space>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-[300px] items-center justify-center border border-dashed" style={{ borderRadius: 8 }}>
        <Space direction="vertical" align="center">
          <Text type="danger">{error}</Text>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </Space>
      </div>
    )
  }

  return (
    <div className="h-[300px] border" style={{ borderRadius: 8 }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        <Model modelPath={modelPath} />
        <OrbitControls />
      </Canvas>
    </div>
  )
}

