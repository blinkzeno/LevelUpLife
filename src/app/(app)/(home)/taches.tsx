// screens/TasksScreen.tsx
import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  TextInput,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useTasksStore } from "@/stores/tasksStore";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@clerk/clerk-expo";
import AddTaskModal from "@/components/AddTaskModal";
import { Ionicons } from "@expo/vector-icons";
import {
  generateScheduleFromText,
  generateScheduleFromAudio,
} from "@/services/gemini";
import VoiceInput from "@/components/VoiceInput";
import { Calendar, LocaleConfig } from "react-native-calendars";

// Configure French locale
LocaleConfig.locales["fr"] = {
  monthNames: [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ],
  monthNamesShort: [
    "Janv.",
    "Févr.",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juil.",
    "Août",
    "Sept.",
    "Oct.",
    "Nov.",
    "Déc.",
  ],
  dayNames: [
    "Dimanche",
    "Lundi",
    "Mardi",
    "Mercredi",
    "Jeudi",
    "Vendredi",
    "Samedi",
  ],
  dayNamesShort: ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."],
  today: "Aujourd'hui",
};
LocaleConfig.defaultLocale = "fr";

const getTaskColor = (type?: string) => {
  switch (type?.toLowerCase()) {
    case "work":
    case "travail":
      return "bg-purple-500";
    case "health":
    case "santé":
    case "sport":
      return "bg-green-500";
    case "learning":
    case "apprentissage":
    case "etude":
      return "bg-blue-500";
    case "social":
    case "loisir":
      return "bg-yellow-500";
    default:
      return "bg-slate-500";
  }
};

