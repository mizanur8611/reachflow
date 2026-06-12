import KYCScreen from './src/screens/promoter/KYCScreen';
import TrackingLinkScreen from './src/screens/promoter/TrackingLinkScreen';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import LeaderboardScreen from './src/screens/promoter/LeaderboardScreen';
import ReferralScreen from './src/screens/promoter/ReferralScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import AdvertiserTabs from './src/navigation/AdvertiserTabs';
import PromoterTabs from './src/navigation/PromoterTabs';
import MessagesScreen from './src/screens/promoter/MessagesScreen';
import ChatScreen from './src/screens/promoter/ChatScreen';
import DisputesScreen from './src/screens/promoter/DisputesScreen';
import PasswordChangeScreen from './src/screens/promoter/PasswordChangeScreen';
import ProfileEditScreen from './src/screens/promoter/ProfileEditScreen';
import WithdrawScreen from './src/screens/promoter/WithdrawScreen';
import SettingsScreen from './src/screens/promoter/SettingsScreen';
import AdvertiserWalletScreen from './src/screens/advertiser/AdvertiserWalletScreen';
import AnalyticsScreen from './src/screens/advertiser/AnalyticsScreen';
import CampaignDetailScreen from './src/screens/advertiser/CampaignDetailScreen';
import SubscriptionScreen from './src/screens/advertiser/SubscriptionScreen';
import NotificationScreen from './src/screens/advertiser/NotificationScreen';
import CreateCampaignScreen from './src/screens/advertiser/CreateCampaignScreen';

const Stack = createStackNavigator();

function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : user.role === 'PROMOTER' ? (
        <>
          <Stack.Screen name="PromoterTabs" component={PromoterTabs} />
          <Stack.Screen name="KYC" component={KYCScreen} />
          <Stack.Screen name="TrackingLink" component={TrackingLinkScreen} />
          <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
          <Stack.Screen name="Referral" component={ReferralScreen} />
          <Stack.Screen name="Messages" component={MessagesScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="Disputes" component={DisputesScreen} />
          <Stack.Screen name="PasswordChange" component={PasswordChangeScreen} />
          <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
          <Stack.Screen name="Withdraw" component={WithdrawScreen} />
          <Stack.Screen name="Notifications" component={NotificationScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="AdvertiserTabs" component={AdvertiserTabs} />
          <Stack.Screen name="AdvertiserWallet" component={AdvertiserWalletScreen} />
          <Stack.Screen name="Analytics" component={AnalyticsScreen} />
          <Stack.Screen name="CampaignDetail" component={CampaignDetailScreen} />
          <Stack.Screen name="Subscription" component={SubscriptionScreen} />
          <Stack.Screen name="Notifications" component={NotificationScreen} />
          <Stack.Screen name="Messages" component={MessagesScreen} />
          <Stack.Screen name="Chat" component={ChatScreen} />
          <Stack.Screen name="PasswordChange" component={PasswordChangeScreen} />
          <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
          <Stack.Screen name="Withdraw" component={WithdrawScreen} />
          <Stack.Screen name="CreateCampaign" component={CreateCampaignScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NavigationContainer
          onError={(error) => {
            console.error('Navigation error:', error);
          }}
        >
          <StatusBar style="auto" />
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </ThemeProvider>
  );
}



