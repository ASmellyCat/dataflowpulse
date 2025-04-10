import React, { useState } from 'react';
import { Layout, Menu, Typography } from 'antd';
import { DashboardOutlined, FileTextOutlined } from '@ant-design/icons';
import UploadTaskForm from './components/UploadTaskForm';
import TaskList from './components/TaskList';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TaskDetail from './components/TaskDetail';

const { Header, Content, Footer, Sider } = Layout;

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'upload' | 'list'>('upload');

  return (
    <BrowserRouter>
      <Layout style={{ minHeight: '100vh' }}>
      <Sider style={{ backgroundColor: '#111827' }}>
        <div className="logo">DataFlowPulse</div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['upload']}
          onClick={(e) => setCurrentView(e.key as 'upload' | 'list')}
        >
          <Menu.Item key="upload" icon={<DashboardOutlined />}>Dashboard</Menu.Item>
          <Menu.Item key="list" icon={<FileTextOutlined />}>Tasks</Menu.Item>

        </Menu>
      </Sider>
      <Layout>
        <Header style={{ background: '#1f2937', padding: '0 40px' }}>
        <Typography.Title level={3} style={{
          color: '#34d399',
          fontFamily: '"Bebas Neue", sans-serif',
          margin: 20,
        }}>
          DataFlowPulse Control Panel
        </Typography.Title>
        </Header>
        <Content style={{ margin: '16px' }}>
          <div style={{ padding: 24, background: '#fdfdfd', borderRadius: 12, minHeight: 360 }}>
            <Routes>
              <Route path="/" element={currentView === 'upload' ? <UploadTaskForm /> : <TaskList />} />
              <Route path="/task/:id" element={<TaskDetail />} />
            </Routes>
          </div>
        </Content>
        <Footer style={{ textAlign: 'center', background: '#111827', color: '#9ca3af' }}>
          DataFlowPulse ©2025
        </Footer>
      </Layout>
    </Layout>
    </BrowserRouter>
  );
};

export default App;