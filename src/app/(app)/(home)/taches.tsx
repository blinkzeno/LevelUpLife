// screens/TasksScreen.tsx
import  {  useEffect, useState } from 'react';
import { View, Text, FlatList, Button, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTasksStore } from '@/stores/tasksStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@clerk/clerk-expo';
import AddTaskModal from '@/components/AddTaskModal';

const TasksScreen = () => {
  const { user } = useUser();
    const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
    
  
  const { tasks, moveTask, deleteTask, loadTasksFromRemote } = useTasksStore();
  
  useEffect(
    () => {
      
      const loadTasks = async () => {
        if (user) {
          setLoading(true); // Activer le loading
           loadTasksFromRemote(user.id); // Attendre la synchronisation
          setLoading(false); // Désactiver le loading
      } else {
        setLoading(false); // Si pas d'utilisateur, aussi désactiver
      }
    };

    loadTasks();
    },
    [tasks]
  );


 if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={{ marginTop: 10 }}>Chargement des tâches...</Text>
      </View>
    );
  }



  return (
    <SafeAreaView >
      <Text className='text-2xl'>Total de tâches : {tasks.length}</Text>
      
      <TouchableOpacity className='bg-blue-500 p-2 rounded-md' onPress={() => setModalVisible(true)}>
        <Text className='text-white'>+ Ajouter une tache</Text>
            </TouchableOpacity>
     
      <FlatList
        data={tasks}
        showsVerticalScrollIndicator={false}
       
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <View  style={{ padding: 10, borderBottomWidth: 1 }}>
            <Text>{item.$id}</Text>
            <Text>{item.title}</Text>
            <Text>{item.description || '-'}</Text>
            <Text>{item.status}</Text>
            <Button title="Fait" onPress={() => moveTask(item.$id, 'done', user.id)} />
            <Button title="Supprimer" onPress={() => deleteTask(item.$id, user.id)} />
          </View>
        )}
      />

       <AddTaskModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
};

export default TasksScreen;