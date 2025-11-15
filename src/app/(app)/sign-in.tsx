import { useSignIn } from '@clerk/clerk-expo'
import { Link, useRouter } from 'expo-router'
import { Text, TextInput, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import GoogleSign from '@/components/GoogleSign'

export default function signInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn()
  


  const router = useRouter()

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    if (!isLoaded) return

    // Start the sign-in process using the email and password provided
    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      })

      // If sign-in process is complete, set the created session as active
      // and redirect the user
      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId })
        router.replace('/')
      } else {
        // If the status isn't complete, check why. User might need to
        // complete further steps.
        console.error(JSON.stringify(signInAttempt, null, 2))
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
    }
  }

  return (
    <SafeAreaView className='flex-1 justify-center items-center bg-violet-900/70'>
      <View className='flex w-full gap-5'>
        <View className='flex px-5 justify-center items-center'>
          <Text className='text-3xl font-bold'>LevelUp Life</Text>
          <Text className='text-xl text-gray-400'>Connectez-vous pour continuer</Text>

       <View className='w-full gap-5 mt-3'>
           <TextInput
          className='bg-white w-full h-16 rounded-full  px-5'
        autoCapitalize="none"
        value={emailAddress}
        placeholder="Enter email"
        onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
      />
        <TextInput
      className='bg-white w-full h-16 rounded-full  px-5'
        value={password}
        placeholder="Enter password"
        secureTextEntry={true}
        onChangeText={(password) => setPassword(password)}
      />

      <TouchableOpacity className='w-full h-16 bg-violet-800 rounded-full flex justify-center items-center ' onPress={onSignInPress}>
        <Text className='text-white'>Connexion</Text>
      </TouchableOpacity>
       </View>
      </View>
      <View className='mt-5'>
        <GoogleSign context='Sign-in'/>
      </View>
      </View>

      <View className='mt-5'>

      <Text className='text-gray-200'>
        Vous n'avez pas de compte ?{' '}
        <Link href='/sign-up' className='font-semibold text-violet-800'>
          S'enregistrer
        </Link>
      </Text>
      </View>
        
    </SafeAreaView>
  )
}