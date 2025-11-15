import { View, Text, Button, Alert, StyleSheet, TouchableOpacity, FlatList } from 'react-native'
import React, { useState } from 'react'
import { Habit, useHabitsStore } from '@/stores/habitsStore'
import { SafeAreaView } from 'react-native-safe-area-context'
import AddHabitModal from '@/components/AddHabitModal'



const HabitudesScreen = () => {
  const {habits, addHabit, completeHabit, resetStreak, deleteHabit} = useHabitsStore()
   const [modalVisible, setModalVisible] = useState(false);
  const handleDelete = (id: string) => {
    Alert.alert(
      'Supprimer l\'habitude',
      'Es-tu sûr(e) de vouloir supprimer cette habitude ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => deleteHabit(id) },
      ]
    );
  };


  const renderHabit = ({ item }: { item: Habit }) => (
    <View style={styles.habitItem}>
      <View style={styles.habitInfo}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.streak}>🔥 Streak: {item.streak}</Text>
        {item.lastCompleted && (
          <Text style={styles.lastCompleted}>
            Dernière fois: {new Date(item.lastCompleted).toLocaleDateString()}
          </Text>
        )}
      </View>

      <View style={styles.buttons}>
        <TouchableOpacity
          style={styles.completeButton}
          onPress={() => completeHabit(item.id)}
        >
          <Text style={styles.buttonText}>Fait</Text>
        </TouchableOpacity>
 <TouchableOpacity className='bg-red-500 p-2 rounded-md' onPress={() => resetStreak(item.id)}>
        <Text> reset </Text>
      </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDelete(item.id)}
        >
          <Text style={styles.buttonText}>del</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  
  return (
    <SafeAreaView className='flex-1'>
      <Text>HabitudesScreen</Text>

      {/* creer la page pour ajouter les habitudes */}

      {/* afficher les habitudes */}
      <Text>Nombre d'habitudes : {habits.length}</Text>


     <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>+ Ajouter une habitude</Text>
      </TouchableOpacity>
   
        <FlatList
      className='mt-4'
      data={habits}
      keyExtractor={(item) => item.id}
      renderItem={renderHabit}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    />
      {/* marquer comme fait */}
<AddHabitModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
      {/* faire le streak */}
      {/* supprimer une habitude */}
    </SafeAreaView>
  )
}

export default HabitudesScreen


const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  habitItem: {
    backgroundColor: '#f9f9f9',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  habitInfo: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  streak: {
    fontSize: 14,
    color: '#555',
  },
  lastCompleted: {
    fontSize: 12,
    color: '#888',
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
  },
  completeButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  deleteButton: {
    backgroundColor: '#f44336',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
   addButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});