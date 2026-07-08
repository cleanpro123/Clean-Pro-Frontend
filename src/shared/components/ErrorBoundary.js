// Top-level React error boundary. Catches any render/lifecycle error anywhere
// below it so a single bad screen can't white-screen the whole app. Shows the
// "crash" StatusScreen with a "Try again" that remounts the tree.
//
// NOTE: error boundaries only catch errors during render, in lifecycles, and in
// constructors of the components below them — NOT async/event-handler errors
// (those are handled where they're thrown, e.g. the API client / try-catch).
import React from 'react';
import StatusScreen from './StatusScreen';
import { captureException } from '../monitoring/sentry';

export default class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    if (__DEV__) {
      console.error('Uncaught error:', error, info?.componentStack);
    }
    // Report to Sentry (no-op unless a DSN is configured).
    captureException(error, { componentStack: info?.componentStack });
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      return (
        <StatusScreen
          preset="crash"
          onAction={this.reset}
          detail={__DEV__ ? String(this.state.error?.message || this.state.error) : undefined}
        />
      );
    }
    return this.props.children;
  }
}
