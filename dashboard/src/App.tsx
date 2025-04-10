import React, { useState } from 'react';
import { Layout, Menu, Typography } from 'antd';
import { DashboardOutlined, FileTextOutlined, BarChartOutlined } from '@ant-design/icons';
import UploadTaskForm from './components/UploadTaskForm';
import TaskList from './components/TaskList';
import MetricsPanel from './components/MetricsPanel';

const { Header, Content, Footer, Sider } = Layout;

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'upload' | 'list' | 'metrics'>('upload');

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider style={{ backgroundColor: '#111827' }}>
        <div className="logo">DataFlowPulse</div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['upload']}
          onClick={(e) => setCurrentView(e.key as any)}
        >
          <Menu.Item key="upload" icon={<DashboardOutlined />}>Dashboard</Menu.Item>
          <Menu.Item key="list" icon={<FileTextOutlined />}>Tasks</Menu.Item>
          <Menu.Item key="metrics" icon={<BarChartOutlined />}>Metrics Panel</Menu.Item>
        </Menu>
      </Sider>
      <Layout>
        <Header style={{ background: '#1f2937', padding: '0 40px' }}>
          <Typography.Title level={3} style={{ color: '#34d399', fontFamily: 'Bebas Neue', margin: 20 }}>
            DataFlowPulse Control Panel
          </Typography.Title>
        </Header>
        <Content style={{ margin: '16px' }}>
          <div style={{ padding: 24, background: '#fdfdfd', borderRadius: 12, minHeight: 360 }}>
            {currentView === 'upload' && <UploadTaskForm />}
            {currentView === 'list' && <TaskList />}
            {currentView === 'metrics' && <MetricsPanel />}
          </div>
        </Content>
        <Footer style={{ textAlign: 'center', background: '#111827', color: '#9ca3af' }}>
          DataFlowPulse ©2025
        </Footer>
      </Layout>
    </Layout>
  );
};

export default App;
