import Ionicons from "@expo/vector-icons/Ionicons";
import { ComponentProps, PropsWithChildren } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { serif, useTheme } from "./theme";

export function IconButton({
  icon,
  label,
  onPress,
  primary = false,
  disabled = false,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  label: string;
  onPress: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  const { colors: c } = useTheme();
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.icon,
        {
          backgroundColor: primary ? c.blue : c.selected,
          opacity: pressed || disabled ? 0.5 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={23} color={primary ? c.buttonInk : c.blue} />
    </Pressable>
  );
}
export function Button({
  children,
  onPress,
  disabled = false,
  secondary = false,
}: PropsWithChildren<{
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}>) {
  const { colors: c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        s.button,
        {
          backgroundColor: secondary ? c.selected : c.blue,
          opacity: disabled || pressed ? 0.5 : 1,
        },
      ]}
    >
      <Text
        style={{
          fontSize: 16,
          fontWeight: "600",
          color: secondary ? c.blue : c.buttonInk,
        }}
      >
        {children}
      </Text>
    </Pressable>
  );
}
export function Heading({ children }: PropsWithChildren) {
  const { colors: c } = useTheme();
  return (
    <Text
      accessibilityRole="header"
      style={{
        fontFamily: serif,
        fontSize: 34,
        letterSpacing: -1,
        color: c.ink,
      }}
    >
      {children}
    </Text>
  );
}
export function LocalNote() {
  const { colors: c } = useTheme();
  return (
    <View style={s.note}>
      <Ionicons name="lock-closed-outline" size={13} color={c.muted} />
      <Text style={{ color: c.muted, fontSize: 12 }}>
        Only on this device · No account sync yet
      </Text>
    </View>
  );
}
const s = StyleSheet.create({
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  button: {
    minHeight: 48,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: "center",
  },
  note: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    justifyContent: "center",
    paddingVertical: 20,
  },
});
