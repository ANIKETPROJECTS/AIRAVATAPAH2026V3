import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { reloadAppAsync } from "expo";
import palette from "@/constants/colors";

const colors = palette.light;

interface State { hasError: boolean; error: Error | null }

function ErrorFallback({ error }: { error: Error | null }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 40 }]}>
      <Text style={styles.icon}>!</Text>
      <Text style={styles.title}>Something went wrong</Text>
      <Text style={styles.message}>{error?.message ?? "An unexpected error occurred"}</Text>
      <TouchableOpacity style={styles.button} onPress={() => reloadAppAsync()}>
        <Text style={styles.buttonText}>Restart App</Text>
      </TouchableOpacity>
    </View>
  );
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) return <ErrorFallback error={this.state.error} />;
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  icon: {
    fontSize: 48,
    fontWeight: "bold" as const,
    color: colors.destructive,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: colors.foreground,
    marginBottom: 8,
    textAlign: "center",
  },
  message: {
    fontSize: 14,
    color: colors.mutedForeground,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 20,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: colors.radius,
  },
  buttonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "600" as const,
  },
});
