// screens/TasksScreen.tsx
import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { useTasksStore } from "@/stores/tasksStore";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@clerk/clerk-expo";
import AddTaskModal from "@/components/AddTaskModal";
import { Ionicons } from "@expo/vector-icons";

const TasksScreen = () => {
  const { user } = useUser();
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    tasks,
    moveTask,
    deleteTask,
    loadTasksFromRemote,
    isOnline,
    isSyncing,
    pendingOperations,
    syncPendingOperations,
    lastSyncTime,
  } = useTasksStore();

  useEffect(() => {
    const loadTasks = async () => {
      if (user?.id) {
        await loadTasksFromRemote(user.id);
      }
    };
    loadTasks();
  }, [user?.id]);

  // Rafraîchir manuellement
  const onRefresh = async () => {
    if (!user?.id) return;

    setRefreshing(true);

    if (isOnline) {
      await syncPendingOperations(user.id);
      await loadTasksFromRemote(user.id);
    }

    setRefreshing(false);
  };

  const handleDeleteTask = (taskId: string) => {
    Alert.alert(
      "Supprimer la tâche",
      "Êtes-vous sûr de vouloir supprimer cette tâche?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            if (user?.id) {
              deleteTask(taskId, user.id);
            }
          },
        },
      ]
    );
  };

  const toggleTaskStatus = (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "todo" : "done";
    if (user?.id) {
      moveTask(taskId, newStatus, user.id);
    }
  };

  // Obtenir l'icône de statut de sync
  const getSyncIcon = (syncStatus?: string) => {
    switch (syncStatus) {
      case "synced":
        return <Ionicons name="checkmark-circle" size={16} color="#10B981" />;
      case "pending":
        return <Ionicons name="sync" size={16} color="#F59E0B" />;
      case "error":
        return <Ionicons name="alert-circle" size={16} color="#EF4444" />;
      default:
        return null;
    }
  };

  const renderTaskItem = ({ item }: { item: any }) => (
    <View className="flex-row items-center bg-white p-4 rounded-xl mb-3 shadow-sm">
      {/* Checkbox */}
      <TouchableOpacity
        className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
          item.status === "done"
            ? "bg-blue-500 border-blue-500"
            : "border-blue-500"
        }`}
        onPress={() => toggleTaskStatus(item.$id, item.status)}
      >
        {item.status === "done" && (
          <Ionicons name="checkmark" size={16} color="white" />
        )}
      </TouchableOpacity>

      {/* Contenu de la tâche */}
      <View className="flex-1">
        <View className="flex-row items-center mb-1">
          <Text
            className={`text-base font-semibold flex-1 ${
              item.status === "done"
                ? "line-through text-gray-400"
                : "text-gray-800"
            }`}
          >
            {item.title}
          </Text>

          {/* Icône de statut de synchronisation */}
          <View className="ml-2">{getSyncIcon(item.syncStatus)}</View>
        </View>

        {item.description ? (
          <Text className="text-sm text-gray-500 mb-1" numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        {/* Badge de statut */}
        <View className="flex-row items-center mt-1">
          <View
            className={`px-2 py-1 rounded-full ${
              item.status === "todo"
                ? "bg-gray-100"
                : item.status === "in-progress"
                ? "bg-blue-100"
                : "bg-green-100"
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                item.status === "todo"
                  ? "text-gray-600"
                  : item.status === "in-progress"
                  ? "text-blue-600"
                  : "text-green-600"
              }`}
            >
              {item.status === "todo"
                ? "📝 À faire"
                : item.status === "in-progress"
                ? "⏳ En cours"
                : "✅ Terminé"}
            </Text>
          </View>
        </View>
      </View>

      {/* Bouton de suppression */}
      <TouchableOpacity
        className="w-8 h-8 bg-red-500 rounded-full items-center justify-center ml-2"
        onPress={() => handleDeleteTask(item.$id)}
      >
        <Ionicons name="trash-outline" size={16} color="white" />
      </TouchableOpacity>
    </View>
  );

  // Header avec statut de connexion et sync
  const renderHeader = () => (
    <View className="mb-4">
      {/* Barre de statut */}
      <View className="flex-row items-center justify-between mb-4 bg-white p-3 rounded-xl shadow-sm">
        {/* Statut de connexion */}
        <View className="flex-row items-center">
          <View
            className={`w-2 h-2 rounded-full mr-2 ${
              isOnline ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <Text className="text-sm font-medium text-gray-700">
            {isOnline ? "🌐 En ligne" : "📴 Hors ligne"}
          </Text>
        </View>

        {/* Statut de synchronisation */}
        {isSyncing && (
          <View className="flex-row items-center">
            <Ionicons name="sync" size={16} color="#3B82F6" />
            <Text className="text-sm text-blue-500 ml-1">
              Synchronisation...
            </Text>
          </View>
        )}

        {/* Opérations en attente */}
        {pendingOperations.length > 0 && (
          <View className="flex-row items-center bg-amber-100 px-2 py-1 rounded-full">
            <Ionicons name="time-outline" size={14} color="#F59E0B" />
            <Text className="text-xs text-amber-600 ml-1 font-medium">
              {pendingOperations.length} en attente
            </Text>
          </View>
        )}
      </View>

      {/* Statistiques */}
      <View className="flex-row justify-between mb-4">
        <View className="flex-1 bg-blue-50 p-4 rounded-xl mr-2">
          <Text className="text-2xl font-bold text-blue-600">
            {tasks.length}
          </Text>
          <Text className="text-sm text-blue-600 mt-1">Total</Text>
        </View>

        <View className="flex-1 bg-green-50 p-4 rounded-xl mr-2">
          <Text className="text-2xl font-bold text-green-600">
            {tasks.filter((t) => t.status === "done").length}
          </Text>
          <Text className="text-sm text-green-600 mt-1">Terminées</Text>
        </View>

        <View className="flex-1 bg-amber-50 p-4 rounded-xl">
          <Text className="text-2xl font-bold text-amber-600">
            {tasks.filter((t) => t.status === "todo").length}
          </Text>
          <Text className="text-sm text-amber-600 mt-1">À faire</Text>
        </View>
      </View>

      {/* Bouton d'ajout */}
      <TouchableOpacity
        className="bg-blue-500 p-4 rounded-xl flex-row items-center justify-center shadow-md active:bg-blue-600"
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add-circle-outline" size={24} color="white" />
        <Text className="text-white font-bold text-base ml-2">
          Ajouter une tâche
        </Text>
      </TouchableOpacity>

      {/* Dernière synchronisation */}
      {lastSyncTime && isOnline && (
        <Text className="text-xs text-gray-400 text-center mt-2">
          Dernière sync: {new Date(lastSyncTime).toLocaleTimeString("fr-FR")}
        </Text>
      )}
    </View>
  );

  // Message vide
  const renderEmptyList = () => (
    <View className="flex-1 items-center justify-center py-20">
      <Ionicons name="list-outline" size={64} color="#D1D5DB" />
      <Text className="text-gray-400 text-lg font-medium mt-4">
        Aucune tâche
      </Text>
      <Text className="text-gray-300 text-sm mt-2">
        Commencez par ajouter votre première tâche
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 px-4 pt-4">
        <FlatList
          data={tasks}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item.$id}
          renderItem={renderTaskItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyList}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#3B82F6"]}
              tintColor="#3B82F6"
            />
          }
        />

        <AddTaskModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
};

export default TasksScreen;
