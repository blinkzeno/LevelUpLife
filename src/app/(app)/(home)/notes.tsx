import { View, Text, Button, FlatList } from 'react-native'
import React from 'react'
import { useNotesStore } from '@/stores/notesstore'
import { SafeAreaView } from 'react-native-safe-area-context'

const NotesScreen = () => {
  const {notes, addNote, deleteNote, updateNote, toggleFavorite } = useNotesStore()
  return (
    <SafeAreaView>
      <Button
        title="Ajouter une note"
        onPress={() => addNote({ title: 'Nouvelle note', content: 'Contenu...' })}
      />

      <FlatList
        data={notes}
        renderItem={({ item }) => (
          <View style={{ padding: 10, borderBottomWidth: 1 }}>
            <Text>{item.title}</Text>
            <Text>{item.content}</Text>
            <Button
              title={item.isFavorite ? 'Favori ✨' : 'Mettre en favori'}
              onPress={() => toggleFavorite(item.id)}
            />
            <Button
              title="Supprimer"
              color="#ff4500"
              onPress={() => deleteNote(item.id)}
            />
            <Button
              title="Modifier"
              onPress={() =>
                updateNote(item.id, {
                  title: 'Titre modifié',
                  content: 'Contenu modifié...',
                 isFavorite: !item.isFavorite,
                })
              }
            />
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
      />
    </SafeAreaView>
  )
}

export default NotesScreen