
import { Stack } from 'expo-router'




export default function _layout() {

 
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="Edit" options={{ headerShown: false,   }} />
     </Stack>
  )
}