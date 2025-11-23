// Solo Leveling-inspired Dashboard Screen (Simplified - No Reanimated)
import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useUser } from "@clerk/clerk-expo";
import { Redirect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  useOnboardingStore,
  useOnboardingHydration,
} from "@/stores/onboardingStore";
import { useTasksStore } from "@/stores/tasksStore";
import { useHabitsStore } from "@/stores/habitsStore";
import { useNotesStore } from "@/stores/notesstore";
import {
  calculateRank,
  getRankColor,
  getXPForNextRank,
  calculateLevel,
  formatXP,
  type Rank,
} from "@/utils/rpgUtils";

export default function DashboardScreen() {
  const { user } = useUser();
  const router = useRouter();
  const hydrated = useOnboardingHydration();
  const { hasCompletedOnboarding } = useOnboardingStore();
  const { tasks, moveTask, deleteTask } = useTasksStore();
  const { habits, completeHabit } = useHabitsStore();
  const { notes } = useNotesStore();

  // XP State (persisted in localStorage later)
  const [userXP, setUserXP] = useState(450);
  const [dailyXP, setDailyXP] = useState(75);

  const currentRank = calculateRank(userXP);
  const rankColor = getRankColor(currentRank);
  const level = calculateLevel(userXP);
  const nextRankInfo = getXPForNextRank(userXP);

  // Get today's date
  const today = new Date().toISOString().split("T")[0];
  const todayTasks = tasks.filter((t) => t.date === today);
  const completedTasks = todayTasks.filter((t) => t.status === "done");

  // Calculate streak from habits
  const totalStreak = habits.reduce((sum, h) => sum + h.streak, 0);

  if (hydrated && !hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  const handleTaskToggle = (taskId: string, currentStatus: string) => {
    if (user?.id) {
      const newStatus = currentStatus === "done" ? "todo" : "done";
      moveTask(taskId, newStatus, user.id);

      // Add XP if completing
      if (newStatus === "done") {
        setUserXP((prev) => prev + 25);
        setDailyXP((prev) => prev + 25);
      }
    }
  };

  const handleHabitComplete = (habitId: string) => {
    if (user?.id) {
      completeHabit(habitId, user.id);
      setUserXP((prev) => prev + 10);
      setDailyXP((prev) => prev + 10);
    }
  };

  const getTaskTypeColor = (type?: string) => {
    switch (type) {
      case "work":
        return "#8b5cf6"; // purple
      case "health":
        return "#10b981"; // green
      case "learning":
        return "#3b82f6"; // blue
      case "social":
        return "#f59e0b"; // amber
      default:
        return "#64748b"; // slate
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.profileSection}>
            {/* Avatar */}
            <View style={[styles.avatarContainer, { borderColor: rankColor }]}>
              {user?.imageUrl ? (
                <Image source={{ uri: user.imageUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={32} color="#64748b" />
                </View>
              )}
            </View>

            {/* User Info */}
            <View style={styles.userInfo}>
              <Text style={styles.username}>{user?.firstName || "Hunter"}</Text>
              <View style={styles.rankContainer}>
                <View
                  style={[styles.rankBadge, { backgroundColor: rankColor }]}
                >
                  <Text style={styles.rankText}>RANK {currentRank}</Text>
                </View>
                <Text style={styles.levelText}>Lv. {level}</Text>
              </View>
            </View>
          </View>

          {/* AI Assistant Button */}
          <TouchableOpacity style={styles.aiButton}>
            <LinearGradient
              colors={["#00d4ff", "#a78bfa"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.aiButtonGradient}
            >
              <Ionicons name="sparkles" size={24} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* XP Progress Bar */}
        <View style={styles.xpSection}>
          <View style={styles.xpLabelRow}>
            <Text style={styles.xpLabel}>XP</Text>
            <Text style={styles.xpValue}>
              {userXP} / {nextRankInfo.needed}
            </Text>
          </View>
          <View style={styles.xpBarContainer}>
            <View style={styles.xpBarBackground} />
            <View
              style={[
                styles.xpBarFill,
                {
                  width: `${Math.min(
                    (userXP / nextRankInfo.needed) * 100,
                    100
                  )}%`,
                  backgroundColor: rankColor,
                },
              ]}
            />
          </View>
          <Text style={styles.xpSubtext}>
            {formatXP(nextRankInfo.needed - userXP)} XP to Rank{" "}
            {nextRankInfo.rank}
          </Text>
        </View>

        {/* Daily Power Level Card */}
        <View style={[styles.powerCard, { borderColor: rankColor }]}>
          <View style={styles.powerHeader}>
            <Ionicons name="flash" size={24} color="#fbbf24" />
            <Text style={styles.powerTitle}>Today's Power Level</Text>
          </View>

          <View style={styles.powerStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>+{dailyXP}</Text>
              <Text style={styles.statLabel}>XP Gained</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalStreak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {completedTasks.length}/{todayTasks.length}
              </Text>
              <Text style={styles.statLabel}>Quests</Text>
            </View>
          </View>
        </View>

        {/* Daily Quests Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="list" size={20} color="#00d4ff" />
            <Text style={styles.sectionTitle}>Daily Quests</Text>
          </View>

          {/* Habits as Quests */}
          {habits.slice(0, 3).map((habit) => {
            const isCompletedToday =
              habit.lastCompleted &&
              new Date(habit.lastCompleted).toISOString().split("T")[0] ===
                today;

            return (
              <View key={habit.$id} style={styles.questCard}>
                <View
                  style={[styles.questColorBar, { backgroundColor: "#10b981" }]}
                />
                <View style={styles.questContent}>
                  <View style={styles.questHeader}>
                    <TouchableOpacity
                      onPress={() => handleHabitComplete(habit.$id)}
                      style={[
                        styles.checkbox,
                        isCompletedToday && styles.checkboxCompleted,
                      ]}
                    >
                      {isCompletedToday && (
                        <Ionicons name="checkmark" size={16} color="white" />
                      )}
                    </TouchableOpacity>

                    <View style={styles.questTextContainer}>
                      <Text
                        style={[
                          styles.questTitle,
                          isCompletedToday && styles.questTitleCompleted,
                        ]}
                      >
                        {habit.title}
                      </Text>
                      {habit.description && (
                        <Text style={styles.questDescription}>
                          {habit.description}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.questFooter}>
                    <View style={styles.rankBadgeSmall}>
                      <Text style={styles.rankBadgeText}>E</Text>
                    </View>
                    <View style={styles.xpReward}>
                      <Ionicons name="flash" size={12} color="#fbbf24" />
                      <Text style={styles.xpRewardText}>+10 XP</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}

          {/* Tasks as Quests */}
          {todayTasks.slice(0, 5).map((task) => (
            <View key={task.$id} style={styles.questCard}>
              <View
                style={[
                  styles.questColorBar,
                  { backgroundColor: getTaskTypeColor(task.type) },
                ]}
              />
              <View style={styles.questContent}>
                <View style={styles.questHeader}>
                  <TouchableOpacity
                    onPress={() => handleTaskToggle(task.$id, task.status)}
                    style={[
                      styles.checkbox,
                      task.status === "done" && styles.checkboxCompleted,
                    ]}
                  >
                    {task.status === "done" && (
                      <Ionicons name="checkmark" size={16} color="white" />
                    )}
                  </TouchableOpacity>

                  <View style={styles.questTextContainer}>
                    <Text
                      style={[
                        styles.questTitle,
                        task.status === "done" && styles.questTitleCompleted,
                      ]}
                    >
                      {task.title}
                    </Text>
                    {task.description && (
                      <Text style={styles.questDescription}>
                        {task.description}
                      </Text>
                    )}
                    {task.startTime && (
                      <Text style={styles.questTime}>
                        {task.startTime} - {task.endTime}
                      </Text>
                    )}
                  </View>

                  <TouchableOpacity
                    onPress={() => user?.id && deleteTask(task.$id, user.id)}
                    style={styles.deleteButton}
                  >
                    <Ionicons name="close" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>

                <View style={styles.questFooter}>
                  <View style={styles.rankBadgeSmall}>
                    <Text style={styles.rankBadgeText}>C</Text>
                  </View>
                  <View style={styles.xpReward}>
                    <Ionicons name="flash" size={12} color="#fbbf24" />
                    <Text style={styles.xpRewardText}>+25 XP</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}

          {todayTasks.length === 0 && habits.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="clipboard-outline" size={48} color="#475569" />
              <Text style={styles.emptyText}>No quests available</Text>
              <TouchableOpacity
                onPress={() => router.push("/taches")}
                style={styles.emptyButton}
              >
                <Text style={styles.emptyButtonText}>Create Quest</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStatsSection}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push("/taches")}
          >
            <Ionicons name="checkbox-outline" size={32} color="#3b82f6" />
            <Text style={styles.statCardValue}>{tasks.length}</Text>
            <Text style={styles.statCardLabel}>Tasks</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push("/habitudes")}
          >
            <Ionicons name="repeat" size={32} color="#10b981" />
            <Text style={styles.statCardValue}>{habits.length}</Text>
            <Text style={styles.statCardLabel}>Habits</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.statCard}
            onPress={() => router.push("/(notes)")}
          >
            <Ionicons name="document-text-outline" size={32} color="#8b5cf6" />
            <Text style={styles.statCardValue}>{notes.length}</Text>
            <Text style={styles.statCardLabel}>Notes</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/taches")}
          >
            <LinearGradient
              colors={["#3b82f6", "#2563eb"]}
              style={styles.actionGradient}
            >
              <Ionicons name="add-circle" size={24} color="white" />
              <Text style={styles.actionText}>New Quest</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push("/habitudes")}
          >
            <LinearGradient
              colors={["#8b5cf6", "#7c3aed"]}
              style={styles.actionGradient}
            >
              <Ionicons name="repeat" size={24} color="white" />
              <Text style={styles.actionText}>Habits</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0e1a",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    marginRight: 12,
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#1a1f2e",
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: {
    flex: 1,
  },
  username: {
    color: "#e2e8f0",
    fontSize: 20,
    fontWeight: "900",
    marginBottom: 4,
  },
  rankContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rankBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  rankText: {
    color: "white",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },
  levelText: {
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "700",
  },
  aiButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: "hidden",
  },
  aiButtonGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  xpSection: {
    marginBottom: 20,
  },
  xpLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  xpLabel: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  xpValue: {
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: "700",
  },
  xpBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    position: "relative",
  },
  xpBarBackground: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
  },
  xpBarFill: {
    height: "100%",
  },
  xpSubtext: {
    color: "#64748b",
    fontSize: 12,
    textAlign: "right",
    marginTop: 4,
  },
  powerCard: {
    backgroundColor: "#1a1f2e",
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 2,
  },
  powerHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  powerTitle: {
    color: "#e2e8f0",
    fontSize: 18,
    fontWeight: "900",
    marginLeft: 8,
  },
  powerStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    color: "#00d4ff",
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 4,
  },
  statLabel: {
    color: "#94a3b8",
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#2d3748",
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#e2e8f0",
    fontSize: 18,
    fontWeight: "900",
    marginLeft: 8,
  },
  questCard: {
    flexDirection: "row",
    backgroundColor: "#1a1f2e",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2d3748",
  },
  questColorBar: {
    width: 4,
  },
  questContent: {
    flex: 1,
    padding: 12,
  },
  questHeader: {
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
  checkboxCompleted: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  questTextContainer: {
    flex: 1,
  },
  questTitle: {
    color: "#e2e8f0",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  questTitleCompleted: {
    color: "#64748b",
    textDecorationLine: "line-through",
  },
  questDescription: {
    color: "#94a3b8",
    fontSize: 12,
  },
  questTime: {
    color: "#64748b",
    fontSize: 11,
    marginTop: 2,
  },
  deleteButton: {
    padding: 4,
  },
  questFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rankBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#3b82f6",
  },
  rankBadgeText: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
    color: "#3b82f6",
  },
  xpReward: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fbbf2420",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  xpRewardText: {
    color: "#fbbf24",
    fontSize: 12,
    fontWeight: "700",
    marginLeft: 4,
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  emptyButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: "white",
    fontWeight: "700",
  },
  quickStatsSection: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#1a1f2e",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2d3748",
  },
  statCardValue: {
    color: "#e2e8f0",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 8,
  },
  statCardLabel: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 4,
  },
  quickActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  actionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  actionText: {
    color: "white",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 8,
  },
});
