import { Stack } from 'expo-router';

export default function ArenaLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="word-duel" />
      <Stack.Screen name="cipher-break" />
      <Stack.Screen name="number-rush" />
      <Stack.Screen name="results" />
    </Stack>
  );
}
