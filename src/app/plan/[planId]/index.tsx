import * as Linking from 'expo-linking';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';

import { Avatar, Badge, Button, Card, Input, SectionTitle } from '../../../components/ui';
import { addToCalendar } from '../../../lib/calendar';
import { useStore } from '../../../lib/store';
import { colors } from '../../../lib/theme';
import {
  bestSlot,
  formatSlot,
  makeDemoAvailability,
  respondedIds,
  slotStart,
  topVenue,
  uid,
} from '../../../lib/utils';

export default function PlanScreen() {
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const router = useRouter();
  const { state, dispatch } = useStore();
  const [venueName, setVenueName] = useState('');

  const plan = state.plans.find((p) => p.id === planId);
  const group = plan ? state.groups.find((g) => g.id === plan.groupId) : undefined;
  if (!plan || !group) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Plan not found.</Text>
      </View>
    );
  }

  const me = state.meId;
  const members = group.memberIds;
  const responded = respondedIds(plan, members);
  const iResponded = responded.includes(me);
  const best = bestSlot(plan, members);
  const leading = topVenue(plan);
  const isLocked = plan.status === 'locked';
  const lockedVenue = plan.venues.find((v) => v.id === plan.lockedVenueId);
  const nameOf = (id: string) => state.users[id]?.name ?? 'Someone';

  const nudge = () => {
    const link = Linking.createURL(`plan/${plan.id}`);
    Share.share({
      message: `Quick one: fill in when you're free for "${plan.title}" so we can lock it in. ${link}`,
    });
  };

  const addVenue = () => {
    const name = venueName.trim();
    if (!name) return;
    dispatch({ type: 'addVenue', planId: plan.id, id: uid('v'), name, userId: me });
    setVenueName('');
  };

  const lock = () => {
    if (!best) return;
    const where = leading ? ` at ${leading.name}` : '';
    Alert.alert(
      'Lock this plan?',
      `${formatSlot(best.slot)}${where}. ${best.count} of ${best.total} can make it.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Lock it in',
          onPress: () =>
            dispatch({ type: 'lockPlan', planId: plan.id, slot: best.slot, venueId: leading?.id }),
        },
      ],
    );
  };

  const addCal = async () => {
    if (!plan.lockedSlot) return;
    const start = slotStart(plan.lockedSlot);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const result = await addToCalendar({
      title: plan.title,
      start,
      end,
      location: lockedVenue?.name,
      notes: `Planned with ${group.name} on Linkup`,
    });
    if (result === 'unavailable') {
      Alert.alert(
        'Calendar not available',
        'Adding to the calendar needs a development build. It is not supported in Expo Go.',
      );
    } else if (result === 'denied') {
      Alert.alert('Permission needed', 'Allow calendar access in Settings to add this plan.');
    }
  };

  const shareLocked = () => {
    if (!plan.lockedSlot) return;
    const where = lockedVenue ? ` at ${lockedVenue.name}` : '';
    Share.share({ message: `${plan.title} is on! ${formatSlot(plan.lockedSlot)}${where}. See you there.` });
  };

  const simulateFriends = () => {
    for (const id of members) {
      if (id === me || (plan.availability[id]?.length ?? 0) > 0) continue;
      dispatch({
        type: 'setAvailability',
        planId: plan.id,
        userId: id,
        slots: makeDemoAvailability(plan.days),
      });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: plan.title }} />

      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{plan.title}</Text>
          <Text style={styles.muted}>{group.emoji} {group.name}</Text>
        </View>
        <Badge label={isLocked ? 'Locked' : 'Open'} tone={isLocked ? 'success' : 'primary'} />
      </View>

      {isLocked && plan.lockedSlot && (
        <Card style={styles.lockedCard}>
          <Text style={styles.lockedLabel}>{"It's happening"}</Text>
          <Text style={styles.lockedWhen}>{formatSlot(plan.lockedSlot)}</Text>
          {lockedVenue && <Text style={styles.lockedWhere}>📍 {lockedVenue.name}</Text>}
          <View style={styles.lockedActions}>
            <Button title="Add to calendar" onPress={addCal} style={{ flex: 1 }} />
            <Button title="Share" variant="secondary" onPress={shareLocked} style={{ flex: 1 }} />
          </View>
        </Card>
      )}

      <SectionTitle>{"Who's responded"}</SectionTitle>
      <Card>
        <View style={styles.avatars}>
          {members.map((id) => {
            const user = state.users[id];
            if (!user) return null;
            return (
              <View key={id} style={styles.avatarItem}>
                <Avatar user={user} size={40} dim={!responded.includes(id)} />
                <Text style={styles.avatarName} numberOfLines={1}>
                  {user.name}
                </Text>
              </View>
            );
          })}
        </View>
        <Text style={styles.muted}>
          {responded.length} of {members.length} responded
        </Text>
        {!isLocked && (
          <View style={styles.actions}>
            <Button
              title={iResponded ? 'Edit my availability' : 'Mark my availability'}
              variant={iResponded ? 'secondary' : 'primary'}
              onPress={() => router.push(`/plan/${plan.id}/availability`)}
              style={{ flex: 1 }}
            />
            {responded.length < members.length && (
              <Button title="Nudge" variant="secondary" onPress={nudge} />
            )}
          </View>
        )}
      </Card>

      {!isLocked && (
        <>
          <SectionTitle>Best time</SectionTitle>
          <Card>
            {best ? (
              <>
                <Text style={styles.bestWhen}>{formatSlot(best.slot)}</Text>
                <Text style={styles.bestCount}>
                  {best.count} of {best.total} free
                </Text>
                {best.missing.length > 0 && (
                  <Text style={styles.muted}>{`Can't make it: ${best.missing.map(nameOf).join(', ')}`}</Text>
                )}
              </>
            ) : (
              <Text style={styles.muted}>No overlap yet. Once people add their availability, the best time shows up here.</Text>
            )}
          </Card>

          <SectionTitle>Where?</SectionTitle>
          {plan.venues.map((v) => {
            const voted = v.votes.includes(me);
            const isLeading = leading?.id === v.id;
            return (
              <Pressable
                key={v.id}
                onPress={() => dispatch({ type: 'toggleVote', planId: plan.id, venueId: v.id, userId: me })}>
                <Card style={[styles.venueCard, voted && { borderColor: colors.primary }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.venueName}>{v.name}</Text>
                    <Text style={styles.muted}>Suggested by {nameOf(v.suggestedBy)}</Text>
                  </View>
                  {isLeading && <Badge label="Leading" tone="success" />}
                  <View style={[styles.voteBtn, voted && { backgroundColor: colors.primary }]}>
                    <Text style={[styles.voteText, voted && { color: '#fff' }]}>▲ {v.votes.length}</Text>
                  </View>
                </Card>
              </Pressable>
            );
          })}
          <View style={styles.addRow}>
            <Input
              placeholder="Suggest a place"
              value={venueName}
              onChangeText={setVenueName}
              onSubmitEditing={addVenue}
              returnKeyType="done"
              style={{ flex: 1 }}
            />
            <Button title="Add" onPress={addVenue} disabled={!venueName.trim()} />
          </View>

          <Button title="Lock it in" onPress={lock} disabled={!best} style={{ marginTop: 24 }} />

          {__DEV__ && (
            <Button
              title="Demo: simulate friends' replies"
              variant="ghost"
              onPress={simulateFriends}
              style={{ marginTop: 8 }}
            />
          )}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  muted: { fontSize: 14, color: colors.muted },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  lockedCard: {
    marginTop: 16,
    backgroundColor: colors.successSoft,
    borderColor: colors.success,
  },
  lockedLabel: { fontSize: 13, fontWeight: '700', color: colors.success, textTransform: 'uppercase' },
  lockedWhen: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 6 },
  lockedWhere: { fontSize: 16, color: colors.text, marginTop: 4 },
  lockedActions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  avatars: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 12 },
  avatarItem: { alignItems: 'center', width: 52 },
  avatarName: { fontSize: 11, color: colors.text, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  bestWhen: { fontSize: 20, fontWeight: '800', color: colors.text },
  bestCount: { fontSize: 15, fontWeight: '700', color: colors.success, marginVertical: 4 },
  venueCard: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  venueName: { fontSize: 16, fontWeight: '700', color: colors.text },
  voteBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
  },
  voteText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  addRow: { flexDirection: 'row', gap: 8, marginTop: 4, alignItems: 'center' },
});
