import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';

import AdvertiserHomeScreen from '../screens/advertiser/AdvertiserHomeScreen';
import MyCampaignsScreen from '../screens/advertiser/MyCampaignsScreen';
import CreateCampaignScreen from '../screens/advertiser/CreateCampaignScreen';
import AdvertiserProfileScreen from '../screens/advertiser/AdvertiserProfileScreen';

const Tab = createBottomTabNavigator();

export default function AdvertiserTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'MyCampaigns') iconName = focused ? 'megaphone' : 'megaphone-outline';
          else if (route.name === 'CreateCampaign') iconName = focused ? 'add-circle' : 'add-circle-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#8b5cf6',
        tabBarInactiveTintColor: '#52525b',
        tabBarStyle: {
          backgroundColor: '#0f0f12',
          borderTopColor: '#1f1f23',
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 24,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerShown: false,
      })}>
      <Tab.Screen name="Home" component={AdvertiserHomeScreen} options={{ title: 'হোম' }} />
      <Tab.Screen name="MyCampaigns" component={MyCampaignsScreen} options={{ title: 'ক্যাম্পেইন' }} />
      <Tab.Screen name="CreateCampaign" component={CreateCampaignScreen} options={{ title: 'নতুন' }} />
      <Tab.Screen name="Profile" component={AdvertiserProfileScreen} options={{ title: 'প্রোফাইল' }} />
    </Tab.Navigator>
  );
}



