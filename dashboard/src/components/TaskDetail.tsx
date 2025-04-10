import React, { useEffect, useState } from 'react';
import { Card, Typography, Descriptions, Spin, message } from 'antd';
import axios from 'axios';
import { useParams } from 'react-router-dom';

const { Title } = Typography;

const TaskDetail: React.FC = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, resultRes] = await Promise.all([
          axios.get(`http://localhost:8000/task/${id}/status`),
          axios.get(`http://localhost:8000/task/${id}/result`)
        ]);
        setStatus(statusRes.data.status);
        setResult(resultRes.data.result);
      } catch (err) {
        message.error("Failed to load task details");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <Spin />;

  return (
    <div>
      <Title level={4} style={{ color: '#3b82f6' }}>Task Detail</Title>
      <Card bordered style={{ marginBottom: 24, borderRadius: 10 }}>
        <Descriptions title="Metadata" bordered column={1} size="small">
          <Descriptions.Item label="Task ID">{id}</Descriptions.Item>
          <Descriptions.Item label="Status">
            <span style={{ color: status === 'success' ? 'green' : status === 'failed' ? 'red' : 'orange' }}>
              {status?.toUpperCase()}
            </span>
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {result && (
        <Card title="Analysis Result" bordered style={{ borderRadius: 10 }}>
          <pre style={{ whiteSpace: 'pre-wrap' }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
};

export default TaskDetail;
