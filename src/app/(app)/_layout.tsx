import { Redirect, Stack } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";
import { ActivityIndicator, View } from "react-native";

export default function AuthRoutesLayout() {
  const { isSignedIn ,isLoaded } = useAuth();

  if (!isLoaded ) {
    return(
      <View style={{flex:1}}>
        <ActivityIndicator size={"large"} color="#00ff00" />
      </View>
    )
  }

  return (
    <Stack >
      <Stack.Protected guard={isSignedIn}>
        <Stack.Screen name="(home)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!isSignedIn}>
        <Stack.Screen name="sign-in" options={{headerShown: false}} />
        <Stack.Screen name="sign-up" options={{headerShown: false}} />
      </Stack.Protected>
    </Stack>
  );
}
