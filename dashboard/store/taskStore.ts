import { create } from 'zustand';
import axios from 'axios';

type Task = {
  task_id: string;
  status: string;
  type: string;
};

type TaskStore = {
  tasks: Task[];
  fetchTasks: () => Promise<void>;
  startPolling: () => void;
};

export const useTaskStore = create<TaskStore>((set, get) => {
  let interval: NodeJS.Timeout | null = null;

  return {
    tasks: [],
    fetchTasks: async () => {
      try {
        const res = await axios.get('http://localhost:8000/metrics');
        set({ tasks: res.data.recent_tasks || [] });
      } catch (e) {
        console.error('Failed to fetch tasks', e);
      }
    },
    startPolling: () => {
      if (interval) return;
      interval = setInterval(() => {
        get().fetchTasks();
      }, 3000);
    }
  };
});
