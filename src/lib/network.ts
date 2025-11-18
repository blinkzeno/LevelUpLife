// hooks/useNetworkSync.tsx
import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useTasksStore } from '@/stores/tasksStore';
import { useHabitsStore } from '@/stores/habitsStore';
import { useNotesStore } from '@/stores/notesstore';

/**
 * Hook personnalisé pour gérer la synchronisation automatique
 * des tâches en fonction de l'état de la connexion réseau
 * 
 * @param clerkUserId - ID de l'utilisateur Clerk pour la synchronisation
 */
export function useNetworkSync(clerkUserId: string | undefined) {
  const { 
    setOnlineStatus, 
    syncPendingOperations, 
    loadTasksFromRemote 
  } = useTasksStore();

  useEffect(() => {
    // Écouteur d'événements NetInfo
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      
      console.log(`📡 État de connexion: ${isConnected ? '✅ En ligne' : '❌ Hors ligne'}`);
      console.log(`   Type: ${state.type}, Détails:`, state.details);
      
      // Mettre à jour le statut dans le store
      setOnlineStatus(!!isConnected);

      // Si on repasse en ligne ET qu'il y a un utilisateur, synchroniser
      if (isConnected && clerkUserId) {
        console.log('🔄 Déclenchement de la synchronisation...');
        syncPendingOperations(clerkUserId).catch((error) => {
          console.error('❌ Erreur lors de la synchronisation:', error);
        });
      }
    });

    // Vérification initiale de l'état de la connexion
    NetInfo.fetch().then((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      setOnlineStatus(!!isConnected);
      
      console.log(`📡 État initial: ${isConnected ? '✅ En ligne' : '❌ Hors ligne'}`);
    });

    // Charger les tâches au montage du composant si connecté
    if (clerkUserId) {
      loadTasksFromRemote(clerkUserId).catch((error) => {
        console.error('❌ Erreur lors du chargement des tâches:', error);
      });
    }

    // Nettoyer l'écouteur lors du démontage
    return () => {
      unsubscribe();
    };
  }, [clerkUserId, setOnlineStatus, syncPendingOperations, loadTasksFromRemote]);
}

/**
 * Hook pour synchroniser TOUTES les données (tâches, habitudes, notes)
 * @param clerkUserId - ID de l'utilisateur Clerk
 */
export function useGlobalNetworkSync(clerkUserId: string | undefined) {
  const tasksStore = useTasksStore();
  const habitsStore = useHabitsStore();
  const notesStore = useNotesStore();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      
      console.log(`📡 [Global Sync] ${isConnected ? '✅ En ligne' : '❌ Hors ligne'}`);
      
      // Mettre à jour le statut pour tous les stores
      tasksStore.setOnlineStatus(!!isConnected);
      habitsStore.setOnlineStatus(!!isConnected);
      notesStore.setOnlineStatus(!!isConnected);

      if (isConnected && clerkUserId) {
        // Synchroniser tous les stores en parallèle
        Promise.all([
          tasksStore.syncPendingOperations(clerkUserId),
          habitsStore.syncPendingOperations(clerkUserId),
          notesStore.syncPendingOperations(clerkUserId),
        ]).catch((error) => {
          console.error('❌ [Global Sync] Erreur:', error);
        });
      }
    });

    NetInfo.fetch().then((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      tasksStore.setOnlineStatus(!!isConnected);
      habitsStore.setOnlineStatus(!!isConnected);
      notesStore.setOnlineStatus(!!isConnected);
    });

    if (clerkUserId) {
      // Charger toutes les données au démarrage
      Promise.all([
        tasksStore.loadTasksFromRemote(clerkUserId),
        habitsStore.loadHabitsFromRemote(clerkUserId),
        notesStore.loadNotesFromRemote(clerkUserId),
      ]).catch((error) => {
        console.error('❌ [Global Sync] Erreur de chargement:', error);
      });
    }

    return () => unsubscribe();
  }, [clerkUserId]);
}

// Alternative: Hook avec synchronisation périodique
export function useNetworkSyncWithInterval(
  clerkUserId: string | undefined, 
  intervalMs: number = 30000 // 30 secondes par défaut
) {
  const { 
    setOnlineStatus, 
    syncPendingOperations, 
    loadTasksFromRemote,
    isOnline,
    pendingOperations
  } = useTasksStore();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      setOnlineStatus(!!isConnected);

      if (isConnected && clerkUserId) {
        syncPendingOperations(clerkUserId);
      }
    });

    NetInfo.fetch().then((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      setOnlineStatus(!!isConnected);
    });

    if (clerkUserId) {
      loadTasksFromRemote(clerkUserId);
    }

    return () => unsubscribe();
  }, [clerkUserId]);

  // Synchronisation périodique si en ligne et qu'il y a des opérations en attente
  useEffect(() => {
    if (!isOnline || !clerkUserId || pendingOperations.length === 0) {
      return;
    }

    console.log(`⏰ Synchronisation périodique activée (${intervalMs / 1000}s)`);

    const intervalId = setInterval(() => {
      console.log('🔄 Synchronisation périodique...');
      syncPendingOperations(clerkUserId);
    }, intervalMs);

    return () => {
      console.log('⏹️ Synchronisation périodique arrêtée');
      clearInterval(intervalId);
    };
  }, [isOnline, clerkUserId, pendingOperations.length, intervalMs]);
}