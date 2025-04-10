import React, { useEffect, useState } from 'react';
import { Typography, Row, Col, Card } from 'antd';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import axios from 'axios';

const { Title } = Typography;

const pastelColors = ['#96B6C5', '#ADC4CE', '#EEE0C9', '#D9ACF5', '#A4C8A6', '#E0B0FF'];

const MetricsPanel: React.FC = () => {
  const [metrics, setMetrics] = useState<any>({});

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await axios.get('http://localhost:8000/metrics');
      setMetrics(res.data);
    } catch (err) {
      console.error('Failed to fetch metrics');
    }
  };

  const runtimeData = Object.entries(metrics.avg_runtime || {}).map(([type, time]) => ({
    type,
    time
  }));

  const typeCount = (metrics.recent_tasks || []).reduce((acc: any, task: any) => {
    acc[task.type] = (acc[task.type] || 0) + 1;
    return acc;
  }, {});

  const taskTypeData = Object.entries(typeCount).map(([type, count]) => ({
    type,
    count
  }));

  const hourlyData = metrics.hourly_task_counts || [];

  return (
    <div>
      <Title level={3} style={{ color: '#374151', fontFamily: 'Inter' }}>
        System Metrics Overview
      </Title>
      <Row gutter={16}>
        <Col span={12}>
          <Card title="📈 Average Runtime per Task Type (seconds)">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={runtimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis unit="s" />
                <Tooltip formatter={(value: any) => `${value} s`} />
                <Bar dataKey="time" fill="#96B6C5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="🎯 Success Rate (Last 24h)">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Success', value: metrics.success_tasks || 0 },
                    {
                      name: 'Failed/Other',
                      value: Math.max((metrics.total_tasks || 0) - (metrics.success_tasks || 0), 0)
                    }
                  ]}
                  cx="50%" cy="50%" outerRadius={100} label
                  dataKey="value"
                >
                  <Cell fill="#A4C8A6" />
                  <Cell fill="#EEE0C9" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="📊 Task Count by Type">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={taskTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="type" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#D9ACF5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col span={12}>
          <Card title="🧮 Task Throughput (Last 24h)">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={hourlyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <XAxis dataKey="hour" interval={6} />
                <YAxis />
                <Tooltip labelFormatter={(label) => `Hour: ${label}`} />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#ADC4CE" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default MetricsPanel;
