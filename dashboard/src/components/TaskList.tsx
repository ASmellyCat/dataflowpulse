import React, { useEffect, useState } from 'react';
import { Table, Tag, Typography, Spin } from 'antd';
import axios from 'axios';
import TaskDetailDrawer from './TaskDetailDrawer';

const { Title } = Typography;

interface TaskItem {
  task_id: string;
  status: string;
}

const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<string | null>(null); 

  useEffect(() => {
    const interval = setInterval(() => {
      fetchTasks();
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/metrics');
      console.log('Fetched metrics:', res.data);
      setTasks(res.data.recent_tasks || []);
      setLoading(false);
    } catch (e) {
      console.error('Failed to fetch tasks');
    }
  };

  const columns = [
    {
      title: 'Task ID',
      dataIndex: 'task_id',
      key: 'task_id',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = status === 'success' ? 'green' : status === 'failed' ? 'red' : 'orange';
        return <Tag color={color}>{status.toUpperCase()}</Tag>;
      },
    },
  ];

  return (
    <div>
      <Title level={4} style={{ color: '#10b981' }}>Task List</Title>
      {loading ? (
        <Spin />
      ) : (
        <Table
          dataSource={tasks}
          columns={columns}
          rowKey="task_id"
          onRow={(record) => ({
            onClick: () => setSelectedTask(record.task_id), 
          })}
        />
      )}


      <TaskDetailDrawer
        taskId={selectedTask}
        visible={!!selectedTask}
        onClose={() => setSelectedTask(null)}
      />
    </div>
  );
};

export default TaskList;
