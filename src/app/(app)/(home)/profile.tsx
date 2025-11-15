import { View, Text } from 'react-native'
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
        <Text>Hello {user?.emailAddresses[0].emailAddress}</Text>
        <SignOutButton />
      </SignedIn>
      
    </SafeAreaView>
  )
}