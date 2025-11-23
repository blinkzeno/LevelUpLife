import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
} from "react-native-reanimated";

interface XPBarProps {
  current: number;
  max: number;
  color?: string;
  height?: number;
  showLabel?: boolean;
}

export default function XPBar({
  current,
  max,
  color = "#00d4ff",
  height = 8,
  showLabel = true,
}: XPBarProps) {
  const progress = Math.min((current / max) * 100, 100);
  const glowOpacity = useSharedValue(0.5);

  React.useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withSpring(1, { damping: 2 }),
        withSpring(0.5, { damping: 2 })
      ),
      -1,
      true
    );
  }, []);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={styles.container}>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={styles.label}>XP</Text>
          <Text style={styles.value}>
            {current} / {max}
          </Text>
        </View>
      )}

      <View style={[styles.barContainer, { height }]}>
        {/* Background */}
        <View style={[styles.barBackground, { borderRadius: height / 2 }]} />

        {/* Progress Fill */}
        <View
          style={[
            styles.barFill,
            {
              width: `${progress}%`,
              borderRadius: height / 2,
            },
          ]}
        >
          <LinearGradient
            colors={[color, `${color}99`, color]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </View>

        {/* Glow Effect */}
        <Animated.View
          style={[
            styles.glow,
            {
              width: `${progress}%`,
              height: height * 2,
              borderRadius: height,
              backgroundColor: color,
            },
            glowStyle,
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  labelContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  label: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  value: {
    color: "#e2e8f0",
    fontSize: 12,
    fontWeight: "700",
  },
  barContainer: {
    position: "relative",
    width: "100%",
    overflow: "hidden",
  },
  barBackground: {
    position: "absolute",
    width: "100%",
    height: "100%",
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
  },
  barFill: {
    position: "absolute",
    height: "100%",
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    top: "50%",
    transform: [{ translateY: -8 }],
    shadowColor: "#00d4ff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
});
