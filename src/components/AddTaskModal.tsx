// components/AddTaskModal.tsx
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
} from "react-native";
import { useTasksStore } from "@/stores/tasksStore";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
}

type TaskStatus = "todo" | "in-progress" | "done";

const AddTaskModal = ({ visible, onClose }: AddTaskModalProps) => {
  const { user } = useUser();
  const { addTask, isOnline } = useTasksStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("todo");

  const handleAddTask = () => {
    if (!title.trim()) {
      return;
    }

    if (user?.id) {
      addTask(
        {
          title: title.trim(),
          description: description.trim() || undefined,
          status,
        },
        user.id
      );

      // Réinitialiser le formulaire
      setTitle("");
      setDescription("");
      setStatus("todo");
      onClose();
    }
  };

  const statusOptions = [
    { value: "todo", label: "À faire", icon: "📝", color: "gray" },
    { value: "in-progress", label: "En cours", icon: "⏳", color: "blue" },
    { value: "done", label: "Terminé", icon: "✅", color: "green" },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/50 justify-end" onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-white rounded-t-3xl p-6 min-h-[500px]">
              {/* Header */}
              <View className="flex-row items-center justify-between mb-6">
                <View>
                  <Text className="text-2xl font-bold text-gray-800">
                    Nouvelle tâche
                  </Text>
                  {!isOnline && (
                    <View className="flex-row items-center mt-1">
                      <View className="w-2 h-2 rounded-full bg-amber-500 mr-2" />
                      <Text className="text-xs text-amber-600">
                        Sera synchronisée plus tard
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  onPress={onClose}
                  className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
                >
                  <Ionicons name="close" size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Titre */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">
                    Titre *
                  </Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-800"
                    placeholder="Entrez le titre de la tâche"
                    placeholderTextColor="#9CA3AF"
                    value={title}
                    onChangeText={setTitle}
                    autoFocus
                  />
                </View>

                {/* Description */}
                <View className="mb-4">
                  <Text className="text-sm font-semibold text-gray-700 mb-2">
                    Description (optionnelle)
                  </Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-800"
                    placeholder="Ajoutez des détails..."
                    placeholderTextColor="#9CA3AF"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                {/* Statut */}
                <View className="mb-6">
                  <Text className="text-sm font-semibold text-gray-700 mb-3">
                    Statut
                  </Text>
                  <View className="flex-row gap-2">
                    {statusOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        className={`flex-1 p-3 rounded-xl border-2 ${
                          status === option.value
                            ? option.color === "gray"
                              ? "bg-gray-50 border-gray-400"
                              : option.color === "blue"
                              ? "bg-blue-50 border-blue-400"
                              : "bg-green-50 border-green-400"
                            : "bg-white border-gray-200"
                        }`}
                        onPress={() => setStatus(option.value as TaskStatus)}
                      >
                        <Text className="text-center text-2xl mb-1">
                          {option.icon}
                        </Text>
                        <Text
                          className={`text-center text-xs font-medium ${
                            status === option.value
                              ? option.color === "gray"
                                ? "text-gray-700"
                                : option.color === "blue"
                                ? "text-blue-700"
                                : "text-green-700"
                              : "text-gray-500"
                          }`}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Boutons d'action */}
                <View className="flex-row gap-3">
                  <TouchableOpacity
                    className="flex-1 bg-gray-100 p-4 rounded-xl items-center active:bg-gray-200"
                    onPress={onClose}
                  >
                    <Text className="text-gray-700 font-semibold text-base">
                      Annuler
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className={`flex-1 p-4 rounded-xl items-center ${
                      title.trim()
                        ? "bg-blue-500 active:bg-blue-600"
                        : "bg-gray-300"
                    }`}
                    onPress={handleAddTask}
                    disabled={!title.trim()}
                  >
                    <View className="flex-row items-center">
                      <Ionicons
                        name="add-circle-outline"
                        size={20}
                        color="white"
                      />
                      <Text className="text-white font-semibold text-base ml-2">
                        Ajouter
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};

export default AddTaskModal;
