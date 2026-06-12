import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
  RefreshControl, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCampaignById } from '../../api/apiService';
import { useTheme } from '../../context/ThemeContext';

const CampaignDetailScreen = ({ route, navigation }) => {
  const { campaignId } = route.params || {};
  const { theme, themeName } = useTheme();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCampaign = async () => {
    try {
      const res = await getCampaignById(campaignId);
      setCampaign(res.data.campaign || res.data);
    } catch (error) {
      console.error('Campaign fetch failed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchCampaign(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchCampaign(); };

  const percentage = campaign ? Math.min(((campaign.spent || 0) / (campaign.totalBudget || 1)) * 100, 100) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar barStyle={themeName === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.headerBg} />
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.card }]}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>Campaign Detail</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : !campaign ? (
        <View style={styles.loadingContainer}>
          <Text style={{ color: theme.subtext }}>Campaign পাওয়া যায়নি</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} colors={[theme.primary]} />}
          contentContainerStyle={styles.content}
        >
          <View style={[styles.titleBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: theme.text }]}>{campaign.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: campaign.status === 'ACTIVE' ? '#14532d' : '#1c1a0f' }]}>
                <Text style={[styles.statusText, { color: campaign.status === 'ACTIVE' ? '#22c55e' : '#f59e0b' }]}>{campaign.status}</Text>
              </View>
            </View>
            <Text style={[styles.description, { color: theme.subtext }]}>{campaign.description}</Text>
          </View>

          <View style={[styles.budgetCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.budgetRow}>
              <Text style={[styles.budgetLabel, { color: theme.subtext }]}>Budget Used</Text>
              <Text style={[styles.budgetPct, { color: theme.primary }]}>{percentage.toFixed(0)}%</Text>
            </View>
            <View style={[styles.progressBg, { backgroundColor: theme.border }]}>
              <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: theme.primary }]} />
            </View>
            <View style={styles.budgetNumbers}>
              <Text style={[styles.budgetSpent, { color: theme.subtext }]}>Spent: ${campaign.spent || 0}</Text>
              <Text style={[styles.budgetTotal, { color: theme.subtext }]}>Budget: ${campaign.totalBudget || 0}</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            {[
              { label: 'Commission', value: `$${campaign.commissionAmount || 0}`, icon: 'cash-outline', color: '#8b5cf6' },
              { label: 'Applications', value: campaign.applicationsCount || 0, icon: 'people-outline', color: '#22c55e' },
              { label: 'Approved', value: campaign.approvedCount || 0, icon: 'checkmark-circle-outline', color: '#3b82f6' },
              { label: 'Pending', value: campaign.pendingCount || 0, icon: 'time-outline', color: '#f59e0b' },
            ].map((s, i) => (
              <View key={i} style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={[styles.statIcon, { backgroundColor: s.color + '22' }]}>
                  <Ionicons name={s.icon} size={18} color={s.color} />
                </View>
                <Text style={[styles.statValue, { color: theme.text }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: theme.subtext }]}>{s.label}</Text>
              </View>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>Details</Text>
          <View style={[styles.detailsCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {[
              { label: 'Category', value: campaign.category || 'General' },
              { label: 'Commission Type', value: campaign.commissionType || 'PER_POST' },
              { label: 'Start Date', value: campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'N/A' },
              { label: 'End Date', value: campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'N/A' },
            ].map((d, i) => (
              <View key={i} style={[styles.detailRow, i > 0 && { borderTopWidth: 1, borderTopColor: theme.border }]}>
                <Text style={[styles.detailLabel, { color: theme.subtext }]}>{d.label}</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{d.value}</Text>
              </View>
            ))}
          </View>

          {campaign.platforms?.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Platforms</Text>
              <View style={styles.platformRow}>
                {campaign.platforms.map((p) => (
                  <View key={p} style={[styles.platformTag, { backgroundColor: theme.primaryLight }]}>
                    <Text style={[styles.platformText, { color: theme.primary }]}>{p}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {campaign.promoters?.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Promoters</Text>
              {campaign.promoters.map((p, i) => (
                <View key={i} style={[styles.promoterRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={[styles.promoterAvatar, { backgroundColor: theme.primaryLight }]}>
                    <Text style={[styles.promoterAvatarText, { color: theme.primary }]}>{p.name?.charAt(0)?.toUpperCase() || '?'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.promoterName, { color: theme.text }]}>{p.name}</Text>
                    <Text style={[styles.promoterSub, { color: theme.subtext }]}>{p.country || 'Bangladesh'}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: p.status === 'APPROVED' ? '#14532d' : '#1c1a0f' }]}>
                    <Text style={[styles.statusText, { color: p.status === 'APPROVED' ? '#22c55e' : '#f59e0b' }]}>{p.status}</Text>
                  </View>
                </View>
              ))}
            </>
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1 },
  backBtn: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16 },
  titleBox: { borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '700', flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  description: { fontSize: 14, lineHeight: 20 },
  budgetCard: { borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1 },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  budgetLabel: { fontSize: 14, fontWeight: '600' },
  budgetPct: { fontSize: 14, fontWeight: '700' },
  progressBg: { height: 6, borderRadius: 3, marginBottom: 10 },
  progressFill: { height: 6, borderRadius: 3 },
  budgetNumbers: { flexDirection: 'row', justifyContent: 'space-between' },
  budgetSpent: { fontSize: 13 },
  budgetTotal: { fontSize: 13 },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, gap: 4 },
  statIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700' },
  statLabel: { fontSize: 10, textAlign: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10 },
  detailsCard: { borderRadius: 14, borderWidth: 1, marginBottom: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14 },
  detailLabel: { fontSize: 13 },
  detailValue: { fontSize: 13, fontWeight: '500' },
  platformRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  platformTag: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  platformText: { fontSize: 13, fontWeight: '600' },
  promoterRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1 },
  promoterAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  promoterAvatarText: { fontWeight: '700' },
  promoterName: { fontSize: 14, fontWeight: '600' },
  promoterSub: { fontSize: 12, marginTop: 2 },
});

export default CampaignDetailScreen;


