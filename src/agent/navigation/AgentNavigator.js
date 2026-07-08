import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AgentRequestsScreen from '../screens/AgentRequestsScreen';
import AgentRequestDetailScreen from '../screens/AgentRequestDetailScreen';
import AgentProfileScreen from '../screens/AgentProfileScreen';

const Stack = createNativeStackNavigator();

export default function AgentNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="AgentTabs"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="AgentTabs" component={AgentRequestsScreen} />
      <Stack.Screen name="AgentRequestDetail" component={AgentRequestDetailScreen} />
      <Stack.Screen name="AgentProfile" component={AgentProfileScreen} />
    </Stack.Navigator>
  );
}
