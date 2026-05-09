import React from "react";
import { Pressable, Text, View } from "react-native";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.warn("[ErrorBoundary]", error.message, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#F2F4F8",
            padding: 32,
          }}
        >
          <Text style={{ fontSize: 48, marginBottom: 16 }}>😕</Text>
          <Text
            style={{
              fontSize: 20,
              fontWeight: "800",
              color: "#0D1B2A",
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Something went wrong
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#6B7280",
              textAlign: "center",
              marginBottom: 28,
              lineHeight: 22,
            }}
          >
            We hit an unexpected error. Please try refreshing the page.
          </Text>
          <Pressable
            onPress={() => this.setState({ hasError: false, error: null })}
            style={{
              backgroundColor: "#0066CC",
              borderRadius: 12,
              paddingHorizontal: 28,
              paddingVertical: 13,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "700" }}>
              Try Again
            </Text>
          </Pressable>
          {__DEV__ && this.state.error ? (
            <Text
              style={{
                marginTop: 20,
                fontSize: 11,
                color: "#9CA3AF",
                fontFamily: "monospace",
                textAlign: "center",
              }}
            >
              {this.state.error.message}
            </Text>
          ) : null}
        </View>
      );
    }

    return this.props.children;
  }
}
