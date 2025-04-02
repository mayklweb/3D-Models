"use client"

import { useState } from "react"
import { Layout, Menu, Button } from "antd"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Car, LayoutGrid, ChevronLeft, ChevronRight, ChevronLeftCircle } from "lucide-react"

  const { Header, Sider, Content } = Layout



export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()

  const menuItems = [
    {
      key: "/dashboard",
      icon: <LayoutDashboard size={16} />,
      label: <Link href="/dashboard">Dashboard</Link>,
    },
    {
      key: "/dashboard/models",
      icon: <Car size={16} />,
      label: <Link href="/dashboard/models">Models</Link>,
    },
    {
      key: "/dashboard/categories",
      icon: <LayoutGrid size={16} />,
      label: <Link href="/dashboard/categories">Categories</Link>,
    },
  ]

  // Find the selected key based on the current pathname
  const selectedKey =
    menuItems.find((item) => pathname === item.key || pathname.startsWith(`${item.key}/`))?.key || "/dashboard"

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider trigger={null} collapsible collapsed={collapsed} width={240}>
        <div
          className="demo-logo-vertical"
          style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <h1 style={{ color: "white", margin: 0, fontSize: collapsed ? 14 : 18 }}>
            {collapsed ? "CAR" : "Car Admin Panel"}
          </h1>
        </div>
        <Menu theme="dark" mode="inline" selectedKeys={[selectedKey]} items={menuItems} />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: "#fff" }}>
          <Button
            type="text"
            icon={collapsed ? <ChevronRight size={16} /> : <ChevronLeftCircle size={16} />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: "16px",
              width: 64,
              height: 64,
            }}
          />
          <span style={{ fontSize: 18, fontWeight: 500 }}>Car Inventory Admin Panel</span>
        </Header>
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            minHeight: 280,
            background: "#fff",
            borderRadius: 8,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

