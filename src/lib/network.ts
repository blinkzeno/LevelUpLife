// À utiliser dans votre composant principal (App.tsx)
import { useTasksStore } from "@/stores/tasksStore";
import NetInfo from "@react-native-community/netinfo";
import { useEffect } from "react";

export function useNetworkSync(clerkUserId: string | undefined) {
  const { setOnlineStatus, syncPendingOperations, loadTasksFromRemote } =
    useTasksStore();

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = state.isConnected && state.isInternetReachable;
      console.log(`📡 Connexion: ${isConnected ? "Online" : "Offline"}`);
      setOnlineStatus(!!isConnected);

      // Si on repasse en ligne, synchroniser
      if (isConnected && clerkUserId) {
        syncPendingOperations(clerkUserId);
      }
    });

    // Charger les tâches au démarrage si online
    if (clerkUserId) {
      loadTasksFromRemote(clerkUserId);
    }

    return () => unsubscribe();
  }, [clerkUserId]);
}
