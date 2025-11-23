import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useRouter, Redirect } from "expo-router";
import {
  useOnboardingStore,
  useOnboardingHydration,
} from "@/stores/onboardingStore";
import { SafeAreaView } from "react-native-safe-area-context";

const QUESTIONS = [
  {
    id: "question1",
    title: "Quel est votre domaine principal d'amélioration ?",
    options: ["Santé", "Carrière", "Apprentissage", "Social", "Autre"],
  },
  {
    id: "question2",
    title: "Combien de temps pouvez-vous consacrer par jour ?",
    options: ["15 min", "30 min", "1h", "+1h"],
  },
  {
    id: "question3",
    title: "Quel est votre niveau d'énergie actuel ?",
    options: ["Faible", "Moyen", "Élevé"],
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { setAnswers, setHasCompletedOnboarding, hasCompletedOnboarding } =
    useOnboardingStore();
  const hydrated = useOnboardingHydration();
  const [step, setStep] = useState(0);
  const [localAnswers, setLocalAnswers] = useState({
    question1: "",
    question2: "",
    question3: "",
    goals: "",
  });

  if (hydrated && hasCompletedOnboarding) {
    return <Redirect href="/(home)" />;
  }

  const handleOptionSelect = (questionId: string, option: string) => {
    setLocalAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const handleNext = () => {
    if (step < QUESTIONS.length) {
      // Validate current step
      const currentQuestionId = QUESTIONS[step].id;
      // @ts-ignore
      if (!localAnswers[currentQuestionId]) {
        // You could add a toast or error message here
        return;
      }
      setStep(step + 1);
    } else {
      // Final step (Goals)
      if (!localAnswers.goals.trim()) return;

      finishOnboarding();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const finishOnboarding = () => {
    setAnswers(localAnswers);
    setHasCompletedOnboarding(true);
    router.replace("/(home)");
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <View className="flex-1 px-6 py-10">
        {/* Progress Bar */}
        <View className="flex-row h-2 bg-slate-800 rounded-full mb-10 overflow-hidden">
          <View
            className="bg-blue-500 h-full"
            style={{ width: `${((step + 1) / (QUESTIONS.length + 1)) * 100}%` }}
          />
        </View>

        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          {step < QUESTIONS.length ? (
            <View>
              <Text className="text-2xl font-bold text-white mb-6">
                {QUESTIONS[step].title}
              </Text>
              <View className=" gap-4">
                {QUESTIONS[step].options.map((option) => (
                  <TouchableOpacity
                    key={option}
                    onPress={() =>
                      handleOptionSelect(QUESTIONS[step].id, option)
                    }
                    className={`p-4 rounded-xl border-2 ${
                      // @ts-ignore
                      localAnswers[QUESTIONS[step].id] === option
                        ? "border-blue-500 bg-blue-500/20"
                        : "border-slate-700 bg-slate-800"
                    }`}
                  >
                    <Text
                      className={`text-lg font-medium ${
                        // @ts-ignore
                        localAnswers[QUESTIONS[step].id] === option
                          ? "text-blue-400"
                          : "text-slate-300"
                      }`}
                    >
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <View>
              <Text className="text-2xl font-bold text-white mb-2">
                Précisez vos objectifs
              </Text>
              <Text className="text-slate-400 mb-6">
                Dites-nous en plus sur ce que vous souhaitez accomplir.
              </Text>
              <TextInput
                className="bg-slate-800 text-white p-4 rounded-xl text-lg min-h-[150px] border border-slate-700"
                placeholder="Mes objectifs sont..."
                placeholderTextColor="#64748b"
                multiline
                textAlignVertical="top"
                value={localAnswers.goals}
                onChangeText={(text) =>
                  setLocalAnswers((prev) => ({ ...prev, goals: text }))
                }
              />
            </View>
          )}
        </ScrollView>

        <View className="flex-row justify-between mt-6">
          {step > 0 && (
            <TouchableOpacity
              onPress={handleBack}
              className="bg-slate-800 py-4 px-6 rounded-xl"
            >
              <Text className="text-white font-bold text-lg">Retour</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={handleNext}
            className={`bg-blue-600 py-4 px-8 rounded-xl flex-1 ml-4 items-center ${
              step === 0 ? "ml-0" : ""
            }`}
          >
            <Text className="text-white font-bold text-lg">
              {step === QUESTIONS.length ? "Terminer" : "Suivant"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
