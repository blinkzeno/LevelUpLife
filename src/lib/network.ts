// À utiliser dans votre composant principal (App.tsx)
import { useTasksStore } from "@/stores/tasksStore";
import NetInfo from "@react-native-community/netinfo";
import { useEffect } from "react";


import { useHabitsStore } from "@/stores/habitsStore";

export function useCombinedNetworkSync(clerkUserId: string | undefined) {
  const tasksStore = useTasksStore();
  const habitsStore = useHabitsStore();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      
      console.log(`📡 [Sync Global] ${isConnected ? '✅ En ligne' : '❌ Hors ligne'}`);
      
      // Mettre à jour le statut pour les deux stores
      tasksStore.setOnlineStatus(!!isConnected);
      habitsStore.setOnlineStatus(!!isConnected);

      if (isConnected && clerkUserId) {
        // Synchroniser les deux stores
        Promise.all([
          tasksStore.syncPendingOperations(clerkUserId),
          habitsStore.syncPendingOperations(clerkUserId),
        ]).catch((error) => {
          console.error('❌ [Sync Global] Erreur:', error);
        });
      }
    });

    NetInfo.fetch().then((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      tasksStore.setOnlineStatus(!!isConnected);
      habitsStore.setOnlineStatus(!!isConnected);
    });

    if (clerkUserId) {
      Promise.all([
        tasksStore.loadTasksFromRemote(clerkUserId),
        habitsStore.loadHabitsFromRemote(clerkUserId),
      ]).catch((error) => {
        console.error('❌ [Sync Global] Erreur de chargement:', error);
      });
    }

    return () => unsubscribe();
  }, [clerkUserId]);
}
