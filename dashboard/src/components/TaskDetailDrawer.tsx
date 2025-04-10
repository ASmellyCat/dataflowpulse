import React, { useEffect, useState } from 'react';
import { Drawer, Tabs, Descriptions, Spin, Typography } from 'antd';
import axios from 'axios';

const { TabPane } = Tabs;
const { Text, Title } = Typography;

interface TaskDetailDrawerProps {
  taskId: string | null;
  onClose: () => void;
  visible: boolean;
}

const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({ taskId, onClose, visible }) => {
  const [status, setStatus] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (taskId) {
      setLoading(true);
      Promise.all([
        axios.get(`http://localhost:8000/task/${taskId}/status`),
        axios.get(`http://localhost:8000/task/${taskId}/result`)
      ])
        .then(([statusRes, resultRes]) => {
          setStatus(statusRes.data.status);
          setResult(resultRes.data.result);
        })
        .catch(err => {
          console.error('Error loading task details', err);
        })
        .finally(() => setLoading(false));
    }
  }, [taskId]);

  return (
    <Drawer
      title={<Title level={4} style={{ margin: 0 }}>Task Detail</Title>}
      placement="right"
      onClose={onClose}
      open={visible}
      width={500}
    >
      {loading ? (
        <Spin />
      ) : (
        <Tabs defaultActiveKey="summary">
          <TabPane tab="Summary" key="summary">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Task ID">{taskId}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Text type={status === 'success' ? 'success' : status === 'failed' ? 'danger' : 'warning'}>
                  {status?.toUpperCase()}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Result Type">{typeof result}</Descriptions.Item>
            </Descriptions>
          </TabPane>
          <TabPane tab="Raw JSON" key="json">
            <pre style={{ backgroundColor: '#f0f2f5', padding: 12, borderRadius: 8, overflowX: 'auto' }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </TabPane>
        </Tabs>
      )}
    </Drawer>
  );
};

export default TaskDetailDrawer;
