import { Tabs } from 'expo-router/tabs'

export default function Layout() {
  return <Tabs >
    <Tabs.Screen name="index" options={{ title: "Home", headerShown:false }} />
    <Tabs.Screen name="taches" options={{ title: "taches", headerShown:false }} />
    <Tabs.Screen name="habitudes" options={{ title: "habitudes", headerShown:false }} />
    <Tabs.Screen name="notes" options={{ title: "notes", headerShown:false }} />
    <Tabs.Screen name="profile" options={{ title: "Profile", headerShown:false }} />
  </Tabs>
}