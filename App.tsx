import {
  Component,
  ErrorInfo,
  PropsWithChildren,
  useEffect,
  useState,
} from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from "react-native";
import { SQLiteProvider, useSQLiteContext } from "expo-sqlite";
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  NavigationContainer,
  DarkTheme,
  DefaultTheme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar } from "expo-status-bar";
import Ionicons from "@expo/vector-icons/Ionicons";
import {
  initializeDatabase,
  readTheme,
  writeTheme,
} from "./src/data/recommendations";
import { LibraryProvider } from "./src/data/LibraryProvider";
import { RootStackParams } from "./src/navigation";
import { MyPlaces } from "./src/screens/MyPlaces";
import { Capture } from "./src/screens/Capture";
import { PlaceDetail } from "./src/screens/PlaceDetail";
import { Mode, palettes, serif, ThemeContext, useTheme } from "./src/ui/theme";
import { Heading, IconButton } from "./src/ui/components";

const Stack = createNativeStackNavigator<RootStackParams>();
const Tab = createBottomTabNavigator();
function Header() {
  const { colors: c, mode, toggle } = useTheme();
  return (
    <SafeAreaView edges={["top"]} style={{ backgroundColor: c.surface }}>
      <View style={[s.header, { borderColor: c.line }]}>
        <Image
          source={
            mode === "night"
              ? require("./assets/prototype/nightMark.jpeg")
              : require("./assets/prototype/dayMark.png")
          }
          style={s.mark}
        />
        <View style={{ flex: 1 }}>
          <Text style={[s.brand, { color: c.ink }]}>Goby</Text>
          <Text style={{ color: c.muted, fontSize: 11 }}>
            Where your friends would take you.
          </Text>
        </View>
        <IconButton
          label={`Switch to ${mode === "night" ? "day" : "night"} mode`}
          icon={mode === "night" ? "sunny-outline" : "moon-outline"}
          onPress={toggle}
        />
      </View>
    </SafeAreaView>
  );
}
function ComingSoon({ kind }: { kind: "Discover" | "Plans" }) {
  const { colors: c } = useTheme();
  return (
    <View style={[s.coming, { backgroundColor: c.background }]}>
      <Ionicons
        name={kind === "Discover" ? "earth-outline" : "calendar-outline"}
        size={44}
        color={c.blue}
      />
      <Heading>
        {kind === "Discover"
          ? "Good places. Your people."
          : "Where shall we go?"}
      </Heading>
      <Text style={{ color: c.muted, fontSize: 16, lineHeight: 25 }}>
        {kind === "Discover"
          ? "Friends’ recommendations will live here once accounts and sharing are connected."
          : "Suggest places and choose together. Shared plans and voting are coming after accounts are connected."}
      </Text>
      <Text style={{ color: c.blue, fontSize: 12 }}>Coming next</Text>
    </View>
  );
}
function Tabs() {
  const insets = useSafeAreaInsets();
  const { colors: c } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        header: () => <Header />,
        sceneStyle: { backgroundColor: c.background },
        tabBarStyle: {
          backgroundColor: c.surface,
          borderTopColor: c.line,
          height: 64 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 10),
        },
        tabBarActiveTintColor: c.blue,
        tabBarInactiveTintColor: c.muted,
        tabBarItemStyle: { paddingVertical: 0 },
        tabBarIconStyle: { width: 24, height: 24 },
        tabBarLabelStyle: { fontSize: 12, lineHeight: 18, flexShrink: 0 },
        tabBarIcon: ({ color, size }) => (
          <Ionicons
            name={
              route.name === "My places"
                ? "footsteps-outline"
                : route.name === "Discover"
                  ? "earth-outline"
                  : "calendar-outline"
            }
            color={color}
            size={size}
          />
        ),
      })}
    >
      <Tab.Screen name="My places" component={MyPlaces} />
      <Tab.Screen name="Discover">
        {() => <ComingSoon kind="Discover" />}
      </Tab.Screen>
      <Tab.Screen name="Plans">{() => <ComingSoon kind="Plans" />}</Tab.Screen>
    </Tab.Navigator>
  );
}
function Application() {
  const db = useSQLiteContext(),
    system = useColorScheme();
  const [mode, setMode] = useState<Mode>(system === "light" ? "day" : "night");
  const [ready, setReady] = useState(false),
    [themeError, setThemeError] = useState("");
  useEffect(() => {
    readTheme(db)
      .then((value) => {
        if (value) setMode(value);
      })
      .catch(() => setThemeError("Theme preference could not be loaded."))
      .finally(() => setReady(true));
  }, [db]);
  const c = palettes[mode];
  if (!ready)
    return (
      <View style={[s.loading, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.blue} />
      </View>
    );
  const toggle = () => {
    const next = mode === "night" ? "day" : "night";
    setMode(next);
    setThemeError("");
    void writeTheme(db, next).catch(() =>
      setThemeError(
        "Theme changed for this session; preference could not be saved.",
      ),
    );
  };
  const base = mode === "night" ? DarkTheme : DefaultTheme;
  return (
    <ThemeContext.Provider value={{ mode, colors: c, toggle }}>
      <LibraryProvider>
        <StatusBar style={mode === "night" ? "light" : "dark"} />
        <NavigationContainer
          theme={{
            ...base,
            colors: {
              ...base.colors,
              background: c.background,
              card: c.surface,
              text: c.ink,
              border: c.line,
              primary: c.blue,
            },
          }}
        >
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: c.surface },
              headerTintColor: c.ink,
              contentStyle: { backgroundColor: c.background },
              headerTitleStyle: { fontFamily: serif },
              headerBackButtonDisplayMode: "minimal",
            }}
          >
            <Stack.Screen
              name="Home"
              component={Tabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Place"
              component={PlaceDetail}
              options={{ title: "Your place" }}
            />
            <Stack.Screen
              name="Capture"
              component={Capture}
              options={({ route }) => ({
                title: route.params?.id ? "Edit place" : "Add a place",
                presentation: "modal",
              })}
            />
          </Stack.Navigator>
        </NavigationContainer>
        {!!themeError && (
          <Text
            accessibilityRole="alert"
            style={{ padding: 10, backgroundColor: c.surface, color: c.error }}
          >
            {themeError}
          </Text>
        )}
      </LibraryProvider>
    </ThemeContext.Provider>
  );
}
class StartupBoundary extends Component<
  PropsWithChildren,
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(_error: Error, _info: ErrorInfo) {
    /* Keep local data errors out of telemetry. */
  }
  render() {
    return this.state.failed ? (
      <View style={s.loading}>
        <Text>Goby couldn’t open your local notebook.</Text>
        <Text>Please close and reopen the app to try again.</Text>
      </View>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  return (
    <SafeAreaProvider>
      <StartupBoundary>
        <SQLiteProvider
          databaseName="goby-guest.db"
          onInit={initializeDatabase}
        >
          <Application />
        </SQLiteProvider>
      </StartupBoundary>
    </SafeAreaProvider>
  );
}
const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  mark: { width: 38, height: 38, borderRadius: 19 },
  brand: {
    fontFamily: serif,
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: -1,
  },
  coming: { flex: 1, justifyContent: "center", padding: 28, gap: 22 },
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
    backgroundColor: "#FAF8F2",
  },
});
