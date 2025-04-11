import React, { useEffect, useState } from 'react';
import { Drawer, Tabs, Descriptions, Spin, Typography, Table } from 'antd';
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

  const renderStructuredView = () => {
    if (!result || !result.type) {
      return <Text type="secondary">No structured data available.</Text>;
    }

    switch (result.type) {
      case 'csv': {
        const rows = result.summary;
        if (!Array.isArray(rows) || rows.length === 0) {
          return <Text type="secondary">No CSV summary data found.</Text>;
        }

        const columns = Object.keys(rows[0]).map((key) => ({
          title: key,
          dataIndex: key,
          key,
        }));

        return (
          <Table
            size="small"
            dataSource={rows}
            columns={columns}
            pagination={false}
            scroll={{ x: true }}
            rowKey={(_, idx) => `csv-${idx}`}
          />
        );
      }

      case 'log': {
        const statusData = Array.isArray(result.status_counts)
          ? result.status_counts
          : Object.entries(result.status_counts || {}).map(([status, count]) => ({ status, count }));

        const ipData = Array.isArray(result.ip_counts)
          ? result.ip_counts
          : Object.entries(result.ip_counts || {}).map(([ip, count]) => ({ ip, count }));

        return (
          <>
            <Typography.Title level={5}>Status Code Counts</Typography.Title>
            <Table
              size="small"
              dataSource={statusData}
              columns={[
                { title: 'Status', dataIndex: 'status', key: 'status' },
                { title: 'Count', dataIndex: 'count', key: 'count' },
              ]}
              pagination={false}
              rowKey={(_, idx) => `status-${idx}`}
              style={{ marginBottom: 16 }}
            />

            <Typography.Title level={5}>IP Address Counts</Typography.Title>
            <Table
              size="small"
              dataSource={ipData}
              columns={[
                { title: 'IP', dataIndex: 'ip', key: 'ip' },
                { title: 'Count', dataIndex: 'count', key: 'count' },
              ]}
              pagination={false}
              rowKey={(_, idx) => `ip-${idx}`}
            />
          </>
        );
      }

      case 'json': {
        const sessions = result.sessions || [];

        return (
          <Table
            size="small"
            dataSource={sessions}
            columns={[
              { title: 'User ID', dataIndex: 'user_id', key: 'user_id' },
              { title: 'Action Count', dataIndex: 'action_count', key: 'action_count' },
              {
                title: 'Actions',
                dataIndex: 'actions',
                key: 'actions',
                render: (actions: any[]) => Array.isArray(actions) ? actions.join(', ') : '-'
              }
            ]}
            pagination={{ pageSize: 5 }}
            rowKey={(_, idx) => `session-${idx}`}
          />
        );
      }

      default:
        return <Text type="secondary">Unsupported result type: {result.type}</Text>;
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
                <Text type={status === 'success' ? 'success' : status === 'failed' ? 'danger' : 'warning'}>
                  {status?.toUpperCase()}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Result Type">
                {result?.type || 'Unknown'}
              </Descriptions.Item>
            </Descriptions>
          </TabPane>

          <TabPane tab="Structured" key="structured">
            {renderStructuredView()}
          </TabPane>

          <TabPane tab="Raw JSON" key="json">
            <pre style={{
              backgroundColor: '#f0f2f5',
              padding: 12,
              borderRadius: 8,
              overflowX: 'auto'
            }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </TabPane>
        </Tabs>
      )}
    </Drawer>
  );
};

export default TaskDetailDrawer;
