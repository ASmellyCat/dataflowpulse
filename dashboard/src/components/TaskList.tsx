import React, { useEffect, useState } from 'react';
import { Table, Tag, Typography, Spin } from 'antd';
import TaskDetailDrawer from './TaskDetailDrawer';
import { useTaskStore } from '../../store/taskStore'; // 根据你的路径修改

const { Title } = Typography;

const TaskList: React.FC = () => {
  const { tasks, startPolling, fetchTasks } = useTaskStore();
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks().finally(() => setLoading(false));
    startPolling();
  }, [fetchTasks, startPolling]);

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
