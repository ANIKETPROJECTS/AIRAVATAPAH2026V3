import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants';

import WelcomeScreen from '../screens/WelcomeScreen';
import LoginScreen from '../screens/LoginScreen';
import OtpScreen from '../screens/OtpScreen';
import DocumentUploadScreen from '../screens/DocumentUploadScreen';
import PendingScreen from '../screens/PendingScreen';
import HomeScreen from '../screens/HomeScreen';
import SchemesScreen from '../screens/SchemesScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProfileScreen from '../screens/ProfileScreen';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Otp: { mobile: string; devOtp?: string };
  DocumentUpload: undefined;
  Pending: undefined;
  Main: undefined;
};

export type TabParamList = {
  Home: undefined;
  Schemes: undefined;
  Notifications: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🏠',
    Schemes: '📋',
    Notifications: '🔔',
    Profile: '👤',
  };
  return (
    <View style={{ opacity: focused ? 1 : 0.5 }}>
      {/* icon placeholder — rendered as text emoji */}
      <View />
    </View>
  );
}

function MainTabs() {
  const { state } = useAuth();
  const lang = state.lang;

  const tabLabels: Record<string, Record<string, string>> = {
    en: { Home: 'Home', Schemes: 'Schemes', Notifications: 'Alerts', Profile: 'Profile' },
    hi: { Home: 'होम', Schemes: 'योजनाएं', Notifications: 'सूचनाएं', Profile: 'प्रोफ़ाइल' },
    mr: { Home: 'होम', Schemes: 'योजना', Notifications: 'सूचना', Profile: 'प्रोफाइल' },
  };
  const labels = tabLabels[lang] ?? tabLabels['en'];

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          paddingBottom: 4,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: labels['Home'], tabBarIcon: ({ focused }) => <TabIcon name="Home" focused={focused} /> }}
      />
      <Tab.Screen
        name="Schemes"
        component={SchemesScreen}
        options={{ title: labels['Schemes'], tabBarIcon: ({ focused }) => <TabIcon name="Schemes" focused={focused} /> }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ title: labels['Notifications'], tabBarIcon: ({ focused }) => <TabIcon name="Notifications" focused={focused} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: labels['Profile'], tabBarIcon: ({ focused }) => <TabIcon name="Profile" focused={focused} /> }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { state } = useAuth();

  if (state.loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primaryBg }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {!state.token ? (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Otp" component={OtpScreen} />
          </>
        ) : state.farmer?.status === 'Active' ? (
          <Stack.Screen name="Main" component={MainTabs} />
        ) : state.farmer?.status === 'Pending' ? (
          <Stack.Screen name="Pending" component={PendingScreen} />
        ) : (
          <Stack.Screen name="DocumentUpload" component={DocumentUploadScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
