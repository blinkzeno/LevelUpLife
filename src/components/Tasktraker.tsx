import { View, Text, TouchableOpacity } from 'react-native'
import React, { useEffect, useState } from 'react'
import { config, ID, tables } from '@/appwriter.config'
import { useUser } from '@clerk/clerk-expo'

export default function Tasktraker() {
     const[tasks , setTasks] = useState<any>([])
    const {user} = useUser()
    

    useEffect(() => {
        getTasks()
    }, [])

    const getTasks = async () => {
        try {
            
            const { rows} = await tables.listRows({databaseId: config.databaseId, tableId: config.tableTaskId})
            setTasks(rows)
        } catch (error) {
            console.error(error)
        }
    }

    const createTask = async () => {
      try {
          await tables.createRow({databaseId: config.databaseId, tableId: config.tableTaskId, rowId: ID.unique(), data: {title: "New Task", clerkUserId: user.id}})
        
      } catch (error) {
        console.log("Error creating task:", error);
        
      }
        // await tables.createRow({databaseId: config.databaseId, tableId: config.tableTaskId, rowId: ID.unique(), data: {name: "New Task"}})
    }

  return (
    <View >

        <TouchableOpacity className='p-2 w-full h-12 rounded-lg bg-blue-500' onPress={createTask}><Text className='text-white'>Create Task</Text></TouchableOpacity>
      <Text>
        {tasks.length.toString()}
      </Text>
      {tasks.map((task:any) => (
        <Text key={task.$id}>
          {task.title}
        </Text>
      ))}

      
      {/* <Button style={{width: 100}} title="Create Task" onPress={createTask} /> */}
    </View>
  )
}