import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';

interface OnboardingState {
  hasCompletedOnboarding: boolean;
  answers: {
    question1: string;
    question2: string;
    question3: string;
    goals: string;
  };
  setHasCompletedOnboarding: (status: boolean) => void;
  setAnswers: (answers: Partial<OnboardingState['answers']>) => void;
  reset: () => void;
  setHydrated: (state: boolean) => void;
}

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasCompletedOnboarding: false,
      answers: {
        question1: '',
        question2: '',
        question3: '',
        goals: '',
      },
      setHasCompletedOnboarding: (status) => set({ hasCompletedOnboarding: status }),
      setHydrated: () => {}, // handled by onRehydrateStorage
      setAnswers: (newAnswers) =>
        set((state) => ({
          answers: { ...state.answers, ...newAnswers },
        })),
      reset: () =>
        set({
          hasCompletedOnboarding: false,
          answers: {
            question1: '',
            question2: '',
            question3: '',
            goals: '',
          },
        }),
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

export const useOnboardingHydration = () => {
  const [hydrated, setHydrated] = useState(false);
  
  useEffect(() => {
    const unsub = useOnboardingStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useOnboardingStore.persist.hasHydrated());
    return () => unsub();
  }, []);
  
  return hydrated;
};
