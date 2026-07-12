import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AdminMenuScreen from '../screens/AdminMenuScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminRequestsScreen from '../screens/AdminRequestsScreen';
import AdminRequestViewScreen from '../screens/AdminRequestViewScreen';
import AdminUsersScreen from '../screens/AdminUsersScreen';
import AdminUserDetailScreen from '../screens/AdminUserDetailScreen';
import AdminAgentsScreen from '../screens/AdminAgentsScreen';
import AdminAgentDetailScreen from '../screens/AdminAgentDetailScreen';
import AdminServicesScreen from '../screens/AdminServicesScreen';
import AdminMapsScreen from '../screens/AdminMapsScreen';
import AdminMapDetailScreen from '../screens/AdminMapDetailScreen';
import AdminItemsScreen from '../screens/AdminItemsScreen';
import AdminOffersScreen from '../screens/AdminOffersScreen';
import AdminReviewsScreen from '../screens/AdminReviewsScreen';
import AdminAdminsScreen from '../screens/AdminAdminsScreen';

const Stack = createNativeStackNavigator();

export default function AdminNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="AdminMenu"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="AdminMenu" component={AdminMenuScreen} />
      <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Stack.Screen name="AdminRequests" component={AdminRequestsScreen} />
      <Stack.Screen name="AdminRequestView" component={AdminRequestViewScreen} />
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
      <Stack.Screen name="AdminUserDetail" component={AdminUserDetailScreen} />
      <Stack.Screen name="AdminAgents" component={AdminAgentsScreen} />
      <Stack.Screen name="AdminAgentDetail" component={AdminAgentDetailScreen} />
      <Stack.Screen name="AdminServices" component={AdminServicesScreen} />
      <Stack.Screen name="AdminMaps" component={AdminMapsScreen} />
      <Stack.Screen name="AdminMapDetail" component={AdminMapDetailScreen} />
      <Stack.Screen name="AdminItems" component={AdminItemsScreen} />
      <Stack.Screen name="AdminOffers" component={AdminOffersScreen} />
      <Stack.Screen name="AdminReviews" component={AdminReviewsScreen} />
      <Stack.Screen name="AdminAdmins" component={AdminAdminsScreen} />
    </Stack.Navigator>
  );
}
