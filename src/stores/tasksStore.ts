import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { tables, ID, config } from "@/appwriter.config";
import { Query } from "appwrite";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

type TaskStatus = "todo" | "in-progress" | "done";

export interface Task {
  $id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  clerkUserId?: string;
  // Nouveaux champs pour la gestion offline
  localId?: string; // ID local temporaire avant sync
  pendingSync?: boolean; // Indique si la tâche attend d'être synchronisée
  lastModified?: number; // Timestamp de dernière modification
  syncStatus?: "synced" | "pending" | "error"; // Statut de synchronisation
}

interface PendingOperation {
  id: string;
  type: "create" | "update" | "delete";
  task?: Task;
  updates?: Partial<Task>;
  timestamp: number;
}

interface TasksState {
  tasks: Task[];
  pendingOperations: PendingOperation[]; // File d'attente des opérations offline
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;

  // Actions principales
  addTask: (newTask: Omit<Task, "$id">, clerkUserId: string) => void;
  updateTask: (id: string, updates: Partial<Task>, clerkUserId: string) => void;
  deleteTask: (id: string, clerkUserId: string) => void;
  moveTask: (id: string, newStatus: TaskStatus, clerkUserId: string) => void;

  // Gestion de la synchronisation
  setOnlineStatus: (status: boolean) => void;
  syncPendingOperations: (clerkUserId: string) => Promise<void>;
  loadTasksFromRemote: (clerkUserId: string) => Promise<void>;

  // Actions internes
  addPendingOperation: (operation: PendingOperation) => void;
  removePendingOperation: (id: string) => void;
  clearTasks: () => void;
}

