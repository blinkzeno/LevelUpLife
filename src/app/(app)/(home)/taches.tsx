// screens/TasksScreen.tsx
import React from 'react';
import { View, Text, FlatList, Button } from 'react-native';
import { useTasksStore } from '@/stores/tasksStore';
import { SafeAreaView } from 'react-native-safe-area-context';

const TasksScreen = () => {
  
  const { tasks, addTask, moveTask, deleteTask } = useTasksStore();

  return (
    <SafeAreaView className='flex-1 justify-center items-center bg-gray-300'>
      <Text className='text-2xl'>Total de tâches : {tasks.length}</Text>
      <Button
        title="Ajouter une tâche"
        onPress={() => addTask({ title: 'Nouvelle tâche', status: 'todo' })}
      />
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ padding: 10, borderBottomWidth: 1 }}>
            <Text>{item.title}</Text>
            <Text>{item.status}</Text>
            <Button title="Fait" onPress={() => moveTask(item.id, 'done')} />
            <Button title="Supprimer" onPress={() => deleteTask(item.id)} />
          </View>
        )}
      />
    </SafeAreaView>
  );
};

export default TasksScreen;