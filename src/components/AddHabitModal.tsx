// Enhanced AddHabitModal - Modern & User-Friendly UI
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
  ActivityIndicator,
  Alert,
} from "react-native";
import { useHabitsStore } from "@/stores/habitsStore";
import { useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  HABIT_TEMPLATES,
  generateHabitsFromText,
  type AIHabit,
} from "@/services/habitAI";

interface AddHabitModalProps {
  visible: boolean;
  onClose: () => void;
}

type Frequency = "daily" | "weekly";

const AddHabitModal = ({ visible, onClose }: AddHabitModalProps) => {
  const { user } = useUser();
  const { addHabit, isOnline } = useHabitsStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("daily");

  // AI features
  const [showAI, setShowAI] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [aiPrompt, setAIPrompt] = useState("");
  const [aiSuggestions, setAISuggestions] = useState<AIHabit[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAddHabit = () => {
    if (!title.trim()) {
      Alert.alert("Erreur", "Veuillez entrer un nom pour l'habitude");
      return;
    }

    if (user?.id) {
      addHabit(
        {
          title: title.trim(),
          description: description.trim() || undefined,
          frequency,
        },
        user.id
      );

      resetForm();
      onClose();
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setFrequency("daily");
    setShowAI(false);
    setShowTemplates(false);
    setAIPrompt("");
    setAISuggestions([]);
  };

  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) {
      Alert.alert("Erreur", "Veuillez entrer un objectif");
      return;
    }

    setIsGenerating(true);
    try {
      const suggestions = await generateHabitsFromText(aiPrompt);
      setAISuggestions(suggestions);
    } catch (error) {
      Alert.alert("Erreur", "Impossible de générer des habitudes. Réessayez.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectSuggestion = (habit: AIHabit) => {
    setTitle(habit.title);
    setDescription(habit.description);
    setFrequency(habit.frequency);
    setAISuggestions([]);
    setShowAI(false);
  };

  const handleSelectTemplate = (template: AIHabit) => {
    setTitle(template.title);
    setDescription(template.description);
    setFrequency(template.frequency);
    setShowTemplates(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 bg-black/80 justify-end" onPress={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-[#0a0e1a] rounded-t-3xl border-t-2 border-[#00d4ff]">
              {/* Header */}
              <View className="flex-row items-center justify-between p-6 pb-4 border-b border-[#2d3748]">
                <View className="flex-1">
                  <Text className="text-2xl font-black text-[#e2e8f0]">
                    Nouvelle Habitude 🎯
                  </Text>
                  {!isOnline && (
                    <View className="flex-row items-center mt-2">
                      <View className="w-2 h-2 rounded-full bg-[#f59e0b] mr-2" />
                      <Text className="text-xs text-[#f59e0b] font-semibold">
                        Mode hors ligne
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  onPress={onClose}
                  className="w-10 h-10 bg-[#1a1f2e] rounded-full items-center justify-center"
                >
                  <Ionicons name="close" size={24} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <ScrollView
                className="max-h-[600px]"
                showsVerticalScrollIndicator={false}
              >
                <View className="p-6">
                  {/* Quick Actions */}
                  <View className="flex-row gap-3 mb-6">
                    <TouchableOpacity
                      className="flex-1"
                      onPress={() => {
                        setShowAI(!showAI);
                        setShowTemplates(false);
                      }}
                    >
                      <LinearGradient
                        colors={
                          showAI
                            ? ["#00d4ff", "#0ea5e9"]
                            : ["#00d4ff20", "#0ea5e920"]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="p-4 rounded-2xl flex-row items-center justify-center border border-[#00d4ff40]"
                      >
                        <Ionicons
                          name="sparkles"
                          size={20}
                          color={showAI ? "white" : "#00d4ff"}
                        />
                        <Text
                          className={`font-bold ml-2 ${
                            showAI ? "text-white" : "text-[#00d4ff]"
                          }`}
                        >
                          IA
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="flex-1"
                      onPress={() => {
                        setShowTemplates(!showTemplates);
                        setShowAI(false);
                      }}
                    >
                      <LinearGradient
                        colors={
                          showTemplates
                            ? ["#8b5cf6", "#7c3aed"]
                            : ["#8b5cf620", "#7c3aed20"]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="p-4 rounded-2xl flex-row items-center justify-center border border-[#8b5cf640]"
                      >
                        <Ionicons
                          name="albums-outline"
                          size={20}
                          color={showTemplates ? "white" : "#8b5cf6"}
                        />
                        <Text
                          className={`font-bold ml-2 ${
                            showTemplates ? "text-white" : "text-[#8b5cf6]"
                          }`}
                        >
                          Templates
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>

                  {/* AI Section */}
                  {showAI && (
                    <View className="bg-[#1a1f2e] p-4 rounded-2xl mb-6 border border-[#2d3748]">
                      <Text className="text-[#e2e8f0] font-bold mb-3">
                        ✨ Décrivez votre objectif
                      </Text>
                      <TextInput
                        className="bg-[#0a0e1a] border border-[#2d3748] rounded-xl p-3 text-[#e2e8f0] mb-3 min-h-[80px]"
                        placeholder="Ex: Je veux être en meilleure forme..."
                        placeholderTextColor="#64748b"
                        value={aiPrompt}
                        onChangeText={setAIPrompt}
                        multiline
                      />
                      <TouchableOpacity
                        onPress={handleGenerateWithAI}
                        disabled={isGenerating}
                      >
                        <LinearGradient
                          colors={["#00d4ff", "#0ea5e9"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          className="p-3 rounded-xl flex-row items-center justify-center"
                        >
                          {isGenerating ? (
                            <ActivityIndicator color="white" />
                          ) : (
                            <>
                              <Ionicons name="flash" size={20} color="white" />
                              <Text className="text-white font-bold ml-2">
                                Générer
                              </Text>
                            </>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>

                      {/* AI Suggestions */}
                      {aiSuggestions.length > 0 && (
                        <View className="mt-4">
                          <Text className="text-[#94a3b8] text-xs font-semibold mb-2">
                            SUGGESTIONS IA
                          </Text>
                          {aiSuggestions.map((suggestion, index) => (
                            <TouchableOpacity
                              key={index}
                              className="bg-[#0a0e1a] p-3 rounded-xl mb-2 flex-row items-center border border-[#2d3748]"
                              onPress={() => handleSelectSuggestion(suggestion)}
                            >
                              <Text className="text-2xl mr-3">
                                {suggestion.icon}
                              </Text>
                              <View className="flex-1">
                                <Text className="text-[#e2e8f0] font-bold text-sm mb-1">
                                  {suggestion.title}
                                </Text>
                                <Text className="text-[#94a3b8] text-xs">
                                  {suggestion.description}
                                </Text>
                              </View>
                              <Ionicons
                                name="arrow-forward-circle"
                                size={24}
                                color="#00d4ff"
                              />
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  )}

                  {/* Templates Section */}
                  {showTemplates && (
                    <View className="mb-6">
                      <Text className="text-[#94a3b8] text-xs font-semibold mb-3">
                        TEMPLATES POPULAIRES
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="-mx-6 px-6"
                      >
                        <View className="flex-row gap-3">
                          {HABIT_TEMPLATES.map((template, index) => (
                            <TouchableOpacity
                              key={index}
                              className="bg-[#1a1f2e] p-4 rounded-2xl w-32 border border-[#2d3748]"
                              onPress={() => handleSelectTemplate(template)}
                            >
                              <Text className="text-3xl mb-2 text-center">
                                {template.icon}
                              </Text>
                              <Text
                                className="text-[#e2e8f0] font-bold text-xs text-center mb-1"
                                numberOfLines={2}
                              >
                                {template.title}
                              </Text>
                              <Text className="text-[#64748b] text-xs text-center">
                                {template.frequency === "daily"
                                  ? "📅 Quotidien"
                                  : "📆 Hebdo"}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </ScrollView>
                    </View>
                  )}

                  {/* Title Input */}
                  <View className="mb-4">
                    <Text className="text-[#e2e8f0] font-bold mb-2">
                      Nom de l'habitude *
                    </Text>
                    <TextInput
                      className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl p-4 text-[#e2e8f0] text-base"
                      placeholder="Ex: Faire du sport, Lire 30 min..."
                      placeholderTextColor="#64748b"
                      value={title}
                      onChangeText={setTitle}
                    />
                  </View>

                  {/* Description Input */}
                  <View className="mb-4">
                    <Text className="text-[#e2e8f0] font-bold mb-2">
                      Description (optionnelle)
                    </Text>
                    <TextInput
                      className="bg-[#1a1f2e] border border-[#2d3748] rounded-xl p-4 text-[#e2e8f0] min-h-[80px]"
                      placeholder="Pourquoi cette habitude est importante..."
                      placeholderTextColor="#64748b"
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      textAlignVertical="top"
                    />
                  </View>

                  {/* Frequency Selection */}
                  <View className="mb-6">
                    <Text className="text-[#e2e8f0] font-bold mb-3">
                      Fréquence
                    </Text>
                    <View className="gap-3">
                      <TouchableOpacity
                        className={`p-4 rounded-2xl border-2 flex-row items-center ${
                          frequency === "daily"
                            ? "bg-[#3b82f620] border-[#3b82f6]"
                            : "bg-[#1a1f2e] border-[#2d3748]"
                        }`}
                        onPress={() => setFrequency("daily")}
                      >
                        <View className="w-12 h-12 bg-[#0a0e1a] rounded-full items-center justify-center mr-3">
                          <Text className="text-2xl">📅</Text>
                        </View>
                        <View className="flex-1">
                          <Text
                            className={`font-bold ${
                              frequency === "daily"
                                ? "text-[#3b82f6]"
                                : "text-[#e2e8f0]"
                            }`}
                          >
                            Quotidien
                          </Text>
                          <Text className="text-[#94a3b8] text-xs">
                            Tous les jours
                          </Text>
                        </View>
                        {frequency === "daily" && (
                          <Ionicons
                            name="checkmark-circle"
                            size={24}
                            color="#3b82f6"
                          />
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        className={`p-4 rounded-2xl border-2 flex-row items-center ${
                          frequency === "weekly"
                            ? "bg-[#8b5cf620] border-[#8b5cf6]"
                            : "bg-[#1a1f2e] border-[#2d3748]"
                        }`}
                        onPress={() => setFrequency("weekly")}
                      >
                        <View className="w-12 h-12 bg-[#0a0e1a] rounded-full items-center justify-center mr-3">
                          <Text className="text-2xl">📆</Text>
                        </View>
                        <View className="flex-1">
                          <Text
                            className={`font-bold ${
                              frequency === "weekly"
                                ? "text-[#8b5cf6]"
                                : "text-[#e2e8f0]"
                            }`}
                          >
                            Hebdomadaire
                          </Text>
                          <Text className="text-[#94a3b8] text-xs">
                            Toutes les semaines
                          </Text>
                        </View>
                        {frequency === "weekly" && (
                          <Ionicons
                            name="checkmark-circle"
                            size={24}
                            color="#8b5cf6"
                          />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Info Box */}
                  <View className="bg-[#fbbf2415] p-4 rounded-2xl flex-row mb-6 border border-[#fbbf2430]">
                    <Text className="text-2xl mr-3">🔥</Text>
                    <View className="flex-1">
                      <Text className="text-[#fbbf24] font-bold text-sm mb-1">
                        Construisez votre streak !
                      </Text>
                      <Text className="text-[#fbbf24] text-xs">
                        Complétez votre habitude chaque jour pour augmenter
                        votre streak.
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons */}
                  <View className="flex-row gap-3">
                    <TouchableOpacity
                      className="flex-1 bg-[#1a1f2e] p-4 rounded-2xl items-center border border-[#2d3748]"
                      onPress={onClose}
                    >
                      <Text className="text-[#94a3b8] font-bold">Annuler</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="flex-1"
                      onPress={handleAddHabit}
                      disabled={!title.trim()}
                    >
                      <LinearGradient
                        colors={
                          title.trim()
                            ? ["#00d4ff", "#0ea5e9"]
                            : ["#2d3748", "#2d3748"]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="p-4 rounded-2xl flex-row items-center justify-center"
                      >
                        <Ionicons name="add-circle" size={20} color="white" />
                        <Text className="text-white font-bold ml-2">Créer</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
};

export default AddHabitModal;
