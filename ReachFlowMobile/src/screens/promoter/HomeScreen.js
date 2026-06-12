import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity, RefreshControl, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { getPromoterDashboard } from '../../api/apiService';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

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

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard();
  };

  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: '#0a0a0a' }} size="large" color="#8b5cf6" />;

  const quickLinks = [
    { label: 'Leaderboard', icon: 'trophy-outline', screen: 'Leaderboard', color: '#FFD700' },
    { label: 'Referral', icon: 'gift-outline', screen: 'Referral', color: '#22c55e' },
    { label: 'Notifications', icon: 'notifications-outline', screen: 'Notifications', color: '#8b5cf6' },
    { label: 'Messages', icon: 'chatbubble-outline', screen: 'Messages', color: '#3b82f6' },
    { label: 'Disputes', icon: 'warning-outline', screen: 'Disputes', color: '#ef4444' },
    { label: 'Withdraw', icon: 'arrow-up-circle-outline', screen: 'Withdraw', color: '#22c55e' },
  ];

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" colors={['#8b5cf6']} />
      }
    >
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'P'}</Text>
          </View>
          <View>
            <Text style={styles.greeting}>হ্যালো, {user?.name} 👋</Text>
            <Text style={styles.role}>Promoter Dashboard</Text>
          </View>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn}>
          <Ionicons name="log-out-outline" size={20} color="#71717a" />
        </TouchableOpacity>
      </View>

      {/* KYC Banner */}
      {!dashboard?.kycVerified && (
        <TouchableOpacity style={styles.kycBanner} onPress={() => navigation.navigate('KYC')}>
          <Ionicons name="shield-outline" size={18} color="#f59e0b" />
          <View style={{ flex: 1 }}>
            <Text style={styles.kycTitle}>KYC Verification প্রয়োজন</Text>
            <Text style={styles.kycSub}>Withdrawal unlock করতে verify করুন</Text>
          </View>
          <Text style={styles.kycCta}>Verify →</Text>
        </TouchableOpacity>
      )}

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#8b5cf622' }]}>
            <Ionicons name="megaphone-outline" size={20} color="#8b5cf6" />
          </View>
          <Text style={styles.statValue}>{dashboard?.appliedCampaigns || 0}</Text>
          <Text style={styles.statLabel}>Applied</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#22c55e22' }]}>
            <Ionicons name="checkmark-circle-outline" size={20} color="#22c55e" />
          </View>
          <Text style={styles.statValue}>{dashboard?.approvedCampaigns || dashboard?.activeCampaigns || 0}</Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#f59e0b22' }]}>
            <Ionicons name="time-outline" size={20} color="#f59e0b" />
          </View>
          <Text style={styles.statValue}>{dashboard?.pendingCampaigns || 0}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#3b82f622' }]}>
            <Ionicons name="cash-outline" size={20} color="#3b82f6" />
          </View>
          <Text style={styles.statValue}>${dashboard?.totalEarnings || 0}</Text>
          <Text style={styles.statLabel}>Earned</Text>
        </View>
      </View>

      {/* Quick Links */}
      <Text style={styles.sectionTitle}>Quick Access</Text>
      <View style={styles.quickGrid}>
        {quickLinks.map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={styles.quickCard}
            onPress={() => navigation.navigate(item.screen)}
            activeOpacity={0.7}
          >
            <View style={[styles.quickIcon, { backgroundColor: item.color + '22' }]}>
              <Ionicons name={item.icon} size={22} color={item.color} />
            </View>
            <Text style={styles.quickLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Activity */}
      <Text style={styles.sectionTitle}>সাম্প্রতিক কার্যক্রম</Text>
      {dashboard?.recentActivity?.length > 0 ? (
        dashboard.recentActivity.map((item, index) => (
          <View key={index} style={styles.activityCard}>
            <View style={styles.activityDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.activityTitle}>{item.campaignName}</Text>
              <Text style={styles.activityTime}>{item.date || 'সম্প্রতি'}</Text>
            </View>
            <Text style={styles.activityAmount}>৳{item.amount}</Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons name="rocket-outline" size={40} color="#3f3f46" />
          <Text style={styles.emptyText}>এখনো কোনো কার্যক্রম নেই</Text>
          <Text style={styles.emptySubtext}>Campaigns ট্যাবে গিয়ে apply করুন!</Text>
        </View>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f23',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  role: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
  },
  logoutBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#1f1f23',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // KYC Banner
  kycBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1c1a0f',
    borderWidth: 1,
    borderColor: '#f59e0b44',
    borderRadius: 12,
    margin: 16,
    padding: 14,
    gap: 10,
  },
  kycTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f59e0b',
  },
  kycSub: {
    fontSize: 12,
    color: '#71717a',
    marginTop: 2,
  },
  kycCta: {
    color: '#f59e0b',
    fontWeight: '700',
    fontSize: 13,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#141417',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f1f23',
    gap: 6,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  statLabel: {
    fontSize: 10,
    color: '#71717a',
    textAlign: 'center',
  },
  // Section
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f4f4f5',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  // Quick Links
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 24,
  },
  quickCard: {
    width: '30%',
    backgroundColor: '#141417',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f1f23',
    gap: 8,
  },
  quickIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickLabel: {
    fontSize: 11,
    color: '#a1a1aa',
    fontWeight: '600',
    textAlign: 'center',
  },
  // Activity
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141417',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1f1f23',
    gap: 10,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8b5cf6',
  },
  activityTitle: {
    fontSize: 14,
    color: '#f4f4f5',
    fontWeight: '500',
  },
  activityTime: {
    fontSize: 12,
    color: '#52525b',
    marginTop: 2,
  },
  activityAmount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#22c55e',
  },
  emptyCard: {
    backgroundColor: '#141417',
    margin: 16,
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1f1f23',
    gap: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#f4f4f5',
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#71717a',
    textAlign: 'center',
  },
});




