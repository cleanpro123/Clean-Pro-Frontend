import React from 'react';
import LoginScreen from '../../shared/screens/LoginScreen';

export default function AdminLoginScreen(props) {
  return <LoginScreen {...props} role="admin" />;
}
