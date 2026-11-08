import Ionicons from "@expo/vector-icons/Ionicons";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useState } from "react";
import { RootStackParams } from "../navigation";
import { useLibrary } from "../data/LibraryProvider";
import { Button, Heading, LocalNote } from "../ui/components";
import { serif, useTheme } from "../ui/theme";

export function PlaceDetail({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParams, "Place">) {
  const { colors: c } = useTheme();
  const { places, lists } = useLibrary();
  const place = places.find((p) => p.id === route.params.id);
  const [error, setError] = useState("");
  if (!place)
    return (
      <View style={s.body}>
        <Text style={{ color: c.ink }}>This place could not be found.</Text>
        <Button secondary onPress={() => navigation.goBack()}>
          Back to my places
        </Button>
      </View>
    );
  const list = lists.find((l) => l.id === place.list_id);
  async function directions() {
    if (!place) return;
    setError("");
    try {
      await Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([place.title, place.city].filter(Boolean).join(", "))}`,
      );
    } catch {
      setError("Could not open maps. Please try again.");
    }
  }
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
      <View style={[s.hero, { backgroundColor: c.selected }]}>
        {place.photo_uri ? (
          <Image
            source={{ uri: place.photo_uri }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <Ionicons name="location-outline" size={64} color={c.blue} />
        )}
        <View style={s.heroLabel}>
          <Text style={{ color: "#FFFFFF", fontSize: 12 }}>
            YOUR OWN GOOD FIND
          </Text>
        </View>
      </View>
      <View style={s.body}>
        <Text style={[s.city, { color: c.blue }]}>
          {place.city || "A place worth keeping"}
        </Text>
        <Heading>{place.title}</Heading>
        {place.tip ? (
          <Text style={[s.quote, { color: c.ink, borderColor: c.blue }]}>
            “{place.tip}”
          </Text>
        ) : (
          <Text style={{ color: c.muted, lineHeight: 24 }}>
            What would you tell a friend about this place? Add your insider tip.
          </Text>
        )}
        <View style={s.author}>
          <View style={[s.avatar, { backgroundColor: c.selected }]}>
            <Ionicons name="person-outline" color={c.blue} size={18} />
          </View>
          <Text style={{ color: c.muted }}>Recommended by you</Text>
        </View>
        <View style={[s.facts, { borderColor: c.line }]}>
          <Text style={{ color: c.muted, fontSize: 12 }}>SAVED IN</Text>
          <Text style={{ color: c.ink, fontSize: 18, fontFamily: serif }}>
            {list?.name || "Places to keep"}
          </Text>
          <Text style={{ color: c.muted, fontSize: 12 }}>
            Saved {new Date(place.created_at).toLocaleDateString()}
          </Text>
        </View>
        <Button
          onPress={() => navigation.navigate("Capture", { id: place.id })}
        >
          Edit place
        </Button>
        <Button secondary onPress={directions}>
          Find in maps ↗
        </Button>
        <Text style={{ color: c.muted, fontSize: 12, lineHeight: 18 }}>
          Maps searches by name{place.city ? " and city" : ""}. The location
          hasn’t been verified.
        </Text>
        {!!error && (
          <Text accessibilityRole="alert" style={{ color: c.error }}>
            {error}
          </Text>
        )}
        <LocalNote />
      </View>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  hero: { height: 260, alignItems: "center", justifyContent: "center" },
  heroLabel: {
    position: "absolute",
    bottom: 16,
    left: 20,
    backgroundColor: "#10161BCC",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  body: { padding: 24, gap: 20 },
  city: { fontSize: 13, fontWeight: "600" },
  quote: {
    fontFamily: serif,
    fontSize: 25,
    lineHeight: 35,
    borderLeftWidth: 3,
    paddingLeft: 18,
  },
  author: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  facts: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 20,
    gap: 10,
  },
});