const TasksScreen = () => {
  const { user } = useUser();
  const [modalVisible, setModalVisible] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isFabOpen, setIsFabOpen] = useState(false);

  // View Mode State
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // AI Generation State
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const {
    tasks,
    addTask,
    moveTask,
    deleteTask,
    loadTasksFromRemote,
    isOnline,
    isSyncing,
    syncPendingOperations,
  } = useTasksStore();

  useEffect(() => {
    const loadTasks = async () => {
      if (user?.id) {
        await loadTasksFromRemote(user.id);
      }
    };
    loadTasks();
  }, [user?.id]);

  const onRefresh = async () => {
    if (!user?.id) return;
    setRefreshing(true);
    if (isOnline) {
      await syncPendingOperations(user.id);
      await loadTasksFromRemote(user.id);
    }
    setRefreshing(false);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !user?.id) return;

    setIsGenerating(true);
    try {
      const generatedTasks = await generateScheduleFromText(prompt);
      processGeneratedTasks(generatedTasks);
      setPrompt("");
      setAiModalVisible(false);
      Alert.alert("Succès", `${generatedTasks.length} tâches générées !`);
    } catch (error) {
      Alert.alert("Erreur", "Impossible de générer les tâches.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleVoiceResult = async (uri: string) => {
    if (!user?.id) return;
    setIsGenerating(true);
    try {
      const generatedTasks = await generateScheduleFromAudio(uri);
      processGeneratedTasks(generatedTasks);
      setAiModalVisible(false);
      Alert.alert("Succès", `${generatedTasks.length} tâches générées !`);
    } catch (error) {
      Alert.alert("Erreur", "Impossible de traiter la commande vocale.");
    } finally {
      setIsGenerating(false);
    }
  };

  const processGeneratedTasks = (newTasks: any[]) => {
    if (!user?.id) return;
    newTasks.forEach((t) => {
      addTask(
        {
          title: t.title,
          description:
            t.description || `Horaire: ${t.startTime} - ${t.endTime}`,
          status: "todo",
          startTime: t.startTime,
          endTime: t.endTime,
          date: selectedDate,
          type: t.type,
        },
        user.id
      );
    });
  };

  const handleDeleteTask = (taskId: string) => {
    Alert.alert("Supprimer", "Confirmer la suppression ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: () => user?.id && deleteTask(taskId, user.id),
      },
    ]);
  };

  const toggleTaskStatus = (taskId: string, currentStatus: string) => {
    if (user?.id) {
      moveTask(taskId, currentStatus === "done" ? "todo" : "done", user.id);
    }
  };

  const changeDate = (days: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + days);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  // Filter tasks by selected date and sort by time
  const filteredTasks = tasks
    .filter((t) => t.date === selectedDate)
    .sort((a, b) => {
      if (!a.startTime || !b.startTime) return 0;
      return a.startTime.localeCompare(b.startTime);
    });

  // Marked dates
  const markedDates = tasks.reduce((acc, task) => {
    if (task.date) acc[task.date] = { marked: true, dotColor: "#3b82f6" };
    return acc;
  }, {} as any);

  markedDates[selectedDate] = {
    ...markedDates[selectedDate],
    selected: true,
    selectedColor: "#3b82f6",
  };

  const renderTaskItem = ({ item }: { item: any }) => {
    const colorBar = getTaskColor(item.type);

    return (
      <View className="flex-row mb-3 bg-slate-800 rounded-xl overflow-hidden">
        <View className={`w-2 ${colorBar}`} />
        <View className="flex-1 p-3">
          <View className="flex-row justify-between items-start">
            <View className="flex-1">
              <Text
                className={`text-lg font-bold ${
                  item.status === "done"
                    ? "text-slate-500 line-through"
                    : "text-white"
                }`}
              >
                {item.title}
              </Text>
              {item.startTime && (
                <Text className="text-slate-400 text-sm mt-1">
                  {item.startTime} - {item.endTime}
                </Text>
              )}
              {item.description && (
                <Text className="text-slate-500 text-xs mt-1" numberOfLines={2}>
                  {item.description}
                </Text>
              )}
              {item.type && (
                <Text className="text-slate-600 text-xs mt-1 capitalize">
                  📌 {item.type}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => toggleTaskStatus(item.$id, item.status)}
            >
              <View
                className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                  item.status === "done"
                    ? "bg-green-500 border-green-500"
                    : "border-slate-500"
                }`}
              >
                {item.status === "done" && (
                  <Text className="text-white text-xs">✓</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => handleDeleteTask(item.$id)}
          className="bg-red-500/20 justify-center px-3"
        >
          <Text className="text-red-500 font-bold">X</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderHeader = () => (
    <View className="mb-6">
      <View className="flex-row justify-between items-center mb-6">
        <View className="flex-1">
          <Text className="text-2xl font-bold text-white">Mes Tâches</Text>
          <View className="flex-row items-center mt-1">
            <TouchableOpacity onPress={() => changeDate(-1)} className="p-1">
              <Ionicons name="chevron-back" size={20} color="#94a3b8" />
            </TouchableOpacity>
            <Text className="text-slate-400 text-base font-medium mx-2 capitalize">
              {new Date(selectedDate).toLocaleDateString("fr-FR", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </Text>
            <TouchableOpacity onPress={() => changeDate(1)} className="p-1">
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* View Toggle */}
        <View className="flex-row bg-slate-800 rounded-xl p-1">
          <TouchableOpacity
            onPress={() => setViewMode("list")}
            className={`px-4 py-2 rounded-lg ${
              viewMode === "list" ? "bg-slate-700" : ""
            }`}
          >
            <Ionicons
              name="list"
              size={20}
              color={viewMode === "list" ? "#3b82f6" : "#64748b"}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode("calendar")}
            className={`px-4 py-2 rounded-lg ${
              viewMode === "calendar" ? "bg-slate-700" : ""
            }`}
          >
            <Ionicons
              name="calendar"
              size={20}
              color={viewMode === "calendar" ? "#3b82f6" : "#64748b"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Sync Status (Subtle) */}
      {!isOnline && (
        <View className="bg-red-500/20 px-3 py-1 rounded-full self-start mb-4 flex-row items-center">
          <View className="w-2 h-2 rounded-full bg-red-500 mr-2" />
          <Text className="text-xs text-red-400 font-medium">Hors ligne</Text>
        </View>
      )}

      {viewMode === "calendar" && (
        <View className="rounded-xl overflow-hidden mb-4">
          <Calendar
            current={selectedDate}
            onDayPress={(day: any) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            theme={{
              backgroundColor: "#0f172a",
              calendarBackground: "#1e293b",
              textSectionTitleColor: "#94a3b8",
              selectedDayBackgroundColor: "#3b82f6",
              selectedDayTextColor: "#ffffff",
              todayTextColor: "#3b82f6",
              dayTextColor: "#e2e8f0",
              textDisabledColor: "#475569",
              monthTextColor: "#ffffff",
              arrowColor: "#3b82f6",
            }}
          />
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-900" edges={["top"]}>
      <View className="flex-1 px-4 pt-2">
        <FlatList
          data={filteredTasks}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item.$id}
          renderItem={renderTaskItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={
            <View className="items-center justify-center py-20">
              <Ionicons name="clipboard-outline" size={64} color="#475569" />
              <Text className="text-slate-400 text-lg font-medium mt-4">
                Aucune tâche pour ce jour
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(true)}
                className="mt-4 bg-blue-600 px-4 py-2 rounded-lg"
              >
                <Text className="text-white font-medium">Créer une tâche</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3b82f6"
            />
          }
        />

        {/* Combined FAB */}
        <View className="absolute bottom-6 right-6 items-end">
          {isFabOpen && (
            <View className="mb-4 space-y-4 items-end">
              <TouchableOpacity
                onPress={() => {
                  setAiModalVisible(true);
                  setIsFabOpen(false);
                }}
                className="flex-row items-center mb-3"
              >
                <View className="bg-slate-800 px-3 py-1 rounded-lg shadow-sm mr-3">
                  <Text className="font-medium text-white">
                    Générer avec IA
                  </Text>
                </View>
                <View className="w-12 h-12 bg-slate-800 rounded-full items-center justify-center shadow-lg border border-blue-500">
                  <Ionicons name="sparkles" size={24} color="#3b82f6" />
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setModalVisible(true);
                  setIsFabOpen(false);
                }}
                className="flex-row items-center"
              >
                <View className="bg-slate-800 px-3 py-1 rounded-lg shadow-sm mr-3">
                  <Text className="font-medium text-white">Nouvelle tâche</Text>
                </View>
                <View className="w-12 h-12 bg-blue-600 rounded-full items-center justify-center shadow-lg">
                  <Ionicons name="create" size={24} color="white" />
                </View>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            onPress={() => setIsFabOpen(!isFabOpen)}
            className={`w-16 h-16 rounded-full items-center justify-center shadow-xl ${
              isFabOpen ? "bg-slate-700" : "bg-blue-600"
            }`}
          >
            <Ionicons
              name={isFabOpen ? "close" : "add"}
              size={32}
              color="white"
            />
          </TouchableOpacity>
        </View>

        {/* AI Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={aiModalVisible}
          onRequestClose={() => setAiModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            className="flex-1 justify-end bg-black/70"
          >
            <View className="bg-slate-800 rounded-t-3xl p-6">
              <View className="flex-row justify-between items-center mb-6">
                <View className="flex-row items-center">
                  <View className="w-8 h-8 rounded-full bg-blue-500/20 items-center justify-center mr-3">
                    <Ionicons name="sparkles" size={16} color="#3b82f6" />
                  </View>
                  <Text className="text-xl font-bold text-white">
                    Assistant IA
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setAiModalVisible(false)}>
                  <Ionicons name="close-circle" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <Text className="text-slate-400 mb-4">
                Décrivez votre journée ou dictez vos tâches pour le{" "}
                <Text className="font-bold text-white">{selectedDate}</Text>.
              </Text>

              <TextInput
                className="bg-slate-700 text-white p-4 rounded-xl mb-4 min-h-[100px] text-base"
                placeholder="Ex: Réunion à 14h, Sport à 18h..."
                placeholderTextColor="#94a3b8"
                value={prompt}
                onChangeText={setPrompt}
                multiline
                textAlignVertical="top"
              />

              <View className="flex-row justify-between items-center">
                <VoiceInput
                  onRecordingComplete={handleVoiceResult}
                  isProcessing={isGenerating}
                />

                <TouchableOpacity
                  onPress={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className={`flex-1 ml-4 py-4 rounded-xl flex-row items-center justify-center ${
                    isGenerating || !prompt.trim()
                      ? "bg-slate-600"
                      : "bg-blue-600"
                  }`}
                >
                  {isGenerating ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Text className="text-white font-bold text-base">
                        Générer
                      </Text>
                      <Ionicons
                        name="arrow-forward"
                        size={20}
                        color="white"
                        style={{ marginLeft: 8 }}
                      />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <AddTaskModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
        />
      </View>
    </SafeAreaView>
  );
};

export default TasksScreen;
