import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold, useFonts } from "@expo-google-fonts/plus-jakarta-sans";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LogoLoader } from "@/components/Logo";
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
  // The animated logo stays up briefly on launch so it reads as a calm start, not a flash.
  const [minDone, setMinDone] = useState(false);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    const t = setTimeout(() => setMinDone(true), 900);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!ready || !loaded) return;
    const onSignIn = segments[0] === "sign-in";
    if (!me && !onSignIn) router.replace("/sign-in");
    else if (me && onSignIn) router.replace(prefs.onboarded ? "/" : "/onboarding");
  }, [ready, loaded, me, segments, router, prefs.onboarded]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="sign-in" options={{ gestureEnabled: false }} />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="recipe/[id]" />
        <Stack.Screen name="pantry" />
        <Stack.Screen name="collection/[id]" />
        <Stack.Screen name="household" />
      </Stack>
      {!(ready && loaded && minDone) && (
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center", backgroundColor: C.bg }}>
          <LogoLoader size={150} />
        </View>
      )}
    </>
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
