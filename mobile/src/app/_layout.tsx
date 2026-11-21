import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold, useFonts } from "@expo-google-fonts/plus-jakarta-sans";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "@/lib/auth";
import { DataProvider } from "@/lib/data";
import { PrefsProvider, usePrefs } from "@/lib/prefs";
import { C } from "@/lib/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

function Gate() {
  const { ready, me } = useAuth();
  const { loaded, prefs } = usePrefs();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (!ready || !loaded) return;
    SplashScreen.hideAsync().catch(() => {});
    const onSignIn = segments[0] === "sign-in";
    if (!me && !onSignIn) router.replace("/sign-in");
    else if (me && onSignIn) router.replace(prefs.onboarded ? "/" : "/onboarding");
  }, [ready, loaded, me, segments, router, prefs.onboarded]);

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="sign-in" options={{ gestureEnabled: false }} />
      <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
      <Stack.Screen name="recipe/[id]" />
      <Stack.Screen name="pantry" />
      <Stack.Screen name="collection/[id]" />
      <Stack.Screen name="household" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold });
  if (!fontsLoaded) return null;
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <PrefsProvider>
          <DataProvider>
            <Gate />
          </DataProvider>
        </PrefsProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
