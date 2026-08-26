import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: -4,
          paddingBottom: 4,
        },
        tabBarStyle: {
          backgroundColor: '#0a0a1a', 
          borderTopColor: '#1a1a3a',
          height: 70,
          paddingBottom: 8,
          paddingTop: 8,
          elevation: 0, // Removes Android shadow for a flatter, modern look
          shadowOpacity: 0, // Removes iOS shadow
        },
        tabBarActiveTintColor: '#818cf8', // A beautiful, vibrant indigo
        tabBarInactiveTintColor: '#6b7280', // A clean, readable gray
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="leaderboards"
        options={{
          title: 'Leaderboards',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'trophy' : 'trophy-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: 'Friends',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
