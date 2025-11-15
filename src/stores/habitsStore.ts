// stores/habitsStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface Habit {
  id: string;
  title: string;
  streak: number; // jours consécutifs
  lastCompleted: Date | null;
  frequency: 'daily' | 'weekly'; // pourra évoluer
  createdAt: Date;
}

interface HabitsState {
  habits: Habit[];
  addHabit: (habit: Omit<Habit, 'id' | 'streak' | 'lastCompleted' | 'createdAt'>) => void;
  completeHabit: (id: string) => void;
  resetStreak: (id: string) => void;
  deleteHabit: (id: string) => void;
}

export const useHabitsStore = create<HabitsState>()(
  persist(
    (set, get) => ({
      habits: [],
      addHabit: (newHabit) =>
        set((state) => ({
          habits: [
            ...state.habits,
            {
              ...newHabit,
              id: Date.now().toString(),
              streak: 0,
              lastCompleted: null,
              createdAt: new Date(),
            },
          ],
        })),
      completeHabit: (id) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const habit = get().habits.find(h => h.id === id);
        if (!habit) return;

        const lastCompleted = habit.lastCompleted ? new Date(habit.lastCompleted) : null;
        const lastCompletedDay = lastCompleted
          ? new Date(lastCompleted.getFullYear(), lastCompleted.getMonth(), lastCompleted.getDate()).getTime()
          : null;

        const isYesterday = lastCompletedDay === new Date(now).setHours(0, 0, 0, 0) - 86400000; // 1 jour
        const streak = isYesterday ? habit.streak + 1 : habit.streak > 0 ? 1 : 1;

        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id
              ? { ...h, streak, lastCompleted: now }
              : h
          ),
        }));
      },
      resetStreak: (id) =>
        set((state) => ({
          habits: state.habits.map((h) =>
            h.id === id ? { ...h, streak: 0 } : h
          ),
        })),
      deleteHabit: (id) =>
        set((state) => ({
          habits: state.habits.filter((h) => h.id !== id),
        })),
    }),
    {
      name: 'habits-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);