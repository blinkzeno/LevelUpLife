// stores/notesStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tables, ID, config } from '@/appwriter.config';
import { Query } from 'appwrite';

export interface Note {
  $id: string;
  title: string;
  content: string;
  isFavorite: boolean;
  createdAt: Date;
  updatedAt: Date;
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
  note?: Note;
  updates?: Partial<Note>;
  timestamp: number;
}

interface NotesState {
  notes: Note[];
  pendingOperations: PendingOperation[];
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  
  // Actions principales
  addNote: (newNote: Omit<Note, '$id' | 'createdAt' | 'updatedAt' | 'isFavorite'>, clerkUserId: string) => void;
  updateNote: (id: string, updates: Partial<Note>, clerkUserId: string) => void;
  deleteNote: (id: string, clerkUserId: string) => void;
  toggleFavorite: (id: string, clerkUserId: string) => void;
  
  // Gestion de la synchronisation
  setOnlineStatus: (status: boolean) => void;
  syncPendingOperations: (clerkUserId: string) => Promise<void>;
  loadNotesFromRemote: (clerkUserId: string) => Promise<void>;
  
  // Actions internes
  addPendingOperation: (operation: PendingOperation) => void;
  removePendingOperation: (id: string) => void;
  clearNotes: () => void;
  
  // Utilitaires
  getFavoriteNotes: () => Note[];
  getNoteById: (id: string) => Note | undefined;
  searchNotes: (query: string) => Note[];
  getRecentNotes: (limit?: number) => Note[];
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: [],
      pendingOperations: [],
      isOnline: true,
      isSyncing: false,
      lastSyncTime: null,

      // Définir le statut de connexion
      setOnlineStatus: (status) => {
        set({ isOnline: status });
        
        if (status && get().pendingOperations.length > 0) {
          const clerkUserId = get().notes[0]?.clerkUserId;
          if (clerkUserId) {
            get().syncPendingOperations(clerkUserId);
          }
        }
      },

      // Ajouter une note
      addNote: (newNote, clerkUserId) => {
        const localId = ID.unique();
        const now = new Date();
        
        const note: Note = {
          $id: localId,
          ...newNote,
          isFavorite: false,
          createdAt: now,
          updatedAt: now,
          clerkUserId,
          localId,
          pendingSync: !get().isOnline,
          lastModified: Date.now(),
          syncStatus: get().isOnline ? 'pending' : 'pending',
        };

        set((state) => ({
          notes: [note, ...state.notes], // Ajouter en premier (plus récent en haut)
        }));

        if (get().isOnline) {
          createNoteRemoteWithRetry(note, clerkUserId, set, get);
        } else {
          get().addPendingOperation({
            id: localId,
            type: 'create',
            note,
            timestamp: Date.now(),
          });
        }
      },

      // Mettre à jour une note
      updateNote: (id, updates, clerkUserId) => {
        const timestamp = Date.now();
        const now = new Date();
        
        set((state) => ({
          notes: state.notes.map((note) =>
            note.$id === id
              ? {
                  ...note,
                  ...updates,
                  lastModified: timestamp,
                  syncStatus: get().isOnline ? 'pending' : 'pending' as const,
                }
              : note
          ),
        }));

        if (get().isOnline) {
          updateNoteRemoteWithRetry(id, { ...updates }, set, get);
        } else {
          get().addPendingOperation({
            id,
            type: 'update',
            updates: { ...updates },
            timestamp,
          });
        }
      },

      // Supprimer une note
      deleteNote: (id, clerkUserId) => {
        set((state) => ({
          notes: state.notes.filter((note) => note.$id !== id),
        }));

        if (get().isOnline) {
          deleteNoteRemoteWithRetry(id, set, get);
        } else {
          get().addPendingOperation({
            id,
            type: 'delete',
            timestamp: Date.now(),
          });
        }
      },

