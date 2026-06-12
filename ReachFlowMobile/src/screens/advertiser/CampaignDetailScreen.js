import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
  RefreshControl, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCampaignById } from '../../api/apiService';

const CampaignDetailScreen = ({ route, navigation }) => {
  const { campaignId } = route.params || {};
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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Campaign Detail</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      ) : !campaign ? (
        <View style={styles.loadingContainer}>
          <Text style={{ color: '#71717a' }}>Campaign পাওয়া যায়নি</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" colors={['#8b5cf6']} />}
          contentContainerStyle={styles.content}
        >
          {/* Title & Status */}
          <View style={styles.titleBox}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{campaign.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: campaign.status === 'ACTIVE' ? '#14532d' : '#1c1a0f' }]}>
                <Text style={[styles.statusText, { color: campaign.status === 'ACTIVE' ? '#22c55e' : '#f59e0b' }]}>{campaign.status}</Text>
              </View>
            </View>
            <Text style={styles.description}>{campaign.description}</Text>
          </View>

          {/* Budget Progress */}
          <View style={styles.budgetCard}>
            <View style={styles.budgetRow}>
              <Text style={styles.budgetLabel}>Budget Used</Text>
              <Text style={styles.budgetPct}>{percentage.toFixed(0)}%</Text>
            </View>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${percentage}%` }]} />
            </View>
            <View style={styles.budgetNumbers}>
              <Text style={styles.budgetSpent}>Spent: ${campaign.spent || 0}</Text>
              <Text style={styles.budgetTotal}>Budget: ${campaign.totalBudget || 0}</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.statsGrid}>
            {[
              { label: 'Commission', value: `$${campaign.commissionAmount || 0}`, icon: 'cash-outline', color: '#8b5cf6' },
              { label: 'Applications', value: campaign.applicationsCount || 0, icon: 'people-outline', color: '#22c55e' },
              { label: 'Approved', value: campaign.approvedCount || 0, icon: 'checkmark-circle-outline', color: '#3b82f6' },
              { label: 'Pending', value: campaign.pendingCount || 0, icon: 'time-outline', color: '#f59e0b' },
            ].map((s, i) => (
              <View key={i} style={styles.statCard}>
                <View style={[styles.statIcon, { backgroundColor: s.color + '22' }]}>
                  <Ionicons name={s.icon} size={18} color={s.color} />
                </View>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Details */}
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsCard}>
            {[
              { label: 'Category', value: campaign.category || 'General' },
              { label: 'Commission Type', value: campaign.commissionType || 'PER_POST' },
              { label: 'Start Date', value: campaign.startDate ? new Date(campaign.startDate).toLocaleDateString() : 'N/A' },
              { label: 'End Date', value: campaign.endDate ? new Date(campaign.endDate).toLocaleDateString() : 'N/A' },
            ].map((d, i) => (
              <View key={i} style={[styles.detailRow, i > 0 && styles.detailRowBorder]}>
                <Text style={styles.detailLabel}>{d.label}</Text>
                <Text style={styles.detailValue}>{d.value}</Text>
              </View>
            ))}
          </View>

          {/* Platforms */}
          {campaign.platforms?.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Platforms</Text>
              <View style={styles.platformRow}>
                {campaign.platforms.map((p) => (
                  <View key={p} style={styles.platformTag}>
                    <Text style={styles.platformText}>{p}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Promoters list */}
          {campaign.promoters?.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Promoters</Text>
              {campaign.promoters.map((p, i) => (
                <View key={i} style={styles.promoterRow}>
                  <View style={styles.promoterAvatar}>
                    <Text style={styles.promoterAvatarText}>{p.name?.charAt(0)?.toUpperCase() || '?'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.promoterName}>{p.name}</Text>
                    <Text style={styles.promoterSub}>{p.country || 'Bangladesh'}</Text>
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
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#1f1f23',
  },
  backBtn: { width: 38, height: 38, borderRadius: 10, backgroundColor: '#1f1f23', justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff', flex: 1, textAlign: 'center', marginHorizontal: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16 },
  titleBox: { backgroundColor: '#141417', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#1f1f23' },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '700', color: '#f4f4f5', flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  description: { fontSize: 14, color: '#71717a', lineHeight: 20 },
  budgetCard: { backgroundColor: '#141417', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#1f1f23' },
  budgetRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  budgetLabel: { fontSize: 14, color: '#a1a1aa', fontWeight: '600' },
  budgetPct: { fontSize: 14, color: '#8b5cf6', fontWeight: '700' },
  progressBg: { height: 6, backgroundColor: '#1f1f23', borderRadius: 3, marginBottom: 10 },
  progressFill: { height: 6, backgroundColor: '#8b5cf6', borderRadius: 3 },
  budgetNumbers: { flexDirection: 'row', justifyContent: 'space-between' },
  budgetSpent: { fontSize: 13, color: '#71717a' },
  budgetTotal: { fontSize: 13, color: '#71717a' },
  statsGrid: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#141417', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1f1f23', gap: 4 },
  statIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#f4f4f5' },
  statLabel: { fontSize: 10, color: '#71717a', textAlign: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#f4f4f5', marginBottom: 10 },
  detailsCard: { backgroundColor: '#141417', borderRadius: 14, borderWidth: 1, borderColor: '#1f1f23', marginBottom: 20 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', padding: 14 },
  detailRowBorder: { borderTopWidth: 1, borderTopColor: '#1f1f23' },
  detailLabel: { fontSize: 13, color: '#71717a' },
  detailValue: { fontSize: 13, color: '#f4f4f5', fontWeight: '500' },
  platformRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  platformTag: { backgroundColor: '#1f1f23', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  platformText: { color: '#a1a1aa', fontSize: 13, fontWeight: '600' },
  promoterRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#141417', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1f1f23' },
  promoterAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2d2d35', justifyContent: 'center', alignItems: 'center' },
  promoterAvatarText: { color: '#f4f4f5', fontWeight: '700' },
  promoterName: { fontSize: 14, fontWeight: '600', color: '#f4f4f5' },
  promoterSub: { fontSize: 12, color: '#52525b', marginTop: 2 },
});

export default CampaignDetailScreen;