export const useTasksStore = create<TasksState>()(
  persist(
    (set, get) => ({
      tasks: [],
      pendingOperations: [],
      isOnline: true,
      isSyncing: false,
      lastSyncTime: null,

      // Méthode pour définir le statut de connexion
      setOnlineStatus: (status) => {
        set({ isOnline: status });

        // Si on repasse en ligne, déclencher la synchronisation
        if (status && get().pendingOperations.length > 0) {
          const clerkUserId = get().tasks[0]?.clerkUserId;
          if (clerkUserId) {
            get().syncPendingOperations(clerkUserId);
          }
        }
      },

      // Ajouter une tâche (fonctionne offline)
      addTask: (newTask, clerkUserId) => {
        const localId = `local_${Date.now()}_${Math.random()}`;
        const task: Task = {
          $id: localId,
          ...newTask,
          clerkUserId,
          localId,
          pendingSync: !get().isOnline,
          lastModified: Date.now(),
          syncStatus: get().isOnline ? "pending" : "pending",
        };

        // Ajouter la tâche localement immédiatement
        set((state) => ({
          tasks: [...state.tasks, task],
        }));

        // Si online, tenter la sauvegarde immédiate
        if (get().isOnline) {
          saveTaskToRemoteWithRetry(task, clerkUserId, set, get);
        } else {
          // Si offline, ajouter à la file d'attente
          get().addPendingOperation({
            id: localId,
            type: "create",
            task,
            timestamp: Date.now(),
          });
        }
      },

      // Mettre à jour une tâche
      updateTask: (id, updates, clerkUserId) => {
        const timestamp = Date.now();

        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.$id === id
              ? {
                  ...t,
                  ...updates,
                  lastModified: timestamp,
                  syncStatus: get().isOnline ? "pending" : "pending",
                }
              : t
          ),
        }));

        const updatedTask = get().tasks.find((t) => t.$id === id);

        if (get().isOnline && updatedTask) {
          updateTaskRemoteWithRetry(id, updates, set, get);
        } else {
          // Ajouter à la file d'attente
          get().addPendingOperation({
            id,
            type: "update",
            updates,
            timestamp,
          });
        }
      },

      // Supprimer une tâche
      deleteTask: (id, clerkUserId) => {
        // Supprimer localement immédiatement
        set((state) => ({
          tasks: state.tasks.filter((t) => t.$id !== id),
        }));

        if (get().isOnline) {
          deleteTaskRemoteWithRetry(id, set, get);
        } else {
          // Ajouter à la file d'attente
          get().addPendingOperation({
            id,
            type: "delete",
            timestamp: Date.now(),
          });
        }
      },

      // Déplacer une tâche (changer son statut)
      moveTask: (id, newStatus, clerkUserId) => {
        get().updateTask(id, { status: newStatus }, clerkUserId);
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
          pendingOperations: state.pendingOperations.filter(
            (op) => op.id !== id
          ),
        }));
      },

      // Synchroniser toutes les opérations en attente
      syncPendingOperations: async (clerkUserId) => {
        const { pendingOperations, isSyncing } = get();

        if (isSyncing || pendingOperations.length === 0 || !get().isOnline) {
          return;
        }

        set({ isSyncing: true });

        console.log(
          `🔄 Synchronisation de ${pendingOperations.length} opérations...`
        );

        // Trier par timestamp pour respecter l'ordre
        const sortedOps = [...pendingOperations].sort(
          (a, b) => a.timestamp - b.timestamp
        );

        for (const operation of sortedOps) {
          try {
            switch (operation.type) {
              case "create":
                if (operation.task) {
                  const remoteId = await createTaskRemote(
                    operation.task,
                    clerkUserId
                  );
                  // Mettre à jour l'ID local avec l'ID distant
                  set((state) => ({
                    tasks: state.tasks.map((t) =>
                      t.$id === operation.id
                        ? {
                            ...t,
                            $id: remoteId,
                            syncStatus: "synced",
                            pendingSync: false,
                          }
                        : t
                    ),
                  }));
                }
                break;

              case "update":
                if (operation.updates) {
                  await updateTaskRemote(operation.id, operation.updates);
                  set((state) => ({
                    tasks: state.tasks.map((t) =>
                      t.$id === operation.id
                        ? { ...t, syncStatus: "synced" }
                        : t
                    ),
                  }));
                }
                break;

              case "delete":
                await deleteTaskRemote(operation.id);
                break;
            }

            // Retirer l'opération réussie
            get().removePendingOperation(operation.id);
            console.log(
              `✅ Opération ${operation.type} synchronisée pour ${operation.id}`
            );
          } catch (error) {
            console.error(
              `❌ Échec de synchronisation pour ${operation.id}:`,
              error
            );
            // Marquer la tâche comme ayant une erreur
            set((state) => ({
              tasks: state.tasks.map((t) =>
                t.$id === operation.id ? { ...t, syncStatus: "error" } : t
              ),
            }));
          }
        }

        set({
          isSyncing: false,
          lastSyncTime: Date.now(),
        });

        console.log("✅ Synchronisation terminée");
      },

      // Charger les tâches depuis le serveur
      loadTasksFromRemote: async (clerkUserId) => {
        if (!get().isOnline) {
          console.log("📴 Mode offline - utilisation des données locales");
          return;
        }

        try {
          const response = await tables.listRows({
            databaseId: config.databaseId,
            tableId: config.tableTaskId,
            queries: [Query.equal("clerkUserId", clerkUserId)],
          });

          const remoteTasks: Task[] = response.rows.map((doc) => ({
            $id: doc.$id,
            title: doc.title,
            description: doc.description,
            status: doc.status,
            clerkUserId: doc.clerkUserId,
            syncStatus: "synced",
            lastModified: new Date(doc.$updatedAt).getTime(),
          }));

          // Fusionner avec les tâches locales non synchronisées
          const localPendingTasks = get().tasks.filter((t) => t.pendingSync);
          set({ tasks: [...remoteTasks, ...localPendingTasks] });

          console.log("✅ Tâches chargées depuis le serveur");
        } catch (error) {
          console.error("❌ Erreur lors du chargement des tâches:", error);
        }
      },

      // Réinitialiser les tâches
      clearTasks: () => {
        set({ tasks: [], pendingOperations: [] });
      },
    }),
    {
      name: "tasks-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ============ FONCTIONS UTILITAIRES ============

// Créer une tâche sur le serveur
async function createTaskRemote(
  task: Task,
  clerkUserId: string
): Promise<string> {
  const response = await tables.createRow({
    databaseId: config.databaseId,
    tableId: config.tableTaskId,
    rowId: ID.unique(),
    data: {
      clerkUserId,
      title: task.title,
      description: task.description,
      status: task.status,
    },
  });
  return response.$id;
}

// Mettre à jour une tâche sur le serveur
async function updateTaskRemote(
  id: string,
  updates: Partial<Task>
): Promise<void> {
  await tables.updateRow({
    databaseId: config.databaseId,
    tableId: config.tableTaskId,
    rowId: id,
    data: updates,
  });
}

// Supprimer une tâche sur le serveur
async function deleteTaskRemote(id: string): Promise<void> {
  await tables.deleteRow({
    databaseId: config.databaseId,
    tableId: config.tableTaskId,
    rowId: id,
  });
}

// Sauvegarder avec retry automatique
async function saveTaskToRemoteWithRetry(
  task: Task,
  clerkUserId: string,
  set: any,
  get: any
) {
  try {
    const remoteId = await createTaskRemote(task, clerkUserId);
    set((state: any) => ({
      tasks: state.tasks.map((t: Task) =>
        t.$id === task.$id
          ? { ...t, $id: remoteId, syncStatus: "synced", pendingSync: false }
          : t
      ),
    }));
  } catch (error) {
    console.error("❌ Erreur sauvegarde:", error);
    get().addPendingOperation({
      id: task.$id,
      type: "create",
      task,
      timestamp: Date.now(),
    });
  }
}

// Mettre à jour avec retry automatique
async function updateTaskRemoteWithRetry(
  id: string,
  updates: Partial<Task>,
  set: any,
  get: any
) {
  try {
    await updateTaskRemote(id, updates);
    set((state: any) => ({
      tasks: state.tasks.map((t: Task) =>
        t.$id === id ? { ...t, syncStatus: "synced" } : t
      ),
    }));
  } catch (error) {
    console.error("❌ Erreur mise à jour:", error);
    get().addPendingOperation({
      id,
      type: "update",
      updates,
      timestamp: Date.now(),
    });
  }
}

// Supprimer avec retry automatique
async function deleteTaskRemoteWithRetry(id: string, set: any, get: any) {
  try {
    await deleteTaskRemote(id);
  } catch (error) {
    console.error("❌ Erreur suppression:", error);
    get().addPendingOperation({
      id,
      type: "delete",
      timestamp: Date.now(),
    });
  }
}

// ============ HOOK POUR SURVEILLER LA CONNEXION ============
