import { Stack } from 'expo-router';

export default function CoinsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="activity" />
    </Stack>
  );
}
