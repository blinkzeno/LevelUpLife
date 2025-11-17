// stores/habitsStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tables, ID, config } from '@/appwriter.config';
import { Query } from 'appwrite';

export interface Habit {
  $id: string;
  title: string;
  description?: string;
  streak: number;
  lastCompleted: Date | null;
  frequency: 'daily' | 'weekly';
  createdAt: Date;
  clerkUserId?: string;
  // Champs pour la gestion offline
  localId?: string;
  pendingSync?: boolean;
  lastModified?: number;
  syncStatus?: 'synced' | 'pending' | 'error';
}

interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  habit?: Habit;
  updates?: Partial<Habit>;
  timestamp: number;
}

interface HabitsState {
  habits: Habit[];
  pendingOperations: PendingOperation[];
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  
  // Actions principales
  addHabit: (newHabit: Omit<Habit, '$id' | 'streak' | 'lastCompleted' | 'createdAt'>, clerkUserId: string) => void;
  completeHabit: (id: string, clerkUserId: string) => void;
  resetStreak: (id: string, clerkUserId: string) => void;
  updateHabit: (id: string, updates: Partial<Habit>, clerkUserId: string) => void;
  deleteHabit: (id: string, clerkUserId: string) => void;
  
  // Gestion de la synchronisation
  setOnlineStatus: (status: boolean) => void;
  syncPendingOperations: (clerkUserId: string) => Promise<void>;
  loadHabitsFromRemote: (clerkUserId: string) => Promise<void>;
  
  // Actions internes
  addPendingOperation: (operation: PendingOperation) => void;
  removePendingOperation: (id: string) => void;
  clearHabits: () => void;
  
  // Statistiques
  getTotalStreak: () => number;
  getActiveHabits: () => Habit[];
  getCompletedToday: () => Habit[];
}

