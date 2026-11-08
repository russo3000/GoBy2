import { useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSQLiteContext } from "expo-sqlite";
import * as ImagePicker from "expo-image-picker";
import { File, Paths } from "expo-file-system";
import { RootStackParams } from "../navigation";
import { useLibrary } from "../data/LibraryProvider";
import {
  createPlaceList,
  PlaceDraft,
  savePlace,
} from "../data/recommendations";
import { Button, IconButton, LocalNote } from "../ui/components";
import { useTheme } from "../ui/theme";

export function Capture({
  navigation,
  route,
}: NativeStackScreenProps<RootStackParams, "Capture">) {
  const db = useSQLiteContext();
  const { colors: c } = useTheme();
  const { places, lists, refresh } = useLibrary();
  const existing = places.find((p) => p.id === route.params?.id);
  const [draft, setDraft] = useState<PlaceDraft>({
    title: existing?.title || "",
    tip: existing?.tip || "",
    city: existing?.city || "",
    listId: existing?.list_id || route.params?.listId || 1,
    photoUri: existing?.photo_uri || null,
  });
  const [newList, setNewList] = useState(""),
    [creating, setCreating] = useState(false);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const pending = useRef(false);
  // A successful write is remembered even if reloading fails, preventing duplicate saves.
  const savedId = useRef<number | null>(null);
  const [written, setWritten] = useState(false);
  const update = (key: keyof PlaceDraft, value: string | number | null) =>
    setDraft((current) => ({ ...current, [key]: value }));
  async function pickPhoto() {
    setError("");
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.8,
        allowsEditing: true,
      });
      if (!result.canceled) update("photoUri", result.assets[0].uri);
    } catch {
      setError(
        "Could not open your photos. You can still save without a photo.",
      );
    }
  }
  async function save() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    let copied: File | undefined;
    try {
      if (savedId.current === null) {
        if (route.params?.id !== undefined && !existing)
          throw new Error("This place could not be found.");
        if (!draft.title.trim())
          throw new Error("Give this place a name first.");
        let listId = draft.listId;
        if (creating) {
          listId = await createPlaceList(db, newList);
          setDraft((d) => ({ ...d, listId }));
          setCreating(false);
          setNewList("");
        }
        let photoUri = draft.photoUri;
        if (photoUri && photoUri !== existing?.photo_uri) {
          const extension = photoUri
            .split(".")
            .pop()
            ?.split("?")[0]
            ?.toLowerCase();
          const suffix =
            extension && /^[a-z0-9]{1,5}$/.test(extension) ? extension : "jpg";
          copied = new File(
            Paths.document,
            `goby-${Date.now()}-${Math.random().toString(36).slice(2)}.${suffix}`,
          );
          new File(photoUri).copy(copied);
          photoUri = copied.uri;
        }
        savedId.current = await savePlace(
          db,
          { ...draft, listId, photoUri },
          existing?.id,
        );
        copied = undefined; // This file is now referenced by a durable row.
        setWritten(true);
      }
      await refresh();
      navigation.goBack();
    } catch (e) {
      if (copied?.exists) copied.delete();
      setError(
        savedId.current !== null
          ? "Your place is saved. Tap “Refresh saved place” to reload the list."
          : e instanceof Error
            ? e.message
            : "Could not save. Your details are still here; please try again.",
      );
    } finally {
      setBusy(false);
      pending.current = false;
    }
  }
  const field = (
    label: string,
    key: "title" | "city" | "tip",
    placeholder: string,
    maxLength: number,
    multiline = false,
  ) => (
    <View style={s.field}>
      <Text style={[s.label, { color: c.ink }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholder={placeholder}
        placeholderTextColor={c.muted}
        value={draft[key]}
        onChangeText={(v) => update(key, v)}
        editable={!busy && !written}
        maxLength={maxLength}
        multiline={multiline}
        style={[
          s.input,
          { backgroundColor: c.surface, borderColor: c.line, color: c.ink },
          multiline && s.multiline,
        ]}
      />
    </View>
  );
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={s.page}
      >
        <Text style={[s.intro, { color: c.muted }]}>
          Keep the place. Add the little thing you’d tell a friend.
        </Text>
        {field("Place name", "title", "Name this place", 200)}
        {field(
          "City or area · optional",
          "city",
          "Barcelona, the old town, close to home…",
          80,
        )}
        {field(
          "Your tip · optional",
          "tip",
          "Ask for the off-menu omelette.",
          500,
          true,
        )}
        <View style={s.field}>
          <Text style={[s.label, { color: c.ink }]}>Save to a list</Text>
          <View style={s.chips}>
            {lists.map((list) => (
              <Button
                key={list.id}
                secondary={creating || list.id !== draft.listId}
                disabled={busy || written}
                onPress={() => {
                  update("listId", list.id);
                  setCreating(false);
                }}
              >
                {list.name}
              </Button>
            ))}
            <Button
              secondary={!creating}
              disabled={busy || written}
              onPress={() => setCreating(true)}
            >
              ＋ New list
            </Button>
          </View>
          {creating && (
            <TextInput
              accessibilityLabel="New list name"
              autoFocus
              placeholder="e.g. A slow Sunday"
              placeholderTextColor={c.muted}
              maxLength={65}
              value={newList}
              editable={!busy && !written}
              onChangeText={setNewList}
              style={[
                s.input,
                {
                  borderColor: c.line,
                  color: c.ink,
                  backgroundColor: c.surface,
                },
              ]}
            />
          )}
        </View>
        <View style={s.field}>
          <Text style={[s.label, { color: c.ink }]}>Photo · optional</Text>
          {draft.photoUri && (
            <Image source={{ uri: draft.photoUri }} style={s.preview} />
          )}
          <View style={s.chips}>
            <Button
              secondary
              disabled={busy || written || Platform.OS === "web"}
              onPress={pickPhoto}
            >
              {draft.photoUri ? "Change photo" : "Choose a photo"}
            </Button>
            {!!draft.photoUri && (
              <IconButton
                icon="trash-outline"
                label="Remove photo"
                disabled={busy || written}
                onPress={() => update("photoUri", null)}
              />
            )}
          </View>
          {Platform.OS === "web" && (
            <Text style={{ color: c.muted, fontSize: 12 }}>
              Photo picking is available in the iOS and Android app.
            </Text>
          )}
        </View>
        {!!error && (
          <Text
            accessibilityRole="alert"
            style={{ color: c.error, lineHeight: 22 }}
          >
            {error}
          </Text>
        )}
        <Button
          disabled={
            busy ||
            (!written && (!draft.title.trim() || (creating && !newList.trim())))
          }
          onPress={save}
        >
          {busy
            ? "Saving…"
            : written
              ? "Refresh saved place"
              : existing
                ? "Save changes"
                : "Save place"}
        </Button>
        <LocalNote />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const s = StyleSheet.create({
  page: { padding: 20, gap: 24 },
  intro: { fontSize: 16, lineHeight: 24 },
  field: { gap: 10 },
  label: { fontSize: 15, fontWeight: "600" },
  input: {
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    minHeight: 50,
  },
  multiline: { minHeight: 110, textAlignVertical: "top" },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  preview: { height: 200, width: "100%", borderRadius: 14 },
});
