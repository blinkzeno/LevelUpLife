// screens/NotesScreen.tsx
import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, RefreshControl, TextInput } from 'react-native';
import { useNotesStore } from "@/stores/notesstore";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const NotesScreen = () => {
  const { user } = useUser();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  
  const { 
    notes, 
    deleteNote,
    toggleFavorite,
    loadNotesFromRemote,
    isOnline,
    isSyncing,
    pendingOperations,
    syncPendingOperations,
    getFavoriteNotes,
    searchNotes,
    clearNotes,
   
  } = useNotesStore();
  
  useEffect(() => {
    const loadNotes = async () => {
      if (user?.id) {
       
        await loadNotesFromRemote(user.id);
      }
    };
    loadNotes();
  }, [user?.id]);

  const onRefresh = async () => {
    if (!user?.id) return;
    
    setRefreshing(true);
    if (isOnline) {
      await syncPendingOperations(user.id);
      await loadNotesFromRemote(user.id);
    }
    setRefreshing(false);
  };

  const handleDeleteNote = (noteId: string, noteTitle: string) => {
    Alert.alert(
      "Supprimer la note",
      `Êtes-vous sûr de vouloir supprimer "${noteTitle}"?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: () => {
            if (user?.id) {
              deleteNote(noteId, user.id);
            }
          }
        }
      ]
    );
  };

  const handleToggleFavorite = (noteId: string) => {
    if (user?.id) {
      toggleFavorite(noteId, user.id);
    }
  };

  const handleEditNote = (note: any) => {
    // Navigation vers l'écran d'édition
    router.push({ pathname: 'Edit', params: { noteId: note.$id } as any });
  };

  const getSyncIcon = (syncStatus?: string) => {
    switch (syncStatus) {
      case 'synced':
        return <Ionicons name="checkmark-circle" size={14} color="#10B981" />;
      case 'pending':
        return <Ionicons name="sync" size={14} color="#F59E0B" />;
      case 'error':
        return <Ionicons name="alert-circle" size={14} color="#EF4444" />;
      default:
        return null;
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const noteDate = new Date(date);
    const diffInMs = now.getTime() - noteDate.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInHours < 1) {
      return "À l'instant";
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours}h`;
    } else if (diffInDays < 7) {
      return `Il y a ${diffInDays}j`;
    } else {
      return noteDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  };

  // Filtrer les notes selon la recherche et les favoris
  const filteredNotes = (() => {
    let filtered = notes;
    
    if (showFavoritesOnly) {
      filtered = getFavoriteNotes();
    }
    
    if (searchQuery.trim()) {
      filtered = searchNotes(searchQuery);
    }
    
    return filtered;
  })();

  const renderNoteItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      className="bg-white p-4 rounded-xl mb-3 shadow-sm active:bg-gray-50"
      onPress={() => handleEditNote(item)}
    >
      {/* Header avec titre et favori */}
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-2">
          <View className="flex-row items-center mb-1">
            <Text 
              className="text-base font-bold text-gray-800 flex-1" 
              numberOfLines={1}
            >
              {item.title || 'Sans titre'}
            </Text>
            {getSyncIcon(item.syncStatus)}
          </View>
          
          {/* Aperçu du contenu */}
          <Text className="text-sm text-gray-500" numberOfLines={2}>
            {item.content || 'Aucun contenu'}
          </Text>
        </View>

        {/* Bouton favori */}
        <TouchableOpacity
          className="p-2"
          onPress={() => handleToggleFavorite(item.$id)}
        >
          <Ionicons 
            name={item.isFavorite ? "star" : "star-outline"} 
            size={24} 
            color={item.isFavorite ? "#F59E0B" : "#D1D5DB"} 
          />
        </TouchableOpacity>
      </View>

      {/* Footer avec date et actions */}
      <View className="flex-row items-center justify-between pt-3 border-t border-gray-100">
        <Text className="text-xs text-gray-400">
          {formatDate(item.updatedAt)}
        </Text>

        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            className="bg-blue-50 px-3 py-1.5 rounded-lg"
            onPress={() => handleEditNote(item)}
          >
            <View className="flex-row items-center">
              <Ionicons name="create-outline" size={14} color="#3B82F6" />
              <Text className="text-xs text-blue-600 font-medium ml-1">
                Éditer
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-red-50 px-3 py-1.5 rounded-lg"
            onPress={() => handleDeleteNote(item.$id, item.title)}
          >
            <Ionicons name="trash-outline" size={14} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View className="mb-4">
      {/* Barre de statut */}
      <View className="flex-row items-center justify-between mb-4 bg-white p-3 rounded-xl shadow-sm">
        <View className="flex-row items-center">
          <View className={`w-2 h-2 rounded-full mr-2 ${
            isOnline ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <Text className="text-sm font-medium text-gray-700">
            {isOnline ? '🌐 En ligne' : '📴 Hors ligne'}
          </Text>
        </View>
        
        {isSyncing && (
          <View className="flex-row items-center">
            <Ionicons name="sync" size={16} color="#3B82F6" />
            <Text className="text-sm text-blue-500 ml-1">Sync...</Text>
          </View>
        )}
        
        {pendingOperations.length > 0 && (
          <View className="flex-row items-center bg-amber-100 px-2 py-1 rounded-full">
            <Ionicons name="time-outline" size={14} color="#F59E0B" />
            <Text className="text-xs text-amber-600 ml-1 font-medium">
              {pendingOperations.length} en attente
            </Text>
          </View>
        )}
      </View>

      {/* Statistiques */}
      <View className="flex-row justify-between mb-4">
        <View className="flex-1 bg-blue-50 p-4 rounded-xl mr-2">
          <Text className="text-2xl font-bold text-blue-600">
            {notes.length}
          </Text>
          <Text className="text-sm text-blue-600 mt-1">Total</Text>
        </View>
        
        <View className="flex-1 bg-amber-50 p-4 rounded-xl mr-2">
          <Text className="text-2xl font-bold text-amber-600">
            ⭐ {getFavoriteNotes().length}
          </Text>
          <Text className="text-sm text-amber-600 mt-1">Favoris</Text>
        </View>
        
        <TouchableOpacity 
          className="flex-1 bg-green-50 p-4 rounded-xl"
          onPress={() => router.push({ pathname: 'Edit' as any })}
        >
          <Ionicons name="add-circle" size={32} color="#10B981" />
          <Text className="text-sm text-green-600 mt-1">Nouvelle</Text>
        </TouchableOpacity>
      </View>

      {/* Barre de recherche */}
      <View className="bg-white rounded-xl shadow-sm mb-4 flex-row items-center px-4 py-3">
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          className="flex-1 ml-2 text-base text-gray-800"
          placeholder="Rechercher une note..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtres */}
      <View className="flex-row items-center gap-2 mb-4">
        <TouchableOpacity
          className={`px-4 py-2 rounded-lg flex-row items-center ${
            !showFavoritesOnly ? 'bg-blue-500' : 'bg-gray-100'
          }`}
          onPress={() => setShowFavoritesOnly(false)}
        >
          <Ionicons 
            name="albums-outline" 
            size={16} 
            color={!showFavoritesOnly ? 'white' : '#6B7280'} 
          />
          <Text className={`ml-2 font-medium ${
            !showFavoritesOnly ? 'text-white' : 'text-gray-600'
          }`}>
            Toutes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className={`px-4 py-2 rounded-lg flex-row items-center ${
            showFavoritesOnly ? 'bg-amber-500' : 'bg-gray-100'
          }`}
          onPress={() => setShowFavoritesOnly(true)}
        >
          <Ionicons 
            name="star" 
            size={16} 
            color={showFavoritesOnly ? 'white' : '#6B7280'} 
          />
          <Text className={`ml-2 font-medium ${
            showFavoritesOnly ? 'text-white' : 'text-gray-600'
          }`}>
            Favoris
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyList = () => (
    <View className="flex-1 items-center justify-center py-20">
      <Text className="text-6xl mb-4">📝</Text>
      <Text className="text-gray-400 text-lg font-medium">
        {searchQuery ? 'Aucun résultat' : showFavoritesOnly ? 'Aucun favori' : 'Aucune note'}
      </Text>
      <Text className="text-gray-300 text-sm mt-2 text-center px-8">
        {searchQuery 
          ? 'Essayez une autre recherche' 
          : showFavoritesOnly 
          ? 'Marquez des notes comme favoris' 
          : 'Créez votre première note pour commencer'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1 px-4 pt-4">
        <FlatList
          data={filteredNotes}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item.$id}
          renderItem={renderNoteItem}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmptyList}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3B82F6']}
              tintColor="#3B82F6"
            />
          }
        />
      </View>
    </SafeAreaView>
  );
};

export default NotesScreen;