import * as Linking from 'expo-linking';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { Avatar, Badge, Button, Card, Input, SectionTitle } from '../../../components/ui';
import { useStore } from '../../../lib/store';
import { colors } from '../../../lib/theme';
import { formatSlot, respondedIds, uid } from '../../../lib/utils';

export default function GroupScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const router = useRouter();
  const { state, dispatch } = useStore();
  const [friend, setFriend] = useState('');

  const group = state.groups.find((g) => g.id === groupId);
  if (!group) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Group not found.</Text>
      </View>
    );
  }

  const plans = state.plans.filter((p) => p.groupId === group.id);
  const open = plans.filter((p) => p.status === 'open');
  const locked = plans.filter((p) => p.status === 'locked');

  const invite = () => {
    const link = Linking.createURL(`join/${group.inviteCode}`);
    Share.share({ message: `Join "${group.name}" on Linkup so we can finally make plans: ${link}` });
  };

  const addFriend = () => {
    const name = friend.trim();
    if (!name) return;
    dispatch({ type: 'addMember', groupId: group.id, userId: uid('u'), name });
    setFriend('');
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: `${group.emoji} ${group.name}` }} />

      <Card>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
          {group.memberIds.map((id) => {
            const user = state.users[id];
            if (!user) return null;
            return (
              <View key={id} style={styles.member}>
                <Avatar user={user} size={44} />
                <Text style={styles.memberName} numberOfLines={1}>
                  {user.name}
                </Text>
              </View>
            );
          })}
        </ScrollView>
        <View style={styles.inviteRow}>
          <Button title="Invite friends" variant="secondary" onPress={invite} style={{ flex: 1 }} />
        </View>
        <View style={styles.addRow}>
          <Input
            placeholder="Add a friend by name"
            value={friend}
            onChangeText={setFriend}
            onSubmitEditing={addFriend}
            returnKeyType="done"
            style={{ flex: 1 }}
          />
          <Button title="Add" onPress={addFriend} disabled={!friend.trim()} />
        </View>
        <Text style={styles.hint}>
          Friends are saved on this device for now. Real invites arrive with the backend.
        </Text>
      </Card>

      <Button title="Start a plan" onPress={() => router.push(`/group/${group.id}/new-plan`)} style={{ marginTop: 16 }} />

      <SectionTitle>Open plans</SectionTitle>
      {open.length === 0 && (
        <Card>
          <Text style={styles.muted}>Nothing planned. Start one and get a date locked in.</Text>
        </Card>
      )}
      {open.map((p) => {
        const answered = respondedIds(p, group.memberIds).length;
        return (
          <Pressable key={p.id} onPress={() => router.push(`/plan/${p.id}`)}>
            <Card style={styles.planCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.planTitle}>{p.title}</Text>
                <Text style={styles.muted}>
                  {answered} of {group.memberIds.length} responded
                </Text>
              </View>
              <Badge label="Open" />
            </Card>
          </Pressable>
        );
      })}

      {locked.length > 0 && <SectionTitle>Locked in</SectionTitle>}
      {locked.map((p) => (
        <Pressable key={p.id} onPress={() => router.push(`/plan/${p.id}`)}>
          <Card style={styles.planCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.planTitle}>{p.title}</Text>
              <Text style={styles.muted}>{p.lockedSlot ? formatSlot(p.lockedSlot) : ''}</Text>
            </View>
            <Badge label="Locked" tone="success" />
          </Card>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { fontSize: 14, color: colors.muted },
  member: { alignItems: 'center', width: 56 },
  memberName: { fontSize: 12, color: colors.text, marginTop: 4 },
  inviteRow: { flexDirection: 'row', marginTop: 16 },
  addRow: { flexDirection: 'row', gap: 8, marginTop: 10, alignItems: 'center' },
  hint: { fontSize: 12, color: colors.muted, marginTop: 8 },
  planCard: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  planTitle: { fontSize: 17, fontWeight: '700', color: colors.text },
});
