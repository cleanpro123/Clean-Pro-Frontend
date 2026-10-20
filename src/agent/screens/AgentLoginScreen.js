import React from 'react';
import LoginScreen from '../../shared/screens/LoginScreen';

export default function AgentLoginScreen(props) {
  return <LoginScreen {...props} role="agent" />;
}
