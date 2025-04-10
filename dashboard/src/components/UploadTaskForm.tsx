import React, { useState } from 'react';
import { Upload, Button, message, Typography } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import axios from 'axios';

const { Title } = Typography;

const UploadTaskForm: React.FC = () => {
  const [taskId, setTaskId] = useState<string | null>(null);

  const props: UploadProps = {
    name: 'file',
    accept: '.csv,.log,.json',
    maxCount: 1,
    customRequest: async ({ file, onSuccess, onError }) => {
      const formData = new FormData();
      formData.append('file', file as Blob);

      try {
        const res = await axios.post('http://127.0.0.1:8000/task/submit', formData);
        setTaskId(res.data.task_id);
        message.success('Task submitted!');
        onSuccess?.(res.data, new XMLHttpRequest());
      } catch (err) {
        message.error('Upload failed');
        onError?.(err as any);
      }
    },
  };

  return (
    <div style={{ textAlign: 'center' }}>
      <Title
        level={4}
        style={{
          color: '#10b981',
          fontFamily: 'Inter, sans-serif',
          marginBottom: 24,
        }}
      >
        Submit a New Task
      </Title>

      <Upload {...props}>
        <Button
          icon={<UploadOutlined />}
          type="primary"
          style={{
            background: '#ec4899',
            borderColor: '#ec4899',
            borderRadius: 12,
            fontFamily: 'Inter, sans-serif',
            fontWeight: 'bold',
            fontSize: '16px',
            padding: '6px 18px',
          }}
        >
          Upload File (.csv / .log / .json)
        </Button>
      </Upload>

      {taskId && (
        <div style={{ marginTop: 20 }}>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              color: '#374151',
            }}
          >
            🎉 <strong>Task ID:</strong> {taskId}
          </p>
          <Button
            size="small"
            onClick={() => {
              navigator.clipboard.writeText(taskId);
              message.success('Copied!');
            }}
            style={{
              fontSize: '12px',
              fontFamily: 'Inter',
              background: '#10b981',
              color: 'white',
              borderRadius: 8,
              marginTop: 4,
            }}
          >
            Copy
          </Button>
        </div>
      )}
    </div>
  );
};

export default UploadTaskForm;
