import { View, Text, Image } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SignedIn } from '@clerk/clerk-expo'
import { SignOutButton } from '@/components/SignOutButton'
import {  useUser } from '@clerk/clerk-react'

export default function ProfileScreen() {
   const { user } = useUser()
  
  return (
     <SafeAreaView style={{ flex: 1 }}>
      <SignedIn>
       <Image source={{ uri: user.imageUrl }} style={{ width: 60, height: 60, borderRadius: 30 }} />
      <Text style={{ marginTop: 10, fontWeight: 'bold' }}>
        {user.firstName} {user.lastName}
      </Text>
      <Text style={{ color: '#666' }}>{user.primaryEmailAddress?.emailAddress}</Text>
        <SignOutButton />
      </SignedIn>
      
    </SafeAreaView>
  )
}