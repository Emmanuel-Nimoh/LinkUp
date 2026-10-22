import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../../../components/ui';
import { useStore } from '../../../lib/store';
import { colors } from '../../../lib/theme';
import { BLOCKS, BLOCK_LABEL, formatDay, slotKey } from '../../../lib/utils';

export default function AvailabilityScreen() {
  const { planId } = useLocalSearchParams<{ planId: string }>();
  const router = useRouter();
  const { state, dispatch } = useStore();

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
  const mine = plan.availability[me] ?? [];
  const locked = plan.status === 'locked';

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'Your availability' }} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{plan.title}</Text>
        <Text style={styles.muted}>
          {locked ? 'This plan is locked.' : 'Tap every time you could make it.'}
        </Text>

        <View style={styles.headerRow}>
          <View style={styles.dayCol} />
          {BLOCKS.map((b) => (
            <Text key={b} style={styles.blockLabel}>
              {BLOCK_LABEL[b]}
            </Text>
          ))}
        </View>

        {plan.days.map((iso) => (
          <View key={iso} style={styles.row}>
            <Text style={styles.dayCol}>{formatDay(iso)}</Text>
            {BLOCKS.map((b) => {
              const slot = slotKey(iso, b);
              const selected = mine.includes(slot);
              const others = group.memberIds.filter(
                (id) => id !== me && plan.availability[id]?.includes(slot),
              ).length;
              return (
                <Pressable
                  key={b}
                  disabled={locked}
                  onPress={() => dispatch({ type: 'toggleSlot', planId: plan.id, userId: me, slot })}
                  style={[styles.cell, selected && styles.cellSelected]}>
                  <Text style={[styles.cellText, selected && { color: '#fff' }]}>
                    {selected ? '✓' : ''}
                    {others > 0 ? ` +${others}` : ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ))}

        <Text style={styles.legend}>{'"+2" means two friends are already free at that time.'}</Text>
      </ScrollView>

      <View style={styles.footer}>
        <Button title={mine.length > 0 ? `Done (${mine.length} selected)` : 'Done'} onPress={() => router.back()} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 24 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  muted: { fontSize: 14, color: colors.muted, marginTop: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 6 },
  blockLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: colors.muted,
  },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  dayCol: { width: 92, fontSize: 14, fontWeight: '600', color: colors.text },
  cell: {
    flex: 1,
    height: 40,
    marginHorizontal: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  cellText: { fontSize: 13, fontWeight: '700', color: colors.muted },
  legend: { fontSize: 12, color: colors.muted, marginTop: 12 },
  footer: {
    padding: 16,
    paddingBottom: 28,
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
