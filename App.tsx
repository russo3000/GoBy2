import { Suspense, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { initializeDatabase, listRecommendations, Recommendation, saveRecommendation } from './src/data/recommendations';

function Notebook() {
  const db = useSQLiteContext();
  const [items, setItems] = useState<Recommendation[]>([]);
  const [title, setTitle] = useState('');
  const [tip, setTip] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    listRecommendations(db).then(setItems).catch(() => setError('Could not load your saves. Reopen the app to try again.')).finally(() => setLoading(false));
  }, [db]);

  async function save() {
    if (saving || !title.trim()) return;
    setSaving(true);
    setError('');
    try {
      await saveRecommendation(db, title, tip);
      setTitle('');
      setTip('');
    } catch {
      setError('Could not save. Your title is still here; please try again.');
      setSaving(false);
      return;
    }
    try { setItems(await listRecommendations(db)); }
    catch { setError('Saved, but the list could not refresh. Reopen the app to see your save.'); }
    finally { setSaving(false); }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={styles.content} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={styles.brand}>goby</Text>
        <Text style={styles.heading}>Good finds. Kept close.</Text>
        <Text style={styles.subtitle}>A little notebook for places you’d take a friend.</Text>
        <View style={styles.form}>
          <Text accessibilityRole="header" style={styles.label}>Save a recommendation</Text>
          <TextInput accessibilityLabel="Recommendation title" placeholder="A bakery, a sunset bench, a hidden gem…" value={title} onChangeText={setTitle} maxLength={200} editable={!saving} style={styles.input} onSubmitEditing={save} returnKeyType="done" />
          <TextInput accessibilityLabel="Personal tip" placeholder="Your tiny insider tip (optional)" value={tip} onChangeText={setTip} maxLength={500} editable={!saving} multiline style={styles.input} />
          <Pressable accessibilityRole="button" disabled={saving || !title.trim()} onPress={save} style={[styles.button, (saving || !title.trim()) && styles.disabled]}>
            <Text style={styles.buttonText}>{saving ? 'Saving…' : 'Save on this device'}</Text>
          </Pressable>
        </View>
        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
        <Text style={styles.label}>Your saves</Text>
        {loading ? <ActivityIndicator /> : <FlatList data={items} keyExtractor={item => String(item.id)} contentContainerStyle={styles.list} ListEmptyComponent={<Text style={styles.subtitle}>Your next great find starts here.</Text>} renderItem={({ item }) => <View style={styles.card}><Text style={styles.cardTitle}>{item.title}</Text><Text style={styles.subtitle}>{item.tip || 'No tip added yet.'}</Text><Text style={styles.meta}>On this device</Text></View>} />}
        <Text style={styles.footer}>Local notebook · Account sync and sharing aren’t connected yet.</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export default function App() {
  return <Suspense fallback={<ActivityIndicator />}><SQLiteProvider databaseName="goby-guest.db" onInit={initializeDatabase} useSuspense><Notebook /></SQLiteProvider></Suspense>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F7F5EF' },
  content: { flex: 1, padding: 24, gap: 18 },
  brand: { fontSize: 32, fontWeight: '800', color: '#214D3E' },
  heading: { fontSize: 34, fontWeight: '700', color: '#17392F' },
  subtitle: { color: '#5C665E', fontSize: 16, lineHeight: 24 },
  form: { gap: 12, marginVertical: 12 },
  label: { fontSize: 18, fontWeight: '600', color: '#17392F' },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#BBC7BD', borderRadius: 14, padding: 16, fontSize: 16, color: '#17392F' },
  button: { backgroundColor: '#214D3E', borderRadius: 14, padding: 16, alignItems: 'center' },
  disabled: { opacity: 0.45 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  list: { gap: 12, paddingBottom: 20 },
  card: { padding: 18, borderRadius: 16, backgroundColor: '#FFFFFF', gap: 8 },
  cardTitle: { fontSize: 18, color: '#17392F' },
  meta: { color: '#5C665E', fontSize: 13 },
  footer: { color: '#5C665E', fontSize: 12, lineHeight: 18 },
  error: { color: '#9C2929' },
});
