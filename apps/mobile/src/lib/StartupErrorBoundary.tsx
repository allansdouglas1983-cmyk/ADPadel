import React from 'react';
import { ScrollView, Text, View } from 'react-native';

/** Module-level capture for errors thrown OUTSIDE React render (async / bridge). */
let globalError: Error | null = null;
const listeners = new Set<() => void>();

export function reportStartupError(err: unknown): void {
  globalError = err instanceof Error ? err : new Error(String(err));
  listeners.forEach((l) => l());
}

/**
 * A last-resort boundary that renders the ACTUAL error text on screen instead of
 * letting the app close silently. Catches React render errors and (via
 * reportStartupError + the global handler) uncaught async errors, so a startup
 * failure is visible and screenshot-able rather than a half-second crash.
 */
export class StartupErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: globalError };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidMount() {
    const sync = () => this.setState({ error: globalError });
    listeners.add(sync);
    // Also surface any error captured before mount.
    if (globalError && !this.state.error) sync();
  }

  render() {
    const error = this.state.error;
    if (!error) return this.props.children;
    return (
      <View style={{ flex: 1, backgroundColor: '#0B0F14', padding: 24, paddingTop: 80 }}>
        <Text style={{ color: '#FF6369', fontSize: 20, fontWeight: '700', marginBottom: 12 }}>
          Marque hit a startup error
        </Text>
        <Text style={{ color: '#F5B301', fontSize: 15, marginBottom: 12 }}>
          {error.name}: {error.message}
        </Text>
        <ScrollView style={{ flex: 1 }}>
          <Text style={{ color: '#A9B6C2', fontSize: 12, fontFamily: 'monospace' }}>
            {error.stack ?? '(no stack)'}
          </Text>
        </ScrollView>
      </View>
    );
  }
}
