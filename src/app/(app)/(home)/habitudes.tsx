// screens/HabitsScreen.tsx
import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useHabitsStore } from '@/stores/habitsStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import AddHabitModal from '@/components/AddHabitModal';

const HabitsScreen = () => {
  const { user } = useUser();
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const { 
    habits, 
    completeHabit,
    resetStreak,
    deleteHabit, 
    loadHabitsFromRemote,
    isOnline,
    isSyncing,
    pendingOperations,
    syncPendingOperations,
    getTotalStreak,
    getActiveHabits,
    getCompletedToday,
  } = useHabitsStore();
  
  useEffect(() => {
    const loadHabits = async () => {
      if (user?.id) {
        await loadHabitsFromRemote(user.id);
      }
    };
    loadHabits();
  }, [user?.id]);

  const onRefresh = async () => {
    if (!user?.id) return;
    
    setRefreshing(true);
    if (isOnline) {
      await syncPendingOperations(user.id);
      await loadHabitsFromRemote(user.id);
    }
    setRefreshing(false);
  };

  const handleCompleteHabit = (habitId: string) => {
    if (user?.id) {
      completeHabit(habitId, user.id);
    }
  };

  const handleResetStreak = (habitId: string, habitTitle: string) => {
    Alert.alert(
      "Réinitialiser le streak",
      `Êtes-vous sûr de vouloir réinitialiser le streak de "${habitTitle}"?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Réinitialiser",
          style: "destructive",
          onPress: () => {
            if (user?.id) {
              resetStreak(habitId, user.id);
              
            }
          }
        }
      ]
    );
  };

  const handleDeleteHabit = (habitId: string, habitTitle: string) => {
    Alert.alert(
      "Supprimer l'habitude",
      `Êtes-vous sûr de vouloir supprimer "${habitTitle}"?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            if (user?.id) {
              deleteHabit(habitId, user.id);
            }
          }
        }
      ]
    );
  };

  const getSyncIcon = (syncStatus?: string) => {
    switch (syncStatus) {
      case 'synced':
        return <Ionicons name="checkmark-circle" size={16} color="#10B981" />;
      case 'pending':
        return <Ionicons name="sync" size={16} color="#F59E0B" />;
      case 'error':
        return <Ionicons name="alert-circle" size={16} color="#EF4444" />;
      default:
        return null;
    }
  };

  const isCompletedToday = (habit: any) => {
    if (!habit.lastCompleted) return false;
    const today = new Date().setHours(0, 0, 0, 0);
    const lastCompletedDay = new Date(habit.lastCompleted).setHours(0, 0, 0, 0);
    return lastCompletedDay === today;
  };

  const renderHabitItem = ({ item }: { item: any }) => {
    const completedToday = isCompletedToday(item);
    
    return (
      <View className="bg-white p-4 rounded-xl mb-3 shadow-sm">
        <View className="flex-row items-start justify-between mb-3">
          {/* Titre et description */}
          <View className="flex-1 mr-3">
            <View className="flex-row items-center mb-1">
              <Text className="text-base font-bold text-gray-800 flex-1">
                {item.title}
              </Text>
              {getSyncIcon(item.syncStatus)}
            </View>
            
            {item.description && (
              <Text className="text-sm text-gray-500 mb-2" numberOfLines={2}>
                {item.description}
              </Text>
            )}

            {/* Badge fréquence */}
            <View className="flex-row items-center">
              <View className={`px-2 py-1 rounded-full ${
                item.frequency === 'daily' ? 'bg-blue-100' : 'bg-purple-100'
              }`}>
                <Text className={`text-xs font-medium ${
                  item.frequency === 'daily' ? 'text-blue-600' : 'text-purple-600'
                }`}>
                  {item.frequency === 'daily' ? '📅 Quotidien' : '📆 Hebdomadaire'}
                </Text>
              </View>
            </View>
          </View>

          {/* Bouton supprimer */}
          <TouchableOpacity 
            className="w-8 h-8 bg-red-500 rounded-full items-center justify-center"
            onPress={() => handleDeleteHabit(item.$id, item.title)}
          >
            <Ionicons name="trash-outline" size={16} color="white" />
          </TouchableOpacity>
        </View>

        {/* Section streak et actions */}
        <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
          {/* Streak display */}
          <View className="flex-row items-center">
            <View className="bg-orange-50 px-3 py-2 rounded-lg mr-2">
              <View className="flex-row items-center">
                <Text className="text-2xl mr-1">🔥</Text>
                <Text className="text-lg font-bold text-orange-600">
                  {item.streak}
                </Text>
              </View>
              <Text className="text-xs text-orange-600 font-medium">
                {item.streak === 0 ? 'jours' : item.streak === 1 ? 'jour' : 'jours'}
              </Text>
            </View>

            {/* Reset streak button */}
            {item.streak > 0 && (
              <TouchableOpacity
                className="bg-gray-100 px-3 py-2 rounded-lg"
                onPress={() => handleResetStreak(item.$id, item.title)}
              >
                <Ionicons name="refresh" size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>

          {/* Complete button */}
          <TouchableOpacity
            className={`px-4 py-2 rounded-lg flex-row items-center ${
              completedToday
                ? 'bg-green-500'
                : 'bg-blue-500 active:bg-blue-600'
            }`}
            onPress={() => handleCompleteHabit(item.$id)}
            disabled={completedToday}
          >
            <Ionicons 
              name={completedToday ? "checkmark-circle" : "checkmark-circle-outline"} 
              size={20} 
              color="white" 
            />
            <Text className="text-white font-semibold ml-2">
              {completedToday ? 'Fait !' : 'Compléter'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderHeader = () => {
    const totalStreak = getTotalStreak();
    const activeHabits = getActiveHabits();
    const completedToday = getCompletedToday();

    return (
      <View className="mb-4">
        {/* Barre de statut */}
        <View className="flex-row items-center justify-between mb-4 bg-white p-3 rounded-xl shadow-sm">
          <View className="flex-row items-center">
            <View className={`w-2 h-2 rounded-full mr-2 ${
              isOnline ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <Text className="text-sm font-medium text-gray-700">
              {isOnline ? '🌐 En ligne' : '📴 Hors ligne'}
            </Text>
          </View>
          
          {isSyncing && (
            <View className="flex-row items-center">
              <Ionicons name="sync" size={16} color="#3B82F6" />
              <Text className="text-sm text-blue-500 ml-1">Sync...</Text>
            </View>
          )}
          
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
          <View className="flex-1 bg-orange-50 p-4 rounded-xl mr-2">
            <Text className="text-2xl font-bold text-orange-600">
              🔥 {totalStreak}
            </Text>
            <Text className="text-sm text-orange-600 mt-1">Streak total</Text>
          </View>
          
          <View className="flex-1 bg-green-50 p-4 rounded-xl mr-2">
            <Text className="text-2xl font-bold text-green-600">
              {completedToday.length}
            </Text>
            <Text className="text-sm text-green-600 mt-1">Aujourd'hui</Text>
          </View>
          
          <View className="flex-1 bg-blue-50 p-4 rounded-xl">
            <Text className="text-2xl font-bold text-blue-600">
              {activeHabits.length}
            </Text>
            <Text className="text-sm text-blue-600 mt-1">Actives</Text>
          </View>
        </View>

        {/* Bouton d'ajout */}
        <TouchableOpacity 
          className="bg-blue-500 p-4 rounded-xl flex-row items-center justify-center shadow-md active:bg-blue-600"
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add-circle-outline" size={24} color="white" />
          <Text className="text-white font-bold text-base ml-2">
            Nouvelle habitude
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyList = () => (
    <View className="flex-1 items-center justify-center py-20">
      <Text className="text-6xl mb-4">🎯</Text>
      <Text className="text-gray-400 text-lg font-medium">
        Aucune habitude
      </Text>
      <Text className="text-gray-300 text-sm mt-2 text-center px-8">
        Créez votre première habitude pour commencer à construire votre routine
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 px-4 pt-4">
        <FlatList
          data={habits}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item.$id}
          renderItem={renderHabitItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyList}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3B82F6']}
              tintColor="#3B82F6"
            />
          }
        />

        <AddHabitModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
};

export default HabitsScreen;