export const useHabitsStore = create<HabitsState>()(
  persist(
    (set, get) => ({
      habits: [],
      pendingOperations: [],
      isOnline: true,
      isSyncing: false,
      lastSyncTime: null,

      // Définir le statut de connexion
      setOnlineStatus: (status) => {
        set({ isOnline: status });
        
        if (status && get().pendingOperations.length > 0) {
          const clerkUserId = get().habits[0]?.clerkUserId;
          if (clerkUserId) {
            get().syncPendingOperations(clerkUserId);
          }
        }
      },

      // Ajouter une habitude
      addHabit: (newHabit, clerkUserId) => {
        const localId = ID.unique(); // Changed from ID.unique() to ID.unique
        const habit: Habit = {
          $id: localId,
          ...newHabit,
          streak: 0,
          lastCompleted: null,
          createdAt: new Date(),
          clerkUserId,
          localId,
          pendingSync: !get().isOnline,
          lastModified: Date.now(),
          syncStatus: get().isOnline ? 'pending' : 'pending',
        };

        set((state) => ({
          habits: [...state.habits, habit],
        }));

        if (get().isOnline) {
          createHabitRemoteWithRetry(habit, clerkUserId, set, get);
        } else {
          get().addPendingOperation({
            id: localId,
            type: 'create',
            habit,
            timestamp: Date.now(),
          });
        }
      },

      // Compléter une habitude
      completeHabit: (id, clerkUserId) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const habit = get().habits.find(h => h.$id === id);
        
        if (!habit) return;

        const lastCompleted = habit.lastCompleted ? new Date(habit.lastCompleted) : null;
        const lastCompletedDay = lastCompleted
          ? new Date(lastCompleted.getFullYear(), lastCompleted.getMonth(), lastCompleted.getDate()).getTime()
          : null;

        // Vérifier si c'était hier
        const yesterday = today - 86400000;
        const isYesterday = lastCompletedDay === yesterday;
        const isToday = lastCompletedDay === today;

        // Si déjà complété aujourd'hui, ne rien faire
        if (isToday) return;

        // Calculer le nouveau streak
        const newStreak = isYesterday ? habit.streak + 1 : 1;

        const updates = {
          streak: newStreak,
          lastCompleted: now,
          lastModified: Date.now(),
          syncStatus: get().isOnline ? 'pending' : 'pending' as const,
        };

        set((state) => ({
          habits: state.habits.map((h) =>
            h.$id === id ? { ...h, ...updates } : h
          ),
        }));

        if (get().isOnline) {
          updateHabitRemoteWithRetry(id, updates, set, get);
        } else {
          get().addPendingOperation({
            id,
            type: 'update',
            updates,
            timestamp: Date.now(),
          });
        }
      },

      // Réinitialiser le streak
      resetStreak: (id, clerkUserId) => {
        const updates = {
          streak: 0,
          lastCompleted: null,
          lastModified: Date.now(),
          syncStatus: get().isOnline ? 'pending' : 'pending' as const,
        };

        set((state) => ({
          habits: state.habits.map((h) =>
            h.$id === id ? { ...h, ...updates } : h
          ),
        }));

        if (get().isOnline) {
          updateHabitRemoteWithRetry(id, updates, set, get);
        } else {
          get().addPendingOperation({
            id,
            type: 'update',
            updates,
            timestamp: Date.now(),
          });
        }
      },

      // Mettre à jour une habitude
      updateHabit: (id, updates, clerkUserId) => {
        const timestamp = Date.now();
        
        set((state) => ({
          habits: state.habits.map((h) =>
            h.$id === id
              ? {
                  ...h,
                  ...updates,
                  lastModified: timestamp,
                  syncStatus: get().isOnline ? 'pending' : 'pending' as const,
                }
              : h
          ),
        }));

        if (get().isOnline) {
          updateHabitRemoteWithRetry(id, updates, set, get);
        } else {
          get().addPendingOperation({
            id,
            type: 'update',
            updates,
            timestamp,
          });
        }
      },

      // Supprimer une habitude
      deleteHabit: (id, clerkUserId) => {
        set((state) => ({
          habits: state.habits.filter((h) => h.$id !== id),
        }));

        if (get().isOnline) {
          deleteHabitRemoteWithRetry(id, set, get);
        } else {
          get().addPendingOperation({
            id,
            type: 'delete',
            timestamp: Date.now(),
          });
        }
      },

      // Ajouter une opération en attente
      addPendingOperation: (operation) => {
        set((state) => ({
          pendingOperations: [...state.pendingOperations, operation],
        }));
      },

      // Retirer une opération en attente
      removePendingOperation: (id) => {
        set((state) => ({
          pendingOperations: state.pendingOperations.filter((op) => op.id !== id),
        }));
      },

      // Synchroniser les opérations en attente
      syncPendingOperations: async (clerkUserId) => {
        const { pendingOperations, isSyncing } = get();

        if (isSyncing || pendingOperations.length === 0 || !get().isOnline) {
          return;
        }

        set({ isSyncing: true });

        console.log(`🔄 Synchronisation de ${pendingOperations.length} habitudes...`);

        const sortedOps = [...pendingOperations].sort((a, b) => a.timestamp - b.timestamp);

        for (const operation of sortedOps) {
          try {
            switch (operation.type) {
              case 'create':
                if (operation.habit) {
                  const remoteId = await createHabitRemote(operation.habit, clerkUserId);
                  set((state) => ({
                    habits: state.habits.map((h) =>
                      h.$id === operation.id
                        ? { ...h, $id: remoteId, syncStatus: 'synced', pendingSync: false }
                        : h
                    ),
                  }));
                }
                break;

              case 'update':
                if (operation.updates) {
                  await updateHabitRemote(operation.id, operation.updates);
                  set((state) => ({
                    habits: state.habits.map((h) =>
                      h.$id === operation.id ? { ...h, syncStatus: 'synced' } : h
                    ),
                  }));
                }
                break;

              case 'delete':
                await deleteHabitRemote(operation.id);
                break;
            }

            get().removePendingOperation(operation.id);
            console.log(`✅ Opération ${operation.type} synchronisée pour ${operation.id}`);
          } catch (error) {
            console.error(`❌ Échec de synchronisation pour ${operation.id}:`, error);
            set((state) => ({
              habits: state.habits.map((h) =>
                h.$id === operation.id ? { ...h, syncStatus: 'error' } : h
              ),
            }));
          }
        }

        set({
          isSyncing: false,
          lastSyncTime: Date.now(),
        });

        console.log('✅ Synchronisation des habitudes terminée');
      },

      // Charger les habitudes depuis le serveur
      loadHabitsFromRemote: async (clerkUserId) => {
        if (!get().isOnline) {
          console.log('📴 Mode offline - utilisation des habitudes locales');
          return;
        }

        try {
          const response = await tables.listRows({
            databaseId: config.databaseId,
            tableId: config.tableHabitId, // Assurez-vous d'avoir ce champ dans votre config
            queries: [Query.equal('clerkUserId', clerkUserId)],
          });

          const remoteHabits: Habit[] = response.rows.map((doc) => ({
            $id: doc.$id,
            title: doc.title,
            description: doc.description,
            streak: doc.streak || 0,
            lastCompleted: doc.lastCompleted ? new Date(doc.lastCompleted) : null,
            frequency: doc.frequency || 'daily',
            createdAt: new Date(doc.$createdAt),
            clerkUserId: doc.clerkUserId,
            syncStatus: 'synced',
            lastModified: new Date(doc.$updatedAt).getTime(),
          }));

          const localPendingHabits = get().habits.filter((h) => h.pendingSync);
          set({ habits: [...remoteHabits, ...localPendingHabits] });

          console.log('✅ Habitudes chargées depuis le serveur');
        } catch (error) {
          console.error('❌ Erreur lors du chargement des habitudes:', error);
        }
      },

      // Réinitialiser les habitudes
      clearHabits: () => {
        set({ habits: [], pendingOperations: [] });
      },

      // Statistiques - Total des streaks
      getTotalStreak: () => {
        return get().habits.reduce((total, habit) => total + habit.streak, 0);
      },

      // Habitudes actives (avec streak > 0)
      getActiveHabits: () => {
        return get().habits.filter(habit => habit.streak > 0);
      },

      // Habitudes complétées aujourd'hui
      getCompletedToday: () => {
        const today = new Date().setHours(0, 0, 0, 0);
        return get().habits.filter(habit => {
          if (!habit.lastCompleted) return false;
          const lastCompletedDay = new Date(habit.lastCompleted).setHours(0, 0, 0, 0);
          return lastCompletedDay === today;
        });
      },
    }),
    {
      name: 'habits-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ============ FONCTIONS UTILITAIRES ============

// Créer une habitude sur le serveur
async function createHabitRemote(habit: Habit, clerkUserId: string): Promise<string> {
  const response = await tables.createRow({
    databaseId: config.databaseId,
    tableId: config.tableHabitId,
    rowId: ID.unique(),
    data: {
      clerkUserId,
      title: habit.title,
      description: habit.description,
      streak: habit.streak,
      lastCompleted: habit.lastCompleted ? habit.lastCompleted.toISOString() : null,
      frequency: habit.frequency,
    },
  });
  return response.$id;
}

// Mettre à jour une habitude sur le serveur
async function updateHabitRemote(id: string, updates: Partial<Habit>): Promise<void> {
  const data: any = { ...updates };
  
  // Convertir la date en ISO string si présente
  if (data.lastCompleted instanceof Date) {
    data.lastCompleted = data.lastCompleted.toISOString();
  }
  
  // Supprimer les champs non nécessaires pour Appwrite
  delete data.syncStatus;
  delete data.localId;
  delete data.pendingSync;
  delete data.lastModified;
  delete data.$id;
  delete data.clerkUserId;
  delete data.createdAt;

  await tables.updateRow({
    databaseId: config.databaseId,
    tableId: config.tableHabitId,
    rowId: id,
    data,
  });
}

// Supprimer une habitude sur le serveur
async function deleteHabitRemote(id: string): Promise<void> {
  await tables.deleteRow({
    databaseId: config.databaseId,
    tableId: config.tableHabitId,
    rowId: id,
  });
}

// Créer avec retry automatique
async function createHabitRemoteWithRetry(
  habit: Habit,
  clerkUserId: string,
  set: any,
  get: any
) {
  try {
    const remoteId = await createHabitRemote(habit, clerkUserId);
    set((state: any) => ({
      habits: state.habits.map((h: Habit) =>
        h.$id === habit.$id
          ? { ...h, $id: remoteId, syncStatus: 'synced', pendingSync: false }
          : h
      ),
    }));
  } catch (error) {
    console.error('❌ Erreur sauvegarde habitude:', error);
    get().addPendingOperation({
      id: habit.$id,
      type: 'create',
      habit,
      timestamp: Date.now(),
    });
  }
}

// Mettre à jour avec retry automatique
async function updateHabitRemoteWithRetry(
  id: string,
  updates: Partial<Habit>,
  set: any,
  get: any
) {
  try {
    await updateHabitRemote(id, updates);
    set((state: any) => ({
      habits: state.habits.map((h: Habit) =>
        h.$id === id ? { ...h, syncStatus: 'synced' } : h
      ),
    }));
  } catch (error) {
    console.error('❌ Erreur mise à jour habitude:', error);
    get().addPendingOperation({
      id,
      type: 'update',
      updates,
      timestamp: Date.now(),
    });
  }
}

// Supprimer avec retry automatique
async function deleteHabitRemoteWithRetry(id: string, set: any, get: any) {
  try {
    await deleteHabitRemote(id);
  } catch (error) {
    console.error('❌ Erreur suppression habitude:', error);
    get().addPendingOperation({
      id,
      type: 'delete',
      timestamp: Date.now(),
    });
  }
}