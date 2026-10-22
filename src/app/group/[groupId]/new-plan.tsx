import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Chip, Input, SectionTitle } from '../../../components/ui';
import { useStore } from '../../../lib/store';
import { colors } from '../../../lib/theme';
import { buildDays, uid } from '../../../lib/utils';

const PRESETS = ['Dinner', 'Game night', 'Brunch', 'Hike', 'Drinks', 'Movie night'];
const WINDOWS = [
  { label: 'Next 7 days', days: 7 },
  { label: 'Next 14 days', days: 14 },
];

export default function NewPlanScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const { dispatch } = useStore();
  const [title, setTitle] = useState('');
  const [windowDays, setWindowDays] = useState(14);

  const create = () => {
    const trimmed = title.trim();
    if (!trimmed || !groupId) return;
    const id = uid('p');
    dispatch({ type: 'addPlan', id, groupId, title: trimmed, days: buildDays(windowDays) });
    router.replace(`/plan/${id}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: 'New plan' }} />

      <SectionTitle>What are you planning?</SectionTitle>
      <Input
        placeholder="e.g. Birthday dinner"
        value={title}
        onChangeText={setTitle}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={create}
      />
      <View style={styles.chips}>
        {PRESETS.map((p) => (
          <Chip key={p} label={p} selected={title === p} onPress={() => setTitle(p)} />
        ))}
      </View>

      <SectionTitle>When could it happen?</SectionTitle>
      <View style={styles.chips}>
        {WINDOWS.map((w) => (
          <Chip key={w.days} label={w.label} selected={windowDays === w.days} onPress={() => setWindowDays(w.days)} />
        ))}
      </View>

      <Text style={styles.hint}>
        Everyone taps the days and times they are free, then Linkup picks the slot with the most overlap.
      </Text>

      <Button title="Create plan" onPress={create} disabled={!title.trim()} style={{ marginTop: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  hint: { fontSize: 14, color: colors.muted, marginTop: 20, lineHeight: 20 },
});
