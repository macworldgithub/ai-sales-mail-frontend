import { useState, type ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Button, Drawer, Grid } from 'antd';
import { DashboardOutlined, MailOutlined, LogoutOutlined, MenuOutlined } from '@ant-design/icons';
import { TOKEN_KEY } from '../config';
const { Header, Sider, Content } = Layout;
export default function SidebarLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const screens = Grid.useBreakpoint();
  const mobile = !screens.lg;
  const navigate = useNavigate();
  const location = useLocation();
  const navigation = <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} onClick={({ key }) => { navigate(key); setDrawerOpen(false); }} items={[
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/email-campaigns', icon: <MailOutlined />, label: 'Email campaigns' },
  ]} />;
  return <Layout className="app-shell">
    {!mobile && <Sider width={236} collapsible collapsed={collapsed} onCollapse={setCollapsed}>
      <div className="brand">{collapsed ? 'AI' : 'AI SalesMail'}</div>{navigation}
    </Sider>}
    <Drawer title="AI SalesMail" placement="left" open={mobile && drawerOpen} onClose={() => setDrawerOpen(false)} width={280} styles={{ body: { padding: 0, background: '#001529' } }}>{navigation}</Drawer>
    <Layout className="app-main">
      <Header className="app-header">
        <div className="header-title">{mobile && <Button aria-label="Open navigation" icon={<MenuOutlined />} onClick={() => setDrawerOpen(true)} />}<span>Sales workspace</span></div>
        <Dropdown menu={{ items: [{ key: 'logout', icon: <LogoutOutlined />, label: 'Log out', onClick: () => { localStorage.removeItem(TOKEN_KEY); navigate('/auth/login', { replace: true }); } }] }} trigger={['click']} placement="bottomRight">
          <Button type="text" aria-label="Account menu"><Avatar size={32} style={{ background: '#2563eb' }}>A</Avatar></Button>
        </Dropdown>
      </Header>
      <Content className="page-content"><div className="page-container">{children}</div></Content>
    </Layout>
  </Layout>;
}
