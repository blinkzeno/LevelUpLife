import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import {
  Difficulty,
  getDifficultyColor,
  getDifficultyRank,
  calculateXPReward,
} from "@/utils/rpgUtils";

interface QuestCardProps {
  title: string;
  description?: string;
  difficulty: Difficulty;
  isCompleted: boolean;
  onToggle: () => void;
  onDelete?: () => void;
}

export default function QuestCard({
  title,
  description,
  difficulty,
  isCompleted,
  onToggle,
  onDelete,
}: QuestCardProps) {
  const difficultyColor = getDifficultyColor(difficulty);
  const difficultyRank = getDifficultyRank(difficulty);
  const xpReward = calculateXPReward(difficulty);

  const scale = useSharedValue(1);
  const completionOpacity = useSharedValue(isCompleted ? 1 : 0);

  React.useEffect(() => {
    if (isCompleted) {
      scale.value = withSequence(withSpring(1.05), withSpring(1));
      completionOpacity.value = withTiming(1, { duration: 300 });
    } else {
      completionOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isCompleted]);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const sealStyle = useAnimatedStyle(() => ({
    opacity: completionOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, cardStyle]}>
      {/* Difficulty Color Bar */}
      <View style={[styles.colorBar, { backgroundColor: difficultyColor }]} />

      {/* Card Content */}
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onToggle}
            style={[
              styles.checkbox,
              isCompleted && {
                backgroundColor: "#10b981",
                borderColor: "#10b981",
              },
            ]}
          >
            {isCompleted && (
              <Ionicons name="checkmark" size={16} color="white" />
            )}
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text
              style={[styles.title, isCompleted && styles.completedTitle]}
              numberOfLines={2}
            >
              {title}
            </Text>
            {description && (
              <Text style={styles.description} numberOfLines={1}>
                {description}
              </Text>
            )}
          </View>

          {onDelete && (
            <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
              <Ionicons name="close" size={20} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>

        {/* Quest Info */}
        <View style={styles.footer}>
          {/* Difficulty Rank */}
          <View style={[styles.rankBadge, { borderColor: difficultyColor }]}>
            <Text style={[styles.rankText, { color: difficultyColor }]}>
              {difficultyRank}
            </Text>
          </View>

          {/* XP Reward */}
          <View style={styles.xpContainer}>
            <Ionicons name="flash" size={14} color="#fbbf24" />
            <Text style={styles.xpText}>+{xpReward} XP</Text>
          </View>
        </View>
      </View>

      {/* Completion Seal */}
      {isCompleted && (
        <Animated.View style={[styles.seal, sealStyle]}>
          <LinearGradient
            colors={["#10b98180", "#10b981"]}
            style={styles.sealGradient}
          >
            <Ionicons name="checkmark-circle" size={32} color="white" />
            <Text style={styles.sealText}>COMPLETE</Text>
          </LinearGradient>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#1a1f2e",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2d3748",
  },
  colorBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#475569",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    color: "#e2e8f0",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  completedTitle: {
    color: "#64748b",
    textDecorationLine: "line-through",
  },
  description: {
    color: "#94a3b8",
    fontSize: 12,
  },
  deleteButton: {
    padding: 4,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rankBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  rankText: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  xpContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fbbf2420",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  xpText: {
    color: "#fbbf24",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 4,
  },
  seal: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0a0e1a80",
  },
  sealGradient: {
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
  },
  sealText: {
    color: "white",
    fontSize: 12,
    fontWeight: "900",
    marginTop: 4,
    letterSpacing: 2,
  },
});
