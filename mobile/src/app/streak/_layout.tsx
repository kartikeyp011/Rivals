import { Stack } from 'expo-router';

export default function StreakLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="recovery" />
    </Stack>
  );
}
