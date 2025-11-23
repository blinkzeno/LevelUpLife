// Habit Detail Modal - Statistics & Milestones
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef } from "react";
import ConfettiCannon from "react-native-confetti-cannon";

interface HabitDetailModalProps {
  visible: boolean;
  onClose: () => void;
  habit: any;
}

const MILESTONES = [
  { days: 7, emoji: "🔥", label: "Semaine", color: "#f59e0b" },
  { days: 30, emoji: "⭐", label: "Mois", color: "#3b82f6" },
  { days: 100, emoji: "💎", label: "Centenaire", color: "#8b5cf6" },
  { days: 365, emoji: "👑", label: "Année", color: "#fbbf24" },
];

const HabitDetailModal = ({
  visible,
  onClose,
  habit,
}: HabitDetailModalProps) => {
  const confettiRef = useRef<any>(null);
  const screenWidth = Dimensions.get("window").width;

  useEffect(() => {
    if (visible && habit?.streak > 0) {
      // Check if just reached a milestone
      const milestone = MILESTONES.find((m) => m.days === habit.streak);
      if (milestone && confettiRef.current) {
        setTimeout(() => confettiRef.current?.start(), 300);
      }
    }
  }, [visible, habit?.streak]);

  if (!habit) return null;

  // Calculate completion rate (mock data - would need real history)
  const completionRate = Math.min(100, (habit.streak / 30) * 100);
  const bestStreak = habit.streak; // Would track separately in real app

  // Get achieved milestones
  const achievedMilestones = MILESTONES.filter((m) => habit.streak >= m.days);
  const nextMilestone = MILESTONES.find((m) => habit.streak < m.days);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/80 justify-end">
        <View className="bg-[#0a0e1a] rounded-t-3xl border-t-2 border-[#00d4ff] max-h-[85%]">
          {/* Header */}
          <View className="flex-row items-center justify-between p-6 pb-4 border-b border-[#2d3748]">
            <View className="flex-1 mr-4">
              <Text className="text-2xl font-black text-[#e2e8f0] mb-1">
                {habit.title}
              </Text>
              {habit.description && (
                <Text className="text-sm text-[#94a3b8]">
                  {habit.description}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-10 h-10 bg-[#1a1f2e] rounded-full items-center justify-center"
            >
              <Ionicons name="close" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            <View className="p-6">
              {/* Current Streak - Big Display */}
              <LinearGradient
                colors={["#fbbf2430", "#f59e0b30"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="p-6 rounded-2xl mb-6 border border-[#fbbf2440] items-center"
              >
                <Text className="text-6xl mb-2">🔥</Text>
                <Text className="text-5xl font-black text-[#fbbf24] mb-2">
                  {habit.streak}
                </Text>
                <Text className="text-[#fbbf24] font-bold">
                  {habit.streak === 0
                    ? "jours"
                    : habit.streak === 1
                    ? "jour de streak"
                    : "jours de streak"}
                </Text>
              </LinearGradient>

              {/* Statistics Grid */}
              <View className="flex-row gap-3 mb-6">
                <View className="flex-1 bg-[#1a1f2e] p-4 rounded-2xl border border-[#2d3748]">
                  <Text className="text-3xl font-black text-[#10b981] mb-1">
                    {Math.round(completionRate)}%
                  </Text>
                  <Text className="text-xs text-[#94a3b8]">
                    Taux de réussite
                  </Text>
                </View>

                <View className="flex-1 bg-[#1a1f2e] p-4 rounded-2xl border border-[#2d3748]">
                  <Text className="text-3xl font-black text-[#3b82f6] mb-1">
                    {bestStreak}
                  </Text>
                  <Text className="text-xs text-[#94a3b8]">
                    Meilleur streak
                  </Text>
                </View>
              </View>

              {/* Milestones */}
              <View className="mb-6">
                <Text className="text-[#e2e8f0] font-bold text-lg mb-4">
                  🏆 Milestones
                </Text>

                {/* Achieved Milestones */}
                {achievedMilestones.length > 0 && (
                  <View className="mb-4">
                    <Text className="text-[#94a3b8] text-xs font-semibold mb-2">
                      DÉBLOQUÉS
                    </Text>
                    <View className="flex-row flex-wrap gap-3">
                      {achievedMilestones.map((milestone, index) => (
                        <LinearGradient
                          key={index}
                          colors={[
                            `${milestone.color}40`,
                            `${milestone.color}20`,
                          ]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          className="px-4 py-3 rounded-xl border items-center"
                          style={{ borderColor: `${milestone.color}60` }}
                        >
                          <Text className="text-3xl mb-1">
                            {milestone.emoji}
                          </Text>
                          <Text className="text-white font-bold text-xs">
                            {milestone.label}
                          </Text>
                          <Text className="text-white text-xs opacity-70">
                            {milestone.days} jours
                          </Text>
                        </LinearGradient>
                      ))}
                    </View>
                  </View>
                )}

                {/* Next Milestone */}
                {nextMilestone && (
                  <View>
                    <Text className="text-[#94a3b8] text-xs font-semibold mb-2">
                      PROCHAIN OBJECTIF
                    </Text>
                    <View className="bg-[#1a1f2e] p-4 rounded-2xl border border-[#2d3748]">
                      <View className="flex-row items-center justify-between mb-3">
                        <View className="flex-row items-center">
                          <Text className="text-3xl mr-3">
                            {nextMilestone.emoji}
                          </Text>
                          <View>
                            <Text className="text-[#e2e8f0] font-bold">
                              {nextMilestone.label}
                            </Text>
                            <Text className="text-[#94a3b8] text-xs">
                              {nextMilestone.days} jours
                            </Text>
                          </View>
                        </View>
                        <Text className="text-[#00d4ff] font-bold">
                          {nextMilestone.days - habit.streak} jours restants
                        </Text>
                      </View>

                      {/* Progress Bar */}
                      <View className="bg-[#0a0e1a] rounded-full h-2 overflow-hidden">
                        <View
                          className="bg-[#00d4ff] h-full rounded-full"
                          style={{
                            width: `${
                              (habit.streak / nextMilestone.days) * 100
                            }%`,
                          }}
                        />
                      </View>
                    </View>
                  </View>
                )}
              </View>

              {/* Frequency Info */}
              <View className="bg-[#1a1f2e] p-4 rounded-2xl border border-[#2d3748] mb-6">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 bg-[#0a0e1a] rounded-full items-center justify-center mr-3">
                    <Text className="text-2xl">
                      {habit.frequency === "daily" ? "📅" : "📆"}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-[#e2e8f0] font-bold">
                      {habit.frequency === "daily"
                        ? "Quotidien"
                        : "Hebdomadaire"}
                    </Text>
                    <Text className="text-[#94a3b8] text-xs">
                      {habit.frequency === "daily"
                        ? "Tous les jours"
                        : "Toutes les semaines"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Motivation Quote */}
              <LinearGradient
                colors={["#8b5cf620", "#7c3aed20"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="p-4 rounded-2xl border border-[#8b5cf640]"
              >
                <Text className="text-[#8b5cf6] text-center font-bold italic">
                  "
                  {habit.streak > 0
                    ? "Continue comme ça ! Chaque jour compte."
                    : "Commence aujourd'hui, ton futur toi te remerciera."}
                  "
                </Text>
              </LinearGradient>
            </View>
          </ScrollView>

          {/* Confetti */}
          <ConfettiCannon
            ref={confettiRef}
            count={100}
            origin={{ x: screenWidth / 2, y: -10 }}
            autoStart={false}
            fadeOut
          />
        </View>
      </View>
    </Modal>
  );
};

export default HabitDetailModal;
