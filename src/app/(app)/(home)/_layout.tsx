import { Tabs } from 'expo-router/tabs'

import { useUser } from '@clerk/clerk-expo';
import { useGlobalNetworkSync } from '@/lib/network';



export default function Layout() {

  const { user } = useUser(); // Clerk
  
  // Active la surveillance de la connexion
  useGlobalNetworkSync(user?.id);
  
  return <Tabs >
    <Tabs.Screen name="index" options={{ title: "Home", headerShown:false }} />
    <Tabs.Screen name="taches" options={{ title: "taches", headerShown:false }} />
    <Tabs.Screen name="habitudes" options={{ title: "habitudes", headerShown:false }} />
    <Tabs.Screen name="(notes)" options={{ title: "notes", headerShown:false }} />
    <Tabs.Screen name="profile" options={{ title: "Profile", headerShown:false }} />
  </Tabs>
}