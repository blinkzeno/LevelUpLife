// @ts-ignore

import React, { useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Audio } from "expo-av";

interface VoiceInputProps {
  onRecordingComplete: (uri: string) => void;
  isProcessing: boolean;
}

export default function VoiceInput({
  onRecordingComplete,
  isProcessing,
}: VoiceInputProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [permissionResponse, requestPermission] = Audio.usePermissions();

  async function startRecording() {
    try {
      let perm = permissionResponse;

      if (perm?.status !== "granted") {
        console.log("Requesting permission..");
        perm = await requestPermission();
      }

      if (perm?.status !== "granted") {
        Alert.alert(
          "Permission refusée",
          "Vous devez autoriser l'accès au micro pour utiliser cette fonctionnalité."
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log("Starting recording..");
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      console.log("Recording started");
    } catch (err) {
      console.error("Failed to start recording", err);
      Alert.alert(
        "Erreur",
        "Impossible de démarrer l'enregistrement. Vérifiez les permissions."
      );
    }
  }

  async function stopRecording() {
    console.log("Stopping recording..");
    if (!recording) return;

    setRecording(null);
    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
    });

    const uri = recording.getURI();
    console.log("Recording stopped and stored at", uri);

    if (uri) {
      onRecordingComplete(uri);
    }
  }

  return (
    <View className="items-center justify-center">
      <TouchableOpacity
        onPress={recording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`w-16 h-16 rounded-full items-center justify-center ${
          recording
            ? "bg-red-500"
            : isProcessing
            ? "bg-slate-600"
            : "bg-indigo-600"
        }`}
      >
        {isProcessing ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-2xl font-bold">
            {recording ? "■" : "🎤"}
          </Text>
        )}
      </TouchableOpacity>
      <Text className="text-slate-400 mt-2 text-sm">
        {recording
          ? "Appuyez pour arrêter"
          : isProcessing
          ? "Traitement..."
          : "Appuyez pour parler"}
      </Text>
    </View>
  );
}
