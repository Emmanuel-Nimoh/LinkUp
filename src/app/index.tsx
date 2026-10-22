import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Input, SectionTitle } from '../components/ui';
import { useStore } from '../lib/store';
import { colors } from '../lib/theme';
import { inviteCode, uid } from '../lib/utils';

const EMOJIS = ['🍻', '🎮', '🥾', '🍜', '🎬', '🏀', '🎶', '☕'];

export default function GroupsScreen() {
  const router = useRouter();
  const { state, dispatch } = useStore();
  const [name, setName] = useState('');

  const createGroup = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = uid('g');
    dispatch({
      type: 'addGroup',
      id,
      name: trimmed,
      emoji: EMOJIS[state.groups.length % EMOJIS.length],
      inviteCode: inviteCode(),
    });
    setName('');
    router.push(`/group/${id}`);
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <SectionTitle>Your groups</SectionTitle>
      {state.groups.length === 0 && (
        <Card>
          <Text style={styles.muted}>No groups yet. Create one below and invite your friends.</Text>
        </Card>
      )}
      {state.groups.map((g) => {
        const open = state.plans.filter((p) => p.groupId === g.id && p.status === 'open').length;
        return (
          <Pressable key={g.id} onPress={() => router.push(`/group/${g.id}`)}>
            <Card style={styles.groupCard}>
              <Text style={styles.emoji}>{g.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.groupName}>{g.name}</Text>
                <Text style={styles.muted}>
                  {g.memberIds.length} {g.memberIds.length === 1 ? 'person' : 'people'} · {open} open{' '}
                  {open === 1 ? 'plan' : 'plans'}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Card>
          </Pressable>
        );
      })}

      <SectionTitle>New group</SectionTitle>
      <Input
        placeholder="Group name (e.g. Brunch Club)"
        value={name}
        onChangeText={setName}
        onSubmitEditing={createGroup}
        returnKeyType="done"
      />
      <Button title="Create group" onPress={createGroup} disabled={!name.trim()} style={{ marginTop: 12 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
  groupCard: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  emoji: { fontSize: 32 },
  groupName: { fontSize: 17, fontWeight: '700', color: colors.text },
  muted: { fontSize: 14, color: colors.muted },
  chevron: { fontSize: 28, color: colors.muted },
});
