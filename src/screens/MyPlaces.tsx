import Ionicons from "@expo/vector-icons/Ionicons";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { useLibrary } from "../data/LibraryProvider";
import { Recommendation } from "../data/recommendations";
import { RootStackParams } from "../navigation";
import { Button, Heading, IconButton, LocalNote } from "../ui/components";
import { serif, useTheme } from "../ui/theme";

function PlaceCard({
  item,
  width,
  onPress,
}: {
  item: Recommendation;
  width: number;
  onPress: () => void;
}) {
  const { colors: c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}${item.city ? ", " + item.city : ""}. ${item.tip}`}
      onPress={onPress}
      style={({ pressed }) => [{ width, opacity: pressed ? 0.7 : 1 }]}
    >
      <View style={[s.photo, { backgroundColor: c.selected }]}>
        {item.photo_uri ? (
          <Image
            source={{ uri: item.photo_uri }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <View style={s.placeholder}>
            <Ionicons name="location-outline" size={42} color={c.blue} />
            <Text style={[s.placeholderCity, { color: c.muted }]}>
              {item.city || "A good find"}
            </Text>
          </View>
        )}
        <View style={s.cardCaption}>
          <Text numberOfLines={2} style={s.cardTitle}>
            {item.title}
          </Text>
        </View>
      </View>
      <Text numberOfLines={1} style={[s.caption, { color: c.muted }]}>
        {item.city ? item.city + " · " : ""}Saved by you
      </Text>
      {!!item.tip && (
        <Text numberOfLines={2} style={[s.tip, { color: c.ink }]}>
          {item.tip}
        </Text>
      )}
    </Pressable>
  );
}
function Shelf({
  name,
  items,
  listId,
  open,
  add,
}: {
  name: string;
  items: Recommendation[];
  listId: number;
  open: (id: number) => void;
  add: (id: number) => void;
}) {
  const { colors: c } = useTheme();
  const { width } = useWindowDimensions();
  const cardWidth = Math.min((width - 40) * 0.72, 300);
  const rail = useRef<FlatList<Recommendation>>(null);
  const [offset, setOffset] = useState(0),
    [viewport, setViewport] = useState(0),
    [content, setContent] = useState(0);
  return (
    <View style={s.shelf}>
      <View style={s.shelfHeading}>
        <View style={{ flex: 1 }}>
          <Text
            accessibilityRole="header"
            style={[s.shelfTitle, { color: c.ink }]}
          >
            {name}
          </Text>
          <Text style={[s.caption, { color: c.muted }]}>
            {items.length} {items.length === 1 ? "place" : "places"}
          </Text>
        </View>
        <IconButton
          icon="chevron-back"
          label={`Previous places in ${name}`}
          disabled={offset <= 1}
          onPress={() =>
            rail.current?.scrollToOffset({
              offset: Math.max(0, offset - cardWidth - 12),
              animated: true,
            })
          }
        />
        <IconButton
          icon="chevron-forward"
          label={`Next places in ${name}`}
          disabled={offset + viewport >= content - 1}
          onPress={() =>
            rail.current?.scrollToOffset({
              offset: Math.min(content - viewport, offset + cardWidth + 12),
              animated: true,
            })
          }
        />
      </View>
      {items.length ? (
        <FlatList
          ref={rail}
          horizontal
          data={items}
          keyExtractor={(item) => String(item.id)}
          showsHorizontalScrollIndicator={false}
          snapToInterval={cardWidth + 12}
          decelerationRate="fast"
          contentContainerStyle={s.rail}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          onLayout={(e) => setViewport(e.nativeEvent.layout.width)}
          onContentSizeChange={(w) => setContent(w)}
          onScroll={(e) => setOffset(e.nativeEvent.contentOffset.x)}
          scrollEventThrottle={16}
          renderItem={({ item }) => (
            <PlaceCard
              item={item}
              width={cardWidth}
              onPress={() => open(item.id)}
            />
          )}
        />
      ) : (
        <View style={[s.emptyList, { borderColor: c.line }]}>
          <Text style={{ color: c.muted }}>
            A little room for your next great find.
          </Text>
          <Button secondary onPress={() => add(listId)}>
            Add a place
          </Button>
        </View>
      )}
    </View>
  );
}
export function MyPlaces() {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParams>>();
  const { colors: c } = useTheme();
  const { places, lists, loading, error, refresh } = useLibrary();
  const [searching, setSearching] = useState(false),
    [query, setQuery] = useState("");
  const q = query.trim().toLocaleLowerCase();
  const filtered = places.filter((p) =>
    [
      p.title,
      p.city,
      p.tip,
      lists.find((l) => l.id === p.list_id)?.name || "",
    ].some((value) => value.toLocaleLowerCase().includes(q)),
  );
  const open = (id: number) => navigation.navigate("Place", { id });
  const add = (listId = 1) => navigation.navigate("Capture", { listId });
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={s.page}
      keyboardShouldPersistTaps="handled"
    >
      <View style={s.topline}>
        <Text style={[s.eyebrow, { color: c.blue }]}>
          YOUR LITTLE CORNER OF THE WORLD
        </Text>
        <View style={[s.you, { backgroundColor: c.selected }]}>
          <Ionicons name="person-outline" color={c.blue} size={18} />
        </View>
      </View>
      <View style={s.headingRow}>
        {searching ? (
          <View style={[s.search, { borderColor: c.line }]}>
            <TextInput
              autoFocus
              accessibilityLabel="Search my places"
              placeholder="Place, list or city…"
              placeholderTextColor={c.muted}
              value={query}
              onChangeText={setQuery}
              style={{ flex: 1, color: c.ink, fontSize: 16 }}
              returnKeyType="search"
            />
            <IconButton
              icon="close"
              label="Close search"
              onPress={() => {
                setQuery("");
                setSearching(false);
              }}
            />
          </View>
        ) : (
          <>
            <View style={{ flex: 1 }}>
              <Heading>My places</Heading>
            </View>
            <IconButton
              icon="search-outline"
              label="Search my places"
              onPress={() => setSearching(true)}
            />
          </>
        )}
        <IconButton
          icon="add"
          label="Add a place"
          primary
          onPress={() => add()}
        />
      </View>
      <Text style={[s.intro, { color: c.muted }]}>
        The good spots. The little tips. All yours to keep.
      </Text>
      {!!error && (
        <View style={s.message}>
          <Text accessibilityRole="alert" style={{ color: c.error }}>
            {error}
          </Text>
          <Button
            secondary
            onPress={() => {
              void refresh().catch(() => {});
            }}
          >
            Try again
          </Button>
        </View>
      )}
      {loading ? (
        <ActivityIndicator color={c.blue} accessibilityLabel="Loading places" />
      ) : (
        <>
          {!places.length && !q && (
            <View
              style={[
                s.welcome,
                { backgroundColor: c.surface, borderColor: c.line },
              ]}
            >
              <View style={s.collage}>
                <Image
                  source={require("../../assets/prototype/inspiration-0.webp")}
                  style={s.collageLarge}
                />
                <View style={{ flex: 1, gap: 4 }}>
                  <Image
                    source={require("../../assets/prototype/inspiration-1.webp")}
                    style={s.collageSmall}
                  />
                  <Image
                    source={require("../../assets/prototype/inspiration-2.webp")}
                    style={s.collageSmall}
                  />
                </View>
              </View>
              <View style={s.welcomeBody}>
                <Text style={[s.eyebrow, { color: c.blue }]}>
                  A PLACE WORTH KEEPING
                </Text>
                <Text style={[s.welcomeTitle, { color: c.ink }]}>
                  Where would you{`\n`}take a friend?
                </Text>
                <Text style={[s.intro, { color: c.muted }]}>
                  That tiny bakery. Your sunset bench. Save a place and the tip
                  that makes it yours.
                </Text>
                <Button onPress={() => add()}>Save your first place</Button>
                <Text style={[s.caption, { color: c.muted }]}>
                  Illustrations from the Goby prototype
                </Text>
              </View>
            </View>
          )}
          {q && !filtered.length && (
            <View style={s.message}>
              <Text style={{ color: c.ink }}>
                No places found for “{query.trim()}”.
              </Text>
              <Text style={{ color: c.muted }}>
                Try a city, a list name, or a word from your tip.
              </Text>
              <Button secondary onPress={() => setQuery("")}>
                Clear search
              </Button>
            </View>
          )}
          {lists
            .filter((l) => !q || filtered.some((p) => p.list_id === l.id))
            .map((l) => (
              <Shelf
                key={l.id}
                name={l.name}
                listId={l.id}
                items={filtered.filter((p) => p.list_id === l.id)}
                open={open}
                add={add}
              />
            ))}
        </>
      )}
      <View style={{ paddingHorizontal: 20 }}>
        <Button
          secondary
          onPress={() => navigation.navigate("Capture", { listId: 1 })}
        >
          Add a place · choose or create a list
        </Button>
      </View>
      <LocalNote />
    </ScrollView>
  );
}
const s = StyleSheet.create({
  page: { paddingTop: 24, paddingBottom: 12 },
  topline: {
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    flexShrink: 1,
  },
  you: {
    height: 32,
    width: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
  },
  headingRow: {
    paddingHorizontal: 20,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    marginTop: 12,
  },
  intro: {
    fontSize: 15,
    lineHeight: 23,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 12,
  },
  search: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 24,
    paddingLeft: 14,
  },
  shelf: { marginVertical: 14 },
  shelfHeading: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 12,
  },
  shelfTitle: { fontFamily: serif, fontSize: 25, letterSpacing: -0.5 },
  rail: { paddingHorizontal: 20, paddingBottom: 4 },
  photo: { height: 190, overflow: "hidden", borderRadius: 14 },
  placeholder: { flex: 1, alignItems: "center", paddingTop: 30, gap: 8 },
  placeholderCity: { fontSize: 12 },
  cardCaption: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#10161BCC",
    padding: 12,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "700",
    letterSpacing: -0.7,
  },
  caption: { fontSize: 12, marginTop: 6 },
  tip: { fontSize: 14, lineHeight: 21, marginTop: 5 },
  emptyList: {
    marginHorizontal: 20,
    padding: 18,
    gap: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 14,
  },
  welcome: { margin: 20, borderWidth: 1, borderRadius: 20, overflow: "hidden" },
  collage: { height: 180, flexDirection: "row", gap: 4 },
  collageLarge: { flex: 1.25, width: 0, height: "100%" },
  collageSmall: { flex: 1, width: "100%" },
  welcomeBody: { padding: 20, gap: 12 },
  welcomeTitle: {
    fontFamily: serif,
    fontSize: 35,
    letterSpacing: -1,
    lineHeight: 39,
  },
  message: { margin: 20, gap: 12 },
});
