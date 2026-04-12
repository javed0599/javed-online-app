import React from 'react';
import { View, Text, Pressable } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/use-colors';
import * as Haptics from 'expo-haptics';

interface ErrorDisplayProps {
  error: string | Error;
  onRetry?: () => void;
  onDismiss?: () => void;
  title?: string;
  suggestion?: string;
}

export function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  title = 'Something went wrong',
  suggestion,
}: ErrorDisplayProps) {
  const colors = useColors();
  const errorMessage = error instanceof Error ? error.message : String(error);

  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRetry?.();
  };

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss?.();
  };

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginVertical: 12,
        borderLeftWidth: 4,
        borderLeftColor: colors.error,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <MaterialIcons name="error-outline" size={24} color={colors.error} />
        <Text
          style={{
            fontSize: 16,
            fontWeight: '600',
            color: colors.foreground,
            marginLeft: 12,
            flex: 1,
          }}
        >
          {title}
        </Text>
      </View>

      {/* Error message */}
      <Text
        style={{
          fontSize: 14,
          color: colors.muted,
          marginBottom: 8,
          lineHeight: 20,
        }}
      >
        {errorMessage}
      </Text>

      {/* Suggestion */}
      {suggestion && (
        <View style={{ backgroundColor: colors.background, borderRadius: 8, padding: 8, marginBottom: 12 }}>
          <Text
            style={{
              fontSize: 13,
              color: colors.primary,
              lineHeight: 18,
            }}
          >
            💡 {suggestion}
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {onRetry && (
          <Pressable
            onPress={handleRetry}
            style={({ pressed }) => [
              {
                flex: 1,
                backgroundColor: colors.primary,
                borderRadius: 8,
                paddingVertical: 10,
                paddingHorizontal: 12,
                alignItems: 'center',
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text style={{ color: colors.background, fontWeight: '600', fontSize: 14 }}>
              Retry
            </Text>
          </Pressable>
        )}
        {onDismiss && (
          <Pressable
            onPress={handleDismiss}
            style={({ pressed }) => [
              {
                flex: 1,
                backgroundColor: colors.border,
                borderRadius: 8,
                paddingVertical: 10,
                paddingHorizontal: 12,
                alignItems: 'center',
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: 14 }}>
              Dismiss
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: (error: Error, retry: () => void) => React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  retry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.retry);
      }

      return (
        <View style={{ flex: 1, padding: 16, justifyContent: 'center' }}>
          <ErrorDisplay
            error={this.state.error}
            onRetry={this.retry}
            title="Application Error"
            suggestion="Try refreshing the app or clearing the cache in settings."
          />
        </View>
      );
    }

    return this.props.children;
  }
}
