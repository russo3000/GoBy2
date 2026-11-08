import { createContext, useContext } from "react";
import { Platform } from "react-native";

export const palettes = {
  night: {
    background: "#10161B",
    surface: "#192229",
    ink: "#F0F4F7",
    muted: "#B6C4CF",
    blue: "#8DCCFF",
    line: "#34404A",
    selected: "#233949",
    buttonInk: "#102736",
    error: "#FFB8AD",
  },
  day: {
    background: "#FAF8F2",
    surface: "#FFFDF7",
    ink: "#1E3038",
    muted: "#52636A",
    blue: "#0969AE",
    line: "#D9DFDC",
    selected: "#E3EFF7",
    buttonInk: "#FFFFFF",
    error: "#A52F25",
  },
};
export type Mode = keyof typeof palettes;
export const ThemeContext = createContext({
  mode: "night" as Mode,
  colors: palettes.night,
  toggle: () => {},
});
export const useTheme = () => useContext(ThemeContext);
export const serif = Platform.select({
  ios: "Georgia",
  android: "serif",
  default: "Georgia",
});
