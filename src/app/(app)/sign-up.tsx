import * as React from 'react'
import { Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useSignUp } from '@clerk/clerk-expo'
import { Link, useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import GoogleSign from '@/components/GoogleSign'

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [pendingVerification, setPendingVerification] = React.useState(false)
  const [code, setCode] = React.useState('')

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) return

    // Start sign-up process using email and password provided
    try {
      await signUp.create({
        emailAddress,
        password,
      })

      // Send user an email with verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })

      // Set 'pendingVerification' to true to display second form
      // and capture OTP code
      setPendingVerification(true)
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
    }
  }

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return

    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      })

      // If verification was completed, set the session to active
      // and redirect the user
      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId })
        router.replace('/')
      } else {
        // If the status is not complete, check why. User may need to
        // complete further steps.
        console.error(JSON.stringify(signUpAttempt, null, 2))
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2))
    }
  }

  if (pendingVerification) {
    return (
      <SafeAreaView className=' bg-violet-900/70 px-6 flex-1 justify-center items-center'>
        <Text className='text-3xl text-white font-semibold'>Verifié votre email</Text>
        <TextInput
          className='border my-5 bg-white w-full h-16 rounded-md border-white p-2  mb-4'
          placeholder='Enter verification code'
          onChangeText={(code) => setCode(code)}
        />
        <TouchableOpacity className='border border-white w-24 h-12 justify-center items-center rounded-lg' onPress={onVerifyPress}>
          <Text className='text-white'>Verifié</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className='flex-1 justify-center items-center bg-violet-900/70'>
          <View className='flex w-full gap-5'>
            <View className='flex px-5 justify-center items-center'>
              <Text className='text-3xl font-bold'>LevelUp Life</Text>
              <Text className='text-xl text-gray-400'>Commencer votre Quète</Text>
    
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
    
          <TouchableOpacity className='w-full h-16 bg-violet-800 rounded-full flex justify-center items-center ' onPress={onSignUpPress}>
            <Text className='text-white'>Creer un compte</Text>
          </TouchableOpacity>
           </View>
          </View>
          <View className='mt-5'>
            <GoogleSign context='Sign-up'/>
          </View>
          </View>
    
          <View className='mt-5'>
    
          <Text className='text-gray-200'>
            Vous avez déja un compte ?{' '}
            <Link href='/sign-in' className='font-semibold text-violet-800'>
              se connecter
            </Link>
          </Text>
          </View>
            
        </SafeAreaView>
  )
}