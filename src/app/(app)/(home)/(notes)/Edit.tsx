// screens/EditNoteScreen.tsx
import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNotesStore } from '@/stores/notesstore';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useGlobalSearchParams, useRouter } from 'expo-router';


const EditNoteScreen = () => {
  const { user } = useUser();
  const params = useGlobalSearchParams();
  const router = useRouter();
  
  const { noteId } = params || {};

  const { addNote, updateNote, getNoteById, isOnline, toggleFavorite } = useNotesStore();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  const isEditMode = !!noteId;
  const existingNote = isEditMode ? getNoteById(noteId as string) : null;

  useEffect(() => {
    if (existingNote) {
      setTitle(existingNote.title);
      setContent(existingNote.content);
      setIsFavorite(existingNote.isFavorite);
    }
  }, [existingNote]);

  useEffect(() => {
    // Détecter les changements
    if (isEditMode && existingNote) {
      const changed = 
        title !== existingNote.title || 
        content !== existingNote.content;
      setHasChanges(changed);
    } else {
      setHasChanges(title.trim() !== '' || content.trim() !== '');
    }
  }, [title, content, existingNote, isEditMode]);

  const handleSave = () => {
    if (!title.trim() && !content.trim()) {
      Alert.alert('Erreur', 'Veuillez ajouter un titre ou du contenu');
      return;
    }

    if (!user?.id) return;

    if (isEditMode && noteId) {
      // Mise à jour
      updateNote(
        noteId as string,
        {
          title: title.trim() || 'Sans titre',
          content: content.trim(),
        },
        user.id
      );
    } else {
      // Création
      addNote(
        {
          title: title.trim() || 'Sans titre',
          content: content.trim(),
        },
        user.id
      );
    }

    router.back();
  };

  const handleToggleFavorite = () => {
    if (isEditMode && noteId && user?.id) {
      toggleFavorite(noteId as string, user.id as string);
      setIsFavorite(!isFavorite);
    } else {
      setIsFavorite(!isFavorite);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      Alert.alert(
        'Modifications non sauvegardées',
        'Voulez-vous sauvegarder vos modifications ?',
        [
          {
            text: 'Annuler',
            style: 'cancel',
          },
          {
            text: 'Ne pas sauvegarder',
            style: 'destructive',
            onPress: () => router.back(),
          },
          {
            text: 'Sauvegarder',
            onPress: handleSave,
          },
        ]
      );
    } else {
      router.back();
    }
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
          <TouchableOpacity
            className="flex-row items-center"
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>

          <View className="flex-row items-center gap-2">
            {/* Indicateur offline */}
            {!isOnline && (
              <View className="bg-amber-100 px-2 py-1 rounded-full">
                <Text className="text-xs text-amber-700 font-medium">
                  Hors ligne
                </Text>
              </View>
            )}

            {/* Bouton favori */}
            <TouchableOpacity
              className="p-2"
              onPress={handleToggleFavorite}
            >
              <Ionicons 
                name={isFavorite ? "star" : "star-outline"} 
                size={24} 
                color={isFavorite ? "#F59E0B" : "#9CA3AF"} 
              />
            </TouchableOpacity>

            {/* Bouton sauvegarder */}
            <TouchableOpacity
              className={`px-4 py-2 rounded-lg ${
                hasChanges ? 'bg-blue-500' : 'bg-gray-200'
              }`}
              onPress={handleSave}
              disabled={!hasChanges}
            >
              <Text className={`font-semibold ${
                hasChanges ? 'text-white' : 'text-gray-400'
              }`}>
                {isEditMode ? 'Mettre à jour' : 'Créer'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Contenu de la note */}
        <ScrollView 
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Titre */}
          <TextInput
            className="text-2xl font-bold text-gray-800 py-4"
            placeholder="Titre de la note"
            placeholderTextColor="#D1D5DB"
            value={title}
            onChangeText={setTitle}
            autoFocus={!isEditMode}
          />

          {/* Séparateur */}
          <View className="h-px bg-gray-100 mb-4" />

          {/* Contenu */}
          <TextInput
            className="text-base text-gray-700 leading-6 min-h-[400px]"
            placeholder="Commencez à écrire..."
            placeholderTextColor="#D1D5DB"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />

          {/* Espacement en bas */}
          <View className="h-20" />
        </ScrollView>

        {/* Footer avec statistiques */}
        <View className="px-4 py-3 border-t border-gray-100 bg-gray-50">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-4">
              <View className="flex-row items-center">
                <Ionicons name="text-outline" size={16} color="#9CA3AF" />
                <Text className="text-xs text-gray-500 ml-1">
                  {charCount} caractères
                </Text>
              </View>
              
              <View className="flex-row items-center">
                <Ionicons name="bookmarks-outline" size={16} color="#9CA3AF" />
                <Text className="text-xs text-gray-500 ml-1">
                  {wordCount} mots
                </Text>
              </View>
            </View>

            {existingNote && (
              <Text className="text-xs text-gray-400">
                Modifié {formatDate(existingNote.updatedAt)}
              </Text>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Fonction utilitaire pour formater la date
function formatDate(date: Date): string {
  const now = new Date();
  const noteDate = new Date(date);
  const diffInMs = now.getTime() - noteDate.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) {
    return "à l'instant";
  } else if (diffInMinutes < 60) {
    return `il y a ${diffInMinutes} min`;
  } else if (diffInHours < 24) {
    return `il y a ${diffInHours}h`;
  } else if (diffInDays < 7) {
    return `il y a ${diffInDays}j`;
  } else {
    return noteDate.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short',
      year: noteDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }
}

export default EditNoteScreen;