import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Tabs,
  Descriptions,
  Spin,
  Typography,
  Table,
} from 'antd';
import axios from 'axios';

const { TabPane } = Tabs;
const { Text, Title } = Typography;

interface TaskDetailDrawerProps {
  taskId: string | null;
  onClose: () => void;
  visible: boolean;
}

type CsvResult = {
  type: 'csv';
  data: Record<string, any>[];
};

type LogResult = {
  type: 'log';
  status_counts: Record<string, number>;
  ip_counts: Record<string, number>;
};

type JsonResult = {
  type: 'json';
  sessions: {
    user_id: string;
    action_count: number;
    actions: any[];
  }[];
};

type TaskResult = CsvResult | LogResult | JsonResult | null;

const TaskDetailDrawer: React.FC<TaskDetailDrawerProps> = ({ taskId, onClose, visible }) => {
  const [status, setStatus] = useState<string | null>(null);
  const [result, setResult] = useState<TaskResult>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (taskId) {
      setLoading(true);
      Promise.all([
        axios.get(`http://localhost:8000/task/${taskId}/status`),
        axios.get(`http://localhost:8000/task/${taskId}/result`),
      ])
        .then(([statusRes, resultRes]) => {
          setStatus(statusRes.data.status);
          setResult(resultRes.data.result);
        })
        .catch((err) => {
          console.error('Error loading task details', err);
        })
        .finally(() => setLoading(false));
    }
  }, [taskId]);

  const renderStructuredTab = () => {
    if (!result || !('type' in result)) {
      return <Text type="secondary">No structured result available.</Text>;
    }

    switch (result.type) {
      case 'csv':
        return (
          <Table
            size="small"
            dataSource={result.data}
            columns={
              result.data[0]
                ? Object.keys(result.data[0]).map((key) => ({
                    title: key,
                    dataIndex: key,
                    key,
                  }))
                : []
            }
            pagination={{ pageSize: 5 }}
            scroll={{ x: true }}
          />
        );

      case 'log':
        return (
          <Descriptions title="Log Aggregation" bordered size="small" column={1}>
            {Object.entries(result.status_counts).map(([code, count]) => (
              <Descriptions.Item key={`status-${code}`} label={`Status ${code}`}>
                {count}
              </Descriptions.Item>
            ))}
            {Object.entries(result.ip_counts).map(([ip, count]) => (
              <Descriptions.Item key={`ip-${ip}`} label={`IP ${ip}`}>
                {count}
              </Descriptions.Item>
            ))}
          </Descriptions>
        );

      case 'json':
        return (
          <div style={{ maxHeight: 400, overflowY: 'auto', fontFamily: 'monospace' }}>
            {result.sessions.map((session, idx) => (
              <div key={idx} style={{ marginBottom: 12 }}>
                <Text strong>User: {session.user_id}</Text>
                <pre
                  style={{
                    background: '#f6f8fa',
                    padding: 10,
                    borderRadius: 6,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {JSON.stringify(session, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        );

      default:
        return <Text type="secondary">Unsupported result type.</Text>;
    }
  };

  return (
    <Drawer
      title={<Title level={4} style={{ margin: 0 }}>Task Detail</Title>}
      placement="right"
      onClose={onClose}
      open={visible}
      width={560}
    >
      {loading ? (
        <Spin />
      ) : (
        <Tabs defaultActiveKey="summary">
          <TabPane tab="Summary" key="summary">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Task ID">{taskId}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Text
                  type={
                    status === 'success'
                      ? 'success'
                      : status === 'failed'
                      ? 'danger'
                      : 'warning'
                  }
                >
                  {status?.toUpperCase()}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Result Type">
                {result && 'type' in result ? result.type : 'N/A'}
              </Descriptions.Item>
            </Descriptions>
          </TabPane>

          <TabPane tab="Structured View" key="structured">
            {renderStructuredTab()}
          </TabPane>

          <TabPane tab="Raw JSON" key="raw">
            <pre
              style={{
                backgroundColor: '#f0f2f5',
                padding: 12,
                borderRadius: 8,
                overflowX: 'auto',
              }}
            >
              {JSON.stringify(result, null, 2)}
            </pre>
          </TabPane>
        </Tabs>
      )}
    </Drawer>
  );
};

export default TaskDetailDrawer;
