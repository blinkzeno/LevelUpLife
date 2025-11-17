import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { tables, ID, config } from '@/appwriter.config';
import { Query } from 'appwrite';
import AsyncStorage from '@react-native-async-storage/async-storage';

type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  $id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  clerkUserId?: string; // Lier la tâche à l'utilisateur Clerk
}

interface TasksState {
  tasks: Task[];
  totalTasks: number;
  addTask: (newTask,  clerkUserId: string) => void;
  updateTask: (id: string, updates: Partial<Task>, clerkUserId: string) => void;
  deleteTask: (id: string, clerkUserId: string) => void;
  moveTask: (id: string, newStatus: TaskStatus, clerkUserId: string) => void;
  // syncTasksWithRemote: (clerkUserId: string) => Promise<void>;
  saveTaskToRemote: (task: Task, clerkUserId: string) => Promise<void>;
  loadTasksFromRemote: (clerkUserId: string) => void;
  updateTaskRemote: (id: string, updates: Partial<Task>) => void;
  clearTasks: () => void;
}

export const useTasksStore = create<TasksState>()(
  persist(
    (set, get) => ({
      tasks: [],
      get totalTasks() {
        return get().tasks.length;
      },
      addTask: (newTask, clerkUserId) => {
        const task = {
          $id: ID.unique(),
          ...newTask,
          clerkUserId,
        };
        set((state: { tasks: any; }) => ({
          tasks: [...state.tasks, task],
        }));
        get().saveTaskToRemote(task, clerkUserId);
      },
      updateTask: (id, updates, clerkUserId) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.$id === id ? { ...t, ...updates } : t
          ),
        }));
        const updatedTask = get().tasks.find((t) => t.$id === id);
        console.log('Updated Task:', updatedTask);
        
        if (updatedTask) {
          get().updateTaskRemote(id, { ...updatedTask });
         
        }
      },
      deleteTask: async (id, clerkUserId) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.$id !== id),
        }));

        // Supprimer aussi sur AppWrite (à implémenter)
      },
      moveTask: (id, newStatus) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.$id === id ? { ...t, status: newStatus } : t
          ),
        }));
        const updatedTask = get().tasks.find((t) => t.$id === id);
        if (updatedTask) {
          const { $id, title, description, status } = updatedTask;
          get().updateTaskRemote(id, { status: newStatus });
        }
      },
      // syncTasksWithRemote: async (clerkUserId) => {
      //   try {
      //     const response = await tables.listRows({
      //       databaseId: config.databaseId,
      //       tableId: config.tableTaskId,
      //       queries: [Query.equal('clerkUserId', clerkUserId)],
            
      //     });

      //     const remoteTasks = response.rows.map((doc) => ({
      //       $id: doc.$id,
      //       title: doc.title,
      //       description: doc.description,
      //       status: doc.status,
      //       createdAt: new Date(doc.createdAt),
      //       updatedAt: new Date(doc.updatedAt),
      //       clerkUserId: doc.clerkUserId,
      //     }));

      //     set({ tasks: remoteTasks });
      //   } catch (e) {
      //     console.error('Erreur lors de la synchronisation des tâches:', e);
      //   }
      // },
      saveTaskToRemote: async (task, clerkUserId) => {
        try {
          await tables.createRow({
            databaseId: config.databaseId,
            tableId: config.tableTaskId,
            rowId: ID.unique(),
            data: {
              
              clerkUserId: clerkUserId,
              title: task.title,
              description: task.description,
              status: task.status,
              
            },
            
          });
        } catch (e) {
          console.error('Erreur lors de la sauvegarde AppWrite:', e);
        }
      },
      loadTasksFromRemote: async (clerkUserId) => {
        const response = await tables.listRows({
          databaseId: config.databaseId,
          tableId: config.tableTaskId,
          queries: [Query.equal('clerkUserId', clerkUserId)],
        });

        const remoteTasks = response.rows.map((doc) => ({
          $id: doc.$id,
          title: doc.title,
          description: doc.description,
          status: doc.status,
          createdAt: new Date(doc.createdAt),
          updatedAt: new Date(doc.updatedAt),
          clerkUserId: doc.clerkUserId,
        }));

        set({ tasks: remoteTasks });
      },
      clearTasks: () => {
        set({ tasks: [] });
      },
      updateTaskRemote: async (id, updates) => {
        try {
          await tables.updateRow({
            databaseId: config.databaseId,
            tableId: config.tableTaskId,
            rowId: id,
            data: updates,
          });
          console.log('Task updated successfully');
        } catch (e) {
          console.error('Erreur lors  mise à jour AppWrite:', e);
        }
      },
      
    }),
    {
      name: 'tasks-storage',
      storage: createJSONStorage(() => AsyncStorage),

    }
  )
);