// Habits Screen - Enhanced with Detail Modal, Swipe Actions, Filters & Streak Calendar
import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from "react-native";
import { useHabitsStore } from "@/stores/habitsStore";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Swipeable } from "react-native-gesture-handler/";
import AddHabitModal from "@/components/AddHabitModal";
import HabitDetailModal from "@/components/HabitDetailModal";

type FilterType = "all" | "completed" | "pending";

const HabitsScreen = () => {
  const { user } = useUser();
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedHabit, setSelectedHabit] = useState<any>(null);

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
          },
        },
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
          },
        },
      ]
    );
  };

  const isCompletedToday = (habit: any) => {
    if (!habit.lastCompleted) return false;
    const today = new Date().setHours(0, 0, 0, 0);
    const lastCompletedDay = new Date(habit.lastCompleted).setHours(0, 0, 0, 0);
    return lastCompletedDay === today;
  };

  // Get last 7 days streak data
  const getStreakCalendar = (habit: any) => {
    const days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayTimestamp = date.setHours(0, 0, 0, 0);

      const lastCompleted = habit.lastCompleted
        ? new Date(habit.lastCompleted)
        : null;
      const lastCompletedDay = lastCompleted
        ? lastCompleted.setHours(0, 0, 0, 0)
        : null;

      // Simple logic: if streak > 0 and within streak range
      const daysAgo = i;
      const isCompleted = habit.streak > daysAgo;

      days.push({
        day: date
          .toLocaleDateString("fr-FR", { weekday: "short" })[0]
          .toUpperCase(),
        completed: isCompleted,
      });
    }

    return days;
  };

  // Filter habits
  const filteredHabits = habits.filter((habit) => {
    if (filter === "all") return true;
    if (filter === "completed") return isCompletedToday(habit);
    if (filter === "pending") return !isCompletedToday(habit);
    return true;
  });

  // Swipe actions
  const renderRightActions = (habitId: string, habitTitle: string) => (
    <TouchableOpacity
      className="bg-[#ef4444] justify-center items-center px-6 rounded-r-2xl ml-2"
      onPress={() => handleDeleteHabit(habitId, habitTitle)}
    >
      <Ionicons name="trash" size={24} color="white" />
      <Text className="text-white font-bold text-xs mt-1">Supprimer</Text>
    </TouchableOpacity>
  );

  const renderLeftActions = (habitId: string) => (
    <TouchableOpacity
      className="bg-[#10b981] justify-center items-center px-6 rounded-l-2xl mr-2"
      onPress={() => handleCompleteHabit(habitId)}
    >
      <Ionicons name="checkmark-circle" size={24} color="white" />
      <Text className="text-white font-bold text-xs mt-1">Compléter</Text>
    </TouchableOpacity>
  );

  const renderHabitItem = ({ item }: { item: any }) => {
    const completedToday = isCompletedToday(item);
    const streakCalendar = getStreakCalendar(item);

    return (
      <Swipeable
        renderRightActions={() => renderRightActions(item.$id, item.title)}
        renderLeftActions={() =>
          !completedToday ? renderLeftActions(item.$id) : null
        }
        overshootLeft={false}
        overshootRight={false}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setSelectedHabit(item)}
        >
          <View className="mb-3">
            <LinearGradient
              colors={
                completedToday
                  ? ["#10b98120", "#10b98110"]
                  : ["#1a1f2e", "#1a1f2e"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="rounded-2xl overflow-hidden"
            >
              <View className="p-4 border border-[#2d3748] rounded-2xl">
                {/* Header */}
                <View className="flex-row items-start justify-between mb-3">
                  <View className="flex-1">
                    <View className="flex-row items-center mb-2">
                      <Text
                        className={`text-lg font-bold flex-1 ${
                          completedToday ? "text-[#10b981]" : "text-[#e2e8f0]"
                        }`}
                      >
                        {item.title}
                      </Text>
                      {completedToday && (
                        <View className="bg-[#10b98130] px-2 py-1 rounded-full">
                          <Text className="text-[#10b981] text-xs font-bold">
                            ✓ Fait
                          </Text>
                        </View>
                      )}
                      <TouchableOpacity
                        className="ml-2 w-7 h-7 bg-[#00d4ff20] rounded-full items-center justify-center"
                        onPress={() => setSelectedHabit(item)}
                      >
                        <Ionicons
                          name="information-circle"
                          size={16}
                          color="#00d4ff"
                        />
                      </TouchableOpacity>
                    </View>

                    {item.description && (
                      <Text
                        className="text-sm text-[#94a3b8] mb-3"
                        numberOfLines={2}
                      >
                        {item.description}
                      </Text>
                    )}

                    {/* Frequency badge */}
                    <View
                      className={`self-start px-3 py-1.5 rounded-full ${
                        item.frequency === "daily"
                          ? "bg-[#3b82f630]"
                          : "bg-[#8b5cf630]"
                      }`}
                    >
                      <Text
                        className={`text-xs font-semibold ${
                          item.frequency === "daily"
                            ? "text-[#3b82f6]"
                            : "text-[#8b5cf6]"
                        }`}
                      >
                        {item.frequency === "daily"
                          ? "📅 Quotidien"
                          : "📆 Hebdomadaire"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Streak Calendar - 7 days */}
                <View className="flex-row justify-between mb-3 px-1">
                  {streakCalendar.map((day, index) => (
                    <View key={index} className="items-center">
                      <Text className="text-[#64748b] text-xs mb-1">
                        {day.day}
                      </Text>
                      <View
                        className={`w-8 h-8 rounded-full items-center justify-center ${
                          day.completed ? "bg-[#10b981]" : "bg-[#1e293b]"
                        }`}
                      >
                        {day.completed && (
                          <Ionicons name="checkmark" size={16} color="white" />
                        )}
                      </View>
                    </View>
                  ))}
                </View>

                {/* Footer - Streak and Complete */}
                <View className="flex-row items-center justify-between pt-3 border-t border-[#2d3748]">
                  {/* Streak */}
                  <View className="flex-row items-center gap-2">
                    <LinearGradient
                      colors={["#fbbf24", "#f59e0b"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      className="px-3 py-2 rounded-xl"
                    >
                      <View className="flex-row items-center">
                        <Text className="text-2xl mr-1">🔥</Text>
                        <Text className="text-xl font-black text-white">
                          {item.streak}
                        </Text>
                      </View>
                    </LinearGradient>

                    {item.streak > 0 && (
                      <TouchableOpacity
                        className="w-9 h-9 bg-[#1e293b] rounded-full items-center justify-center"
                        onPress={() => handleResetStreak(item.$id, item.title)}
                      >
                        <Ionicons name="refresh" size={16} color="#94a3b8" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Complete button */}
                  <TouchableOpacity
                    onPress={() => handleCompleteHabit(item.$id)}
                    disabled={completedToday}
                  >
                    <LinearGradient
                      colors={
                        completedToday
                          ? ["#10b981", "#059669"]
                          : ["#3b82f6", "#2563eb"]
                      }
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      className="px-5 py-2.5 rounded-xl flex-row items-center"
                    >
                      <Ionicons
                        name={
                          completedToday
                            ? "checkmark-circle"
                            : "checkmark-circle-outline"
                        }
                        size={20}
                        color="white"
                      />
                      <Text className="text-white font-bold ml-2">
                        {completedToday ? "Fait !" : "Compléter"}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const renderHeader = () => {
    const totalStreak = getTotalStreak();
    const activeHabits = getActiveHabits();
    const completedToday = getCompletedToday();

    return (
      <View className="mb-6">
        {/* Title */}
        <View className="mb-6">
          <Text className="text-3xl font-black text-[#e2e8f0] mb-2">
            Mes Habitudes 🎯
          </Text>
          <Text className="text-sm text-[#94a3b8]">
            Construisez votre routine quotidienne
          </Text>
        </View>

        {/* Status bar */}
        {(isSyncing || pendingOperations.length > 0 || !isOnline) && (
          <View className="flex-row items-center gap-2 mb-4 bg-[#1a1f2e] p-3 rounded-xl border border-[#2d3748]">
            {!isOnline && (
              <View className="flex-row items-center flex-1">
                <View className="w-2 h-2 rounded-full bg-[#ef4444] mr-2" />
                <Text className="text-sm font-medium text-[#ef4444]">
                  Hors ligne
                </Text>
              </View>
            )}

            {isSyncing && (
              <View className="flex-row items-center">
                <Ionicons name="sync" size={14} color="#3B82F6" />
                <Text className="text-sm text-[#3b82f6] ml-1">Sync...</Text>
              </View>
            )}

            {pendingOperations.length > 0 && (
              <View className="flex-row items-center bg-[#fbbf2420] px-2 py-1 rounded-full">
                <Ionicons name="time-outline" size={12} color="#F59E0B" />
                <Text className="text-xs text-[#f59e0b] ml-1 font-semibold">
                  {pendingOperations.length}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Statistics Cards */}
        <View className="flex-row gap-3 mb-4">
          <LinearGradient
            colors={["#fbbf2420", "#f59e0b20"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="flex-1 p-4 rounded-2xl border border-[#fbbf2440]"
          >
            <Text className="text-3xl font-black text-[#fbbf24] mb-1">
              {totalStreak}
            </Text>
            <Text className="text-xs text-[#fbbf24] font-semibold">
              🔥 Streak Total
            </Text>
          </LinearGradient>

          <LinearGradient
            colors={["#10b98120", "#05966920"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="flex-1 p-4 rounded-2xl border border-[#10b98140]"
          >
            <Text className="text-3xl font-black text-[#10b981] mb-1">
              {completedToday.length}
            </Text>
            <Text className="text-xs text-[#10b981] font-semibold">
              ✅ Aujourd'hui
            </Text>
          </LinearGradient>

          <LinearGradient
            colors={["#3b82f620", "#2563eb20"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="flex-1 p-4 rounded-2xl border border-[#3b82f640]"
          >
            <Text className="text-3xl font-black text-[#3b82f6] mb-1">
              {activeHabits.length}
            </Text>
            <Text className="text-xs text-[#3b82f6] font-semibold">
              ⚡ Actives
            </Text>
          </LinearGradient>
        </View>

        {/* Filters */}
        <View className="flex-row gap-2 mb-4">
          <TouchableOpacity
            className={`flex-1 p-3 rounded-xl border ${
              filter === "all"
                ? "bg-[#00d4ff20] border-[#00d4ff]"
                : "bg-[#1a1f2e] border-[#2d3748]"
            }`}
            onPress={() => setFilter("all")}
          >
            <Text
              className={`text-center font-bold text-sm ${
                filter === "all" ? "text-[#00d4ff]" : "text-[#94a3b8]"
              }`}
            >
              Toutes ({habits.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 p-3 rounded-xl border ${
              filter === "completed"
                ? "bg-[#10b98120] border-[#10b981]"
                : "bg-[#1a1f2e] border-[#2d3748]"
            }`}
            onPress={() => setFilter("completed")}
          >
            <Text
              className={`text-center font-bold text-sm ${
                filter === "completed" ? "text-[#10b981]" : "text-[#94a3b8]"
              }`}
            >
              Faites ({completedToday.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-1 p-3 rounded-xl border ${
              filter === "pending"
                ? "bg-[#f59e0b20] border-[#f59e0b]"
                : "bg-[#1a1f2e] border-[#2d3748]"
            }`}
            onPress={() => setFilter("pending")}
          >
            <Text
              className={`text-center font-bold text-sm ${
                filter === "pending" ? "text-[#f59e0b]" : "text-[#94a3b8]"
              }`}
            >
              À faire ({habits.length - completedToday.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Add button */}
        <TouchableOpacity
          onPress={() => setModalVisible(true)}
          className="mb-4"
        >
          <LinearGradient
            colors={["#00d4ff", "#0ea5e9"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="p-4 rounded-2xl flex-row items-center justify-center"
          >
            <Ionicons name="add-circle" size={24} color="white" />
            <Text className="text-white font-black text-base ml-2">
              Nouvelle Habitude
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Swipe hint */}
        {habits.length > 0 && (
          <View className="bg-[#1a1f2e] p-3 rounded-xl border border-[#2d3748] mb-4">
            <Text className="text-[#94a3b8] text-xs text-center">
              💡 Glissez à gauche pour compléter, à droite pour supprimer •
              Tapez pour voir les détails
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderEmptyList = () => (
    <View className="flex-1 items-center justify-center py-20">
      <View className="w-24 h-24 bg-[#1a1f2e] rounded-full items-center justify-center mb-4 border-2 border-[#2d3748]">
        <Text className="text-5xl">🎯</Text>
      </View>
      <Text className="text-[#e2e8f0] text-xl font-bold mb-2">
        {filter === "all"
          ? "Aucune habitude"
          : "Aucune habitude dans ce filtre"}
      </Text>
      <Text className="text-[#64748b] text-sm text-center px-8 mb-6">
        {filter === "all"
          ? "Créez votre première habitude pour commencer"
          : "Changez de filtre pour voir vos autres habitudes"}
      </Text>
      {filter === "all" && (
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <LinearGradient
            colors={["#00d4ff", "#0ea5e9"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="px-6 py-3 rounded-xl flex-row items-center"
          >
            <Ionicons name="add-circle" size={20} color="white" />
            <Text className="text-white font-bold ml-2">
              Créer une habitude
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#0a0e1a]" edges={["top"]}>
      <View className="flex-1">
        <FlatList
          data={filteredHabits}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item.$id}
          renderItem={renderHabitItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyList}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 16,
            paddingBottom: 100,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#00d4ff"]}
              tintColor="#00d4ff"
            />
          }
        />

        <AddHabitModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
        />

        <HabitDetailModal
          visible={!!selectedHabit}
          onClose={() => setSelectedHabit(null)}
          habit={selectedHabit}
        />
      </View>
    </SafeAreaView>
  );
};

export default HabitsScreen;