      // Basculer le favori
      toggleFavorite: (id, clerkUserId) => {
        const note = get().notes.find(n => n.$id === id);
        if (!note) return;

        const updates = {
          isFavorite: !note.isFavorite,
          lastModified: Date.now(),
          syncStatus: get().isOnline ? 'pending' : 'pending' as const,
        };

        set((state) => ({
          notes: state.notes.map((n) =>
            n.$id === id ? { ...n, ...updates, updatedAt: new Date() } : n
          ),
        }));

        if (get().isOnline) {
          updateNoteRemoteWithRetry(id, { isFavorite: !note.isFavorite }, set, get);
        } else {
          get().addPendingOperation({
            id,
            type: 'update',
            updates: { isFavorite: !note.isFavorite },
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

        console.log(`🔄 [Notes] Synchronisation de ${pendingOperations.length} opérations...`);

        const sortedOps = [...pendingOperations].sort((a, b) => a.timestamp - b.timestamp);

        for (const operation of sortedOps) {
          try {
            switch (operation.type) {
              case 'create':
                if (operation.note) {
                  const remoteId = await createNoteRemote(operation.note, clerkUserId);
                  set((state) => ({
                    notes: state.notes.map((n) =>
                      n.$id === operation.id
                        ? { ...n, $id: remoteId, syncStatus: 'synced', pendingSync: false }
                        : n
                    ),
                  }));
                }
                break;

              case 'update':
                if (operation.updates) {
                  await updateNoteRemote(operation.id, operation.updates);
                  set((state) => ({
                    notes: state.notes.map((n) =>
                      n.$id === operation.id ? { ...n, syncStatus: 'synced' } : n
                    ),
                  }));
                }
                break;

              case 'delete':
                await deleteNoteRemote(operation.id);
                break;
            }

            get().removePendingOperation(operation.id);
            console.log(`✅ [Notes] Opération ${operation.type} synchronisée pour ${operation.id}`);
          } catch (error) {
            console.error(`❌ [Notes] Échec de synchronisation pour ${operation.id}:`, error);
            set((state) => ({
              notes: state.notes.map((n) =>
                n.$id === operation.id ? { ...n, syncStatus: 'error' } : n
              ),
            }));
          }
        }

        set({
          isSyncing: false,
          lastSyncTime: Date.now(),
        });

        console.log('✅ [Notes] Synchronisation terminée');
      },

      // Charger les notes depuis le serveur
      loadNotesFromRemote: async (clerkUserId) => {
        if (!get().isOnline) {
          console.log('📴 [Notes] Mode offline - utilisation des notes locales');
          return;
        }

        try {
          const response = await tables.listRows({
            databaseId: config.databaseId,
            tableId: config.tableNoteId,
            queries: [
              Query.equal('clerkUserId', clerkUserId),
              Query.orderDesc('$updatedAt'), // Plus récentes en premier
            ],
          });

          const remoteNotes: Note[] = response.rows.map((doc) => ({
            $id: doc.$id,
            title: doc.title,
            content: doc.content,
            isFavorite: doc.isFavorite || false,
            createdAt: new Date(doc.$createdAt),
            updatedAt: new Date(doc.$updatedAt),
            clerkUserId: doc.clerkUserId,
            syncStatus: 'synced',
            lastModified: new Date(doc.$updatedAt).getTime(),
          }));

          const localPendingNotes = get().notes.filter((n) => n.pendingSync);
          set({ notes: [...localPendingNotes, ...remoteNotes] });

          console.log('✅ [Notes] Notes chargées depuis le serveur');
        } catch (error) {
          console.error('❌ [Notes] Erreur lors du chargement:', error);
        }
      },

      // Réinitialiser les notes
      clearNotes: () => {
        set({ notes: [], pendingOperations: [] });
      },

      // Obtenir les notes favorites
      getFavoriteNotes: () => {
        return get().notes.filter((note) => note.isFavorite);
      },

      // Obtenir une note par ID
      getNoteById: (id) => {
        return get().notes.find((note) => note.$id === id);
      },

      // Rechercher des notes
      searchNotes: (query) => {
        const lowerQuery = query.toLowerCase();
        return get().notes.filter(
          (note) =>
            note.title.toLowerCase().includes(lowerQuery) ||
            note.content.toLowerCase().includes(lowerQuery)
        );
      },

      // Obtenir les notes récentes
      getRecentNotes: (limit = 5) => {
        return get()
          .notes
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, limit);
      },
    }),
    {
      name: 'notes-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// ============ FONCTIONS UTILITAIRES ============

// Créer une note sur le serveur
async function createNoteRemote(note: Note, clerkUserId: string): Promise<string> {
  const response = await tables.createRow({
    databaseId: config.databaseId,
    tableId: config.tableNoteId,
    rowId: ID.unique(),
    data: {
      clerkUserId,
      title: note.title,
      content: note.content,
      isFavorite: note.isFavorite,
    },
  });
  return response.$id;
}

// Mettre à jour une note sur le serveur
async function updateNoteRemote(id: string, updates: Partial<Note>): Promise<void> {
  const data: any = { ...updates };
  
  // Convertir la date en ISO string si présente
  if (data.updatedAt instanceof Date) {
    data.updatedAt = data.updatedAt.toISOString();
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
    tableId: config.tableNoteId,
    rowId: id,
    data,
  });
}

// Supprimer une note sur le serveur
async function deleteNoteRemote(id: string): Promise<void> {
  await tables.deleteRow({
    databaseId: config.databaseId,
    tableId: config.tableNoteId,
    rowId: id,
  });
}

// Créer avec retry automatique
async function createNoteRemoteWithRetry(
  note: Note,
  clerkUserId: string,
  set: any,
  get: any
) {
  try {
    const remoteId = await createNoteRemote(note, clerkUserId);
    set((state: any) => ({
      notes: state.notes.map((n: Note) =>
        n.$id === note.$id
          ? { ...n, $id: remoteId, syncStatus: 'synced', pendingSync: false }
          : n
      ),
    }));
  } catch (error) {
    console.error('❌ [Notes] Erreur sauvegarde:', error);
    get().addPendingOperation({
      id: note.$id,
      type: 'create',
      note,
      timestamp: Date.now(),
    });
  }
}

// Mettre à jour avec retry automatique
async function updateNoteRemoteWithRetry(
  id: string,
  updates: Partial<Note>,
  set: any,
  get: any
) {
  try {
    await updateNoteRemote(id, updates);
    set((state: any) => ({
      notes: state.notes.map((n: Note) =>
        n.$id === id ? { ...n, syncStatus: 'synced' } : n
      ),
    }));
  } catch (error) {
    console.error('❌ [Notes] Erreur mise à jour:', error);
    get().addPendingOperation({
      id,
      type: 'update',
      updates,
      timestamp: Date.now(),
    });
  }
}

// Supprimer avec retry automatique
async function deleteNoteRemoteWithRetry(id: string, set: any, get: any) {
  try {
    await deleteNoteRemote(id);
  } catch (error) {
    console.error('❌ [Notes] Erreur suppression:', error);
    get().addPendingOperation({
      id,
      type: 'delete',
      timestamp: Date.now(),
    });
  }
}