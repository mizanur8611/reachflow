import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity, RefreshControl, StatusBar, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getPromoterDashboard } from '../../api/apiService';
import { useTheme } from '../../context/ThemeContext';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { theme, themeName } = useTheme();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      const res = await getPromoterDashboard();
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

  const quickLinks = [
    { label: 'Leaderboard', icon: 'trophy-outline', screen: 'Leaderboard', color: '#f59e0b' },
    { label: 'Referral', icon: 'gift-outline', screen: 'Referral', color: '#22c55e' },
    { label: 'Notifications', icon: 'notifications-outline', screen: 'Notifications', color: '#8b5cf6' },
    { label: 'Messages', icon: 'chatbubble-outline', screen: 'Messages', color: '#3b82f6' },
    { label: 'Disputes', icon: 'warning-outline', screen: 'Disputes', color: '#ef4444' },
    { label: 'Withdraw', icon: 'arrow-up-circle-outline', screen: 'Withdraw', color: '#22c55e' },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} colors={[theme.primary]} />}
    >
      <StatusBar barStyle={themeName === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.headerBg} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatarCircle} />
          ) : (
            <View style={[styles.avatarCircle, { backgroundColor: theme.primary }]}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'P'}</Text>
            </View>
          )}
          <View>
            <Text style={[styles.greeting, { color: theme.text }]}>হ্যালো, {user?.name} 👋</Text>
            <Text style={[styles.role, { color: theme.subtext }]}>Promoter Dashboard</Text>
          </View>
        </View>
        <TouchableOpacity onPress={logout} style={[styles.logoutBtn, { backgroundColor: theme.primaryLight }]}>
          <Ionicons name="log-out-outline" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* KYC Banner */}
      {!dashboard?.kycVerified && (
        <TouchableOpacity style={[styles.kycBanner, { backgroundColor: theme.card, borderColor: '#f59e0b44' }]} onPress={() => navigation.navigate('KYC')}>
          <Ionicons name="shield-outline" size={18} color="#f59e0b" />
          <View style={{ flex: 1 }}>
            <Text style={styles.kycTitle}>KYC Verification প্রয়োজন</Text>
            <Text style={[styles.kycSub, { color: theme.subtext }]}>Withdrawal unlock করতে verify করুন</Text>
          </View>
          <Text style={styles.kycCta}>Verify →</Text>
        </TouchableOpacity>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Applied', value: dashboard?.appliedCampaigns || 0, color: '#8b5cf6', icon: 'megaphone-outline' },
          { label: 'Approved', value: dashboard?.approvedCampaigns || 0, color: '#22c55e', icon: 'checkmark-circle-outline' },
          { label: 'Pending', value: dashboard?.pendingCampaigns || 0, color: '#f59e0b', icon: 'time-outline' },
          { label: 'Earned', value: `$${dashboard?.totalEarnings || 0}`, color: '#3b82f6', icon: 'cash-outline' },
        ].map((item) => (
          <View key={item.label} style={[styles.statCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.statIcon, { backgroundColor: item.color + '22' }]}>
              <Ionicons name={item.icon} size={20} color={item.color} />
            </View>
            <Text style={[styles.statValue, { color: theme.text }]}>{item.value}</Text>
            <Text style={[styles.statLabel, { color: theme.subtext }]}>{item.label}</Text>
          </View>
        ))}
      </View>

      {/* Quick Links */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Access</Text>
      <View style={styles.quickGrid}>
        {quickLinks.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={[styles.quickCard, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIcon, { backgroundColor: item.color + '22' }]}>
              <Ionicons name={item.icon} size={22} color={item.color} />
            </View>
            <Text style={[styles.quickLabel, { color: theme.text }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Activity */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>সাম্প্রতিক কার্যক্রম</Text>
      {dashboard?.recentActivity?.length > 0 ? (
        dashboard.recentActivity.map((item, index) => (
          <View key={index} style={[styles.activityCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.activityDot, { backgroundColor: theme.primary }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.activityTitle, { color: theme.text }]}>{item.campaignName}</Text>
              <Text style={[styles.activityTime, { color: theme.subtext }]}>{item.date || 'সম্প্রতি'}</Text>
            </View>
            <Text style={styles.activityAmount}>৳{item.amount}</Text>
          </View>
        ))
      ) : (
        <View style={[styles.emptyCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="rocket-outline" size={40} color={theme.subtext} />
          <Text style={[styles.emptyText, { color: theme.text }]}>এখনো কোনো কার্যক্রম নেই</Text>
          <Text style={[styles.emptySubtext, { color: theme.subtext }]}>Campaigns ট্যাবে গিয়ে apply করুন!</Text>
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
  logoutBtn: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  kycBanner: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, margin: 16, padding: 14, gap: 10 },
  kycTitle: { fontSize: 14, fontWeight: '600', color: '#f59e0b' },
  kycSub: { fontSize: 12, marginTop: 2 },
  kycCta: { color: '#f59e0b', fontWeight: '700', fontSize: 13 },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 20, gap: 10 },
  statCard: { flex: 1, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, gap: 6 },
  statIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 10, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', paddingHorizontal: 20, marginBottom: 12 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, marginBottom: 24 },
  quickCard: { width: '30%', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, gap: 8 },
  quickIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  quickLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  activityCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 8, padding: 14, borderRadius: 12, borderWidth: 1, gap: 10 },
  activityDot: { width: 8, height: 8, borderRadius: 4 },
  activityTitle: { fontSize: 14, fontWeight: '500' },
  activityTime: { fontSize: 12, marginTop: 2 },
  activityAmount: { fontSize: 15, fontWeight: '700', color: '#22c55e' },
  emptyCard: { margin: 16, padding: 32, borderRadius: 16, alignItems: 'center', borderWidth: 1, gap: 10 },
  emptyText: { fontSize: 16, fontWeight: '600' },
  emptySubtext: { fontSize: 13, textAlign: 'center' },
});



