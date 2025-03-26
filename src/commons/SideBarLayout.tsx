import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Layout, Menu, Avatar, Dropdown } from "antd";
import {
  DashboardOutlined,
  MailOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons";

const { Header, Sider, Content } = Layout;

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // User Menu Dropdown
  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        Profile
      </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />}>
        Settings
      </Menu.Item>
      <Menu.Item
        onClick={() => {
          localStorage.clear();
          navigate("/auth/login");
        }}
        key="logout"
        icon={<LogoutOutlined />}
        danger
      >
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout className="min-h-screen">
      {/* Sidebar */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        className="bg-gray-900 fixed top-0 min-h-screen text-white shadow-lg"
      >
        <div className="h-16 flex items-center justify-center text-xl font-bold text-white">
          {!collapsed ? "AI SalesMail" : "AI"}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={(e) => navigate(e.key)}
        >
          <Menu.Item key="/dashboard" icon={<DashboardOutlined />}>
            Dashboard
          </Menu.Item>
          <Menu.Item key="/email-campaigns" icon={<MailOutlined />}>
            Email Campaigns
          </Menu.Item>
          {/* <Menu.Item key="/analytics" icon={<BarChartOutlined />}>
            Analytics
          </Menu.Item>
          <Menu.Item key="/settings" icon={<SettingOutlined />}>
            Settings
          </Menu.Item> */}
        </Menu>
      </Sider>

      <Layout>
        <Header className="bg-white shadow-md px-6 flex justify-end items-center">
          {/* Sidebar Toggle */}
          {/* <div className="cursor-pointer text-lg text-gray-700" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div> */}

          {/* User Profile Dropdown */}
          <Dropdown overlay={userMenu} placement="bottomRight" arrow>
            <Avatar
              size="large"
              className="cursor-pointer bg-white! text-blue-700! font-bold"
            >
              A
            </Avatar>
          </Dropdown>
        </Header>

        <Content className="p-6 bg-gray-100 min-h-screen">{children}</Content>
      </Layout>
    </Layout>
  );
}
