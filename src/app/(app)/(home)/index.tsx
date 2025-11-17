import { useHabitsStore } from "@/stores/habitsStore";
import { useNotesStore } from "@/stores/notesstore";
import { useTasksStore } from "@/stores/tasksStore";
import { useUser } from "@clerk/clerk-expo";
import { useEffect } from "react";
import { Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DashboardScreen() {
  const { tasks ,clearTasks, loadTasksFromRemote} = useTasksStore();
  const { habits } = useHabitsStore();
  const { notes } = useNotesStore();
  const { user } = useUser();

 useEffect(() => {
    clearTasks();
    loadTasksFromRemote(user.id);
    // console.log(tasks);
    
  }, [user.id]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Text className="text-3xl">Dashboard Screen</Text>

      <Text className="text-xl">Nombres de taches : {tasks.length}</Text>

      <Text className="text-xl">Nombres de habitudes : {habits.length}</Text>

      <Text className="text-xl">Nombres de notes : {notes.length}</Text>
    </SafeAreaView>
  );
}
