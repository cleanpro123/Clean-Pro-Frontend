import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/HomeScreen';
import ServicesScreen from '../screens/ServicesScreen';
import OrdersScreen from '../screens/OrdersScreen';
import OrderDetailScreen from '../screens/OrderDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import BookingScreen from '../screens/BookingScreen';
import ConfirmOrderScreen from '../screens/ConfirmOrderScreen';
import AddressesScreen from '../screens/AddressesScreen';
import AddAddressScreen from '../screens/AddAddressScreen';
import RateOrderScreen from '../screens/RateOrderScreen';
import MyReviewsScreen from '../screens/MyReviewsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PrivacyCenterScreen from '../screens/PrivacyCenterScreen';
import SecurityScreen from '../screens/SecurityScreen';
import HelpCenterScreen from '../screens/HelpCenterScreen';
import ContactSupportScreen from '../screens/ContactSupportScreen';
import FaqsScreen from '../screens/FaqsScreen';
import ForgotPasswordScreen from '../../shared/screens/ForgotPasswordScreen';
import CustomTabBar from '../components/CustomTabBar';

import { useTheme } from '../../shared/theme/ThemeContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Services" component={ServicesScreen} />
      <Tab.Screen name="Orders" component={OrdersScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function UserNavigator() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={Tabs}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Booking"
        component={BookingScreen}
        options={{ title: 'Select clothes' }}
      />
      <Stack.Screen
        name="ConfirmOrder"
        component={ConfirmOrderScreen}
        options={{ title: 'Confirm order' }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Edit profile' }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Addresses"
        component={AddressesScreen}
        options={{ title: 'Saved addresses' }}
      />
      <Stack.Screen
        name="AddAddress"
        component={AddAddressScreen}
        options={{ title: 'Add new address' }}
      />
      <Stack.Screen
        name="OrderDetail"
        component={OrderDetailScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="RateOrder"
        component={RateOrderScreen}
        options={{ title: 'Rate your order' }}
      />
      <Stack.Screen
        name="MyReviews"
        component={MyReviewsScreen}
        options={{ title: 'My reviews' }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="PrivacyCenter"
        component={PrivacyCenterScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="Security"
        component={SecurityScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="HelpCenter"
        component={HelpCenterScreen}
        options={{ title: 'Help center' }}
      />
      <Stack.Screen
        name="ContactSupport"
        component={ContactSupportScreen}
        options={{ title: 'Contact support' }}
      />
      <Stack.Screen
        name="Faqs"
        component={FaqsScreen}
        options={{ title: 'FAQs' }}
      />
    </Stack.Navigator>
  );
}
