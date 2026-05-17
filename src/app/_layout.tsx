import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import CinematicIntro from '../components/ui/CinematicIntro';
import { useSessionStore } from '../core/sessionStore';

// Keep the native splash screen visible until our React tree mounts
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    async function prepare() {
      try {
        // Artificial delay representing actual asset/model preloading
        await new Promise(resolve => setTimeout(resolve, 800));
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
        // Hide the native splash seamlessly, handing control to CinematicIntro
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  if (!isReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding/index" options={{ headerShown: false }} />
        <Stack.Screen name="session/[id]" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="session/reflection" options={{ headerShown: false, presentation: 'transparentModal', animation: 'fade' }} />
      </Stack>
      <StatusBar style="light" />
      {showIntro && <CinematicIntro onComplete={() => {
        setShowIntro(false);
        useSessionStore.getState().completeIntro();
      }} />}
    </GestureHandlerRootView>
  );
}
