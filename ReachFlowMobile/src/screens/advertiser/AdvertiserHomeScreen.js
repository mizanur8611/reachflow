import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity,
  RefreshControl, StatusBar, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getAdvertiserDashboard } from '../../api/apiService';
import { useTheme } from '../../context/ThemeContext';

export default function AdvertiserHomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { theme, themeName } = useTheme();
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

  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: theme.background }} size="large" color={theme.primary} />;

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
      style={{ flex: 1, backgroundColor: theme.background }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} colors={[theme.primary]} />}
    >
      <StatusBar barStyle={themeName === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.headerBg} />

      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatarCircle} />
          ) : (
            <View style={[styles.avatarCircle, { backgroundColor: theme.primary }]}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'A'}</Text>
            </View>
          )}
          <View>
            <Text style={[styles.greeting, { color: theme.text }]}>Dashboard 👋</Text>
            <Text style={[styles.role, { color: theme.subtext }]}>Here's what's happening today</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={[styles.walletBtn, { backgroundColor: theme.primaryLight, borderColor: theme.border }]} onPress={() => navigation.navigate('AdvertiserWallet')}>
            <Ionicons name="wallet-outline" size={14} color={theme.primary} />
            <Text style={[styles.walletBtnText, { color: theme.primary }]}>${dashboard?.walletBalance || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={logout} style={[styles.logoutBtn, { backgroundColor: theme.primaryLight }]}>
            <Ionicons name="log-out-outline" size={20} color={theme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsGrid}>
        {stats.map((s, i) => (
          <View key={i} style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.statIcon, { backgroundColor: s.color + '22' }]}>
              <Ionicons name={s.icon} size={20} color={s.color} />
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.quickRow}>
        <TouchableOpacity style={[styles.newCampaignBtn, { backgroundColor: theme.primary }]} onPress={() => navigation.navigate('CreateCampaign')}>
          <Ionicons name="add-circle-outline" size={18} color="#fff" />
          <Text style={styles.newCampaignText}>New Campaign</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.analyticsBtn, { backgroundColor: theme.primaryLight, borderColor: theme.border }]} onPress={() => navigation.navigate('Analytics')}>
          <Ionicons name="bar-chart-outline" size={18} color={theme.primary} />
          <Text style={[styles.analyticsBtnText, { color: theme.primary }]}>Analytics</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Campaigns</Text>
        <TouchableOpacity onPress={() => navigation.navigate('MyCampaigns')}>
          <Text style={[styles.viewAll, { color: theme.primary }]}>View All →</Text>
        </TouchableOpacity>
      </View>

      {dashboard?.recentCampaigns?.length > 0 ? (
        dashboard.recentCampaigns.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.campaignCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => navigation.navigate('CampaignDetail', { campaignId: item.id })}
          >
            <View style={styles.campaignCardTop}>
              <Text style={[styles.campaignTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
              <View style={[styles.statusBadge, { backgroundColor: item.status === 'ACTIVE' ? '#14532d' : '#1c1a0f' }]}>
                <Text style={[styles.statusText, { color: item.status === 'ACTIVE' ? '#22c55e' : '#f59e0b' }]}>{item.status}</Text>
              </View>
            </View>
            <View style={styles.campaignStats}>
              <Text style={[styles.campaignStat, { color: theme.subtext }]}>Spent: ${item.spent || 0}</Text>
              <Text style={[styles.campaignStat, { color: theme.subtext }]}>Budget: ${item.budget || item.totalBudget || 0}</Text>
            </View>
            <View style={[styles.progressBg, { backgroundColor: theme.border }]}>
              <View style={[styles.progressFill, { backgroundColor: theme.primary, width: `${Math.min(((item.spent || 0) / (item.budget || item.totalBudget || 1)) * 100, 100)}%` }]} />
            </View>
            <View style={styles.campaignMeta}>
              <Text style={[styles.metaText, { color: theme.subtext }]}>👥 {item.applicationsCount || 0} applied</Text>
              <Text style={[styles.metaText, { color: theme.subtext }]}>🕐 {item.endDate ? new Date(item.endDate).toLocaleDateString() : 'N/A'}</Text>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="megaphone-outline" size={40} color={theme.subtext} />
          <Text style={[styles.emptyText, { color: theme.subtext }]}>কোনো campaign নেই</Text>
          <TouchableOpacity style={[styles.createBtn, { backgroundColor: theme.primary }]} onPress={() => navigation.navigate('CreateCampaign')}>
            <Text style={styles.createBtnText}>প্রথম campaign তৈরি করুন</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 20, borderBottomWidth: 1 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  greeting: { fontSize: 18, fontWeight: '700' },
  role: { fontSize: 12, marginTop: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  walletBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  walletBtnText: { fontWeight: '700', fontSize: 13 },
  logoutBtn: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingTop: 20, gap: 10 },
  statCard: { width: '47%', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, gap: 6 },
  statIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 10, textAlign: 'center' },
  quickRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: 16, marginBottom: 8 },
  newCampaignBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 12, gap: 6 },
  newCampaignText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  analyticsBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingVertical: 12, gap: 6, borderWidth: 1 },
  analyticsBtnText: { fontWeight: '700', fontSize: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  viewAll: { fontSize: 13, fontWeight: '600' },
  campaignCard: { marginHorizontal: 16, marginBottom: 10, borderRadius: 14, padding: 16, borderWidth: 1 },
  campaignCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  campaignTitle: { fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  campaignStats: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  campaignStat: { fontSize: 12 },
  progressBg: { height: 4, borderRadius: 2, marginBottom: 10 },
  progressFill: { height: 4, borderRadius: 2 },
  campaignMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  metaText: { fontSize: 12 },
  emptyCard: { margin: 16, padding: 32, borderRadius: 16, alignItems: 'center', borderWidth: 1, gap: 10 },
  emptyText: { fontSize: 16, fontWeight: '600' },
  createBtn: { borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, marginTop: 4 },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});


