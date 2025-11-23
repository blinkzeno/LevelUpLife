import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface GlowCardProps {
  children: React.ReactNode;
  glowColor?: string;
  intensity?: number;
  style?: ViewStyle;
}

export default function GlowCard({
  children,
  glowColor = "#00d4ff",
  intensity = 0.6,
  style,
}: GlowCardProps) {
  const glowOpacity = useSharedValue(intensity);

  React.useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(intensity * 1.5, { duration: 2000 }),
        withTiming(intensity, { duration: 2000 })
      ),
      -1,
      true
    );
  }, [intensity]);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <View style={[styles.container, style]}>
      {/* Glow Border */}
      <Animated.View style={[styles.glowBorder, glowStyle]}>
        <LinearGradient
          colors={[`${glowColor}00`, glowColor, `${glowColor}00`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {/* Card Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    borderRadius: 16,
    overflow: "hidden",
  },
  glowBorder: {
    position: "absolute",
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 18,
  },
  content: {
    backgroundColor: "#1a1f2e",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2d3748",
  },
});
