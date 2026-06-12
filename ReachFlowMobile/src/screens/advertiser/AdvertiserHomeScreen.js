import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity,
  RefreshControl, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getAdvertiserDashboard } from '../../api/apiService';

export default function AdvertiserHomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const res = await getAdvertiserDashboard();
      setDashboard(res.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); fetchDashboard(); };

  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: '#0a0a0a' }} size="large" color="#8b5cf6" />;

  const stats = [
    { label: 'Total Campaigns', value: dashboard?.totalCampaigns || 0, icon: 'megaphone-outline', color: '#8b5cf6' },
    { label: 'Active Campaigns', value: dashboard?.activeCampaigns || 0, icon: 'checkmark-circle-outline', color: '#22c55e' },
    { label: 'Total Budget', value: `$${dashboard?.totalBudget || 0}`, icon: 'cash-outline', color: '#3b82f6' },
    { label: 'Total Spent', value: `$${dashboard?.totalSpent || 0}`, icon: 'trending-up-outline', color: '#f59e0b' },
    { label: 'Applications', value: dashboard?.totalApplications || 0, icon: 'people-outline', color: '#ec4899' },
    { label: 'Wallet Balance', value: `$${dashboard?.walletBalance || 0}`, icon: 'wallet-outline', color: '#14b8a6' },
  ];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" colors={['#8b5cf6']} />}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'A'}</Text>
          </View>
          <View>
            <Text style={styles.greeting}>Dashboard 👋</Text>
            <Text style={styles.role}>Here's what's happening today</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.walletBtn} onPress={() => navigation.navigate('AdvertiserWallet')}>
            <Ionicons name="wallet-outline" size={14} color="#8b5cf6" />
            <Text style={styles.walletBtnText}>${dashboard?.walletBalance || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color="#71717a" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {stats.map((s, i) => (
          <View key={i} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: s.color + '22' }]}>
              <Ionicons name={s.icon} size={20} color={s.color} />
            </View>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickRow}>
        <TouchableOpacity style={styles.newCampaignBtn} onPress={() => navigation.navigate('CreateCampaign')}>
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <Text style={styles.newCampaignText}>New Campaign</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.analyticsBtn} onPress={() => navigation.navigate('Analytics')}>
          <Ionicons name="bar-chart-outline" size={18} color="#8b5cf6" />
          <Text style={styles.analyticsBtnText}>Analytics</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Campaigns */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Campaigns</Text>
        <TouchableOpacity onPress={() => navigation.navigate('MyCampaigns')}>
          <Text style={styles.viewAll}>View All →</Text>
        </TouchableOpacity>
      </View>

      {dashboard?.recentCampaigns?.length > 0 ? (
        dashboard.recentCampaigns.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.campaignCard}
            onPress={() => navigation.navigate('CampaignDetail', { campaignId: item.id })}
          >
            <View style={styles.campaignCardTop}>
              <Text style={styles.campaignTitle} numberOfLines={1}>{item.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: item.status === 'ACTIVE' ? '#14532d' : '#1c1a0f' }]}>
                <Text style={[styles.statusText, { color: item.status === 'ACTIVE' ? '#22c55e' : '#f59e0b' }]}>{item.status}</Text>
              </View>
            </View>
            <View style={styles.campaignStats}>
              <Text style={styles.campaignStat}>Spent: ${item.spent || 0}</Text>
              <Text style={styles.campaignStat}>Budget: ${item.budget || item.totalBudget || 0}</Text>
            </View>
            {/* Progress bar */}
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, {
                width: `${Math.min(((item.spent || 0) / (item.budget || item.totalBudget || 1)) * 100, 100)}%`
              }]} />
            </View>
            <View style={styles.campaignMeta}>
              <Text style={styles.metaText}>👥 {item.applicationsCount || 0} applied</Text>
              <Text style={styles.metaText}>🕐 {item.endDate ? new Date(item.endDate).toLocaleDateString() : 'N/A'}</Text>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons name="megaphone-outline" size={40} color="#3f3f46" />
          <Text style={styles.emptyText}>কোনো campaign নেই</Text>
          <TouchableOpacity style={styles.createBtn} onPress={() => navigation.navigate('CreateCampaign')}>
            <Text style={styles.createBtnText}>প্রথম campaign তৈরি করুন</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20,
    borderBottomWidth: 1, borderBottomColor: '#1f1f23',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  greeting: { fontSize: 18, fontWeight: '700', color: '#f4f4f5' },
  role: { fontSize: 12, color: '#71717a', marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  walletBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#1a1425', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: '#8b5cf633',
  },
  walletBtnText: { color: '#8b5cf6', fontWeight: '700', fontSize: 13 },
  logoutBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#1f1f23', justifyContent: 'center', alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 16, paddingTop: 20, gap: 10,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#141417', borderRadius: 14, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#1f1f23', gap: 6,
  },
  statIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#f4f4f5' },
  statLabel: { fontSize: 10, color: '#71717a', textAlign: 'center' },
  quickRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 16, marginBottom: 8 },
  newCampaignBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#8b5cf6', borderRadius: 12, paddingVertical: 12, gap: 6,
  },
  newCampaignText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  analyticsBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#1a1425', borderRadius: 12, paddingVertical: 12, gap: 6,
    borderWidth: 1, borderColor: '#8b5cf633',
  },
  analyticsBtnText: { color: '#8b5cf6', fontWeight: '700', fontSize: 14 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginTop: 20, marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#f4f4f5' },
  viewAll: { fontSize: 13, color: '#8b5cf6', fontWeight: '600' },
  campaignCard: {
    backgroundColor: '#141417', marginHorizontal: 16, marginBottom: 10,
    borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#1f1f23',
  },
  campaignCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  campaignTitle: { fontSize: 15, fontWeight: '600', color: '#f4f4f5', flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  campaignStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  campaignStat: { fontSize: 12, color: '#71717a' },
  progressBg: { height: 4, backgroundColor: '#1f1f23', borderRadius: 2, marginBottom: 10 },
  progressFill: { height: 4, backgroundColor: '#8b5cf6', borderRadius: 2 },
  campaignMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  metaText: { fontSize: 12, color: '#52525b' },
  emptyCard: {
    backgroundColor: '#141417', margin: 16, padding: 32,
    borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1f1f23', gap: 10,
  },
  emptyText: { fontSize: 16, color: '#71717a', fontWeight: '600' },
  createBtn: { backgroundColor: '#8b5cf6', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
