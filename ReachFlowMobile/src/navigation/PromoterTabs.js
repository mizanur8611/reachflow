import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

import HomeScreen from '../screens/promoter/HomeScreen';
import CampaignsScreen from '../screens/promoter/PromoterCampaigns';
import EarningsScreen from '../screens/promoter/EarningsScreen';
import ProfileScreen from '../screens/promoter/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function PromoterTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Campaigns') iconName = focused ? 'megaphone' : 'megaphone-outline';
          else if (route.name === 'Earnings') iconName = focused ? 'wallet' : 'wallet-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#6C63FF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f0f12',
          borderTopColor: '#1f1f23',
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 24,
          paddingTop: 4,
        },
      })}>
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'হোম' }} />
      <Tab.Screen name="Campaigns" component={CampaignsScreen} options={{ title: 'ক্যাম্পেইন' }} />
      <Tab.Screen name="Earnings" component={EarningsScreen} options={{ title: 'আয়' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'প্রোফাইল' }} />
    </Tab.Navigator>
  );
}
