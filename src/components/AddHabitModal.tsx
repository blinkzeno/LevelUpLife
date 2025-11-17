// components/AddHabitModal.tsx
import { useState } from 'react';
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
} from 'react-native';
import { useHabitsStore } from '@/stores/habitsStore';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';

interface AddHabitModalProps {
  visible: boolean;
  onClose: () => void;
}

type Frequency = 'daily' | 'weekly';

const AddHabitModal = ({ visible, onClose }: AddHabitModalProps) => {
  const { user } = useUser();
  const { addHabit, isOnline } = useHabitsStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('daily');

  const handleAddHabit = () => {
    if (!title.trim()) {
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

      // Réinitialiser le formulaire
      setTitle('');
      setDescription('');
      setFrequency('daily');
      onClose();
    }
  };

  const frequencyOptions = [
    { 
      value: 'daily', 
      label: 'Quotidien', 
      icon: '📅', 
      description: 'Tous les jours',
      color: 'blue' 
    },
    { 
      value: 'weekly', 
      label: 'Hebdomadaire', 
      icon: '📆', 
      description: 'Toutes les semaines',
      color: 'purple' 
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable 
        className="flex-1 bg-black/50 justify-end"
        onPress={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View className="bg-white rounded-t-3xl p-6 min-h-[550px]">
              {/* Header */}
              <View className="flex-row items-center justify-between mb-6">
                <View>
                  <Text className="text-2xl font-bold text-gray-800">
                    Nouvelle habitude 🎯
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
                    Nom de l'habitude *
                  </Text>
                  <TextInput
                    className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base text-gray-800"
                    placeholder="Ex: Faire du sport, Lire 30 min..."
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
                    placeholder="Pourquoi cette habitude est importante pour vous..."
                    placeholderTextColor="#9CA3AF"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                {/* Fréquence */}
                <View className="mb-6">
                  <Text className="text-sm font-semibold text-gray-700 mb-3">
                    Fréquence
                  </Text>
                  <View className="space-y-3">
                    {frequencyOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        className={`p-4 rounded-xl border-2 flex-row items-center ${
                          frequency === option.value
                            ? option.color === 'blue'
                              ? 'bg-blue-50 border-blue-400'
                              : 'bg-purple-50 border-purple-400'
                            : 'bg-white border-gray-200'
                        }`}
                        onPress={() => setFrequency(option.value as Frequency)}
                      >
                        {/* Icône */}
                        <View className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${
                          frequency === option.value
                            ? option.color === 'blue'
                              ? 'bg-blue-100'
                              : 'bg-purple-100'
                            : 'bg-gray-100'
                        }`}>
                          <Text className="text-2xl">{option.icon}</Text>
                        </View>

                        {/* Texte */}
                        <View className="flex-1">
                          <Text className={`text-base font-semibold ${
                            frequency === option.value
                              ? option.color === 'blue'
                                ? 'text-blue-700'
                                : 'text-purple-700'
                              : 'text-gray-700'
                          }`}>
                            {option.label}
                          </Text>
                          <Text className={`text-sm ${
                            frequency === option.value
                              ? option.color === 'blue'
                                ? 'text-blue-600'
                                : 'text-purple-600'
                              : 'text-gray-500'
                          }`}>
                            {option.description}
                          </Text>
                        </View>

                        {/* Checkmark */}
                        {frequency === option.value && (
                          <Ionicons 
                            name="checkmark-circle" 
                            size={24} 
                            color={option.color === 'blue' ? '#3B82F6' : '#A855F7'} 
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Info box */}
                <View className="bg-orange-50 p-4 rounded-xl mb-6 flex-row">
                  <Text className="text-2xl mr-3">🔥</Text>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-orange-900 mb-1">
                      Construisez votre streak !
                    </Text>
                    <Text className="text-xs text-orange-700">
                      Complétez votre habitude chaque jour pour augmenter votre streak et rester motivé.
                    </Text>
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
                        ? 'bg-blue-500 active:bg-blue-600'
                        : 'bg-gray-300'
                    }`}
                    onPress={handleAddHabit}
                    disabled={!title.trim()}
                  >
                    <View className="flex-row items-center">
                      <Ionicons 
                        name="add-circle-outline" 
                        size={20} 
                        color="white" 
                      />
                      <Text className="text-white font-semibold text-base ml-2">
                        Créer
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

export default AddHabitModal;