import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  TouchableOpacity,
  Share,
  Clipboard,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getReferral } from '../../api/apiService';

const ReferralScreen = ({ navigation }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const fetchReferral = async () => {
    try {
      const res = await getReferral();
      setData(res.data);
    } catch (error) {
      console.error('Referral fetch failed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReferral();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReferral();
  };

  const handleCopy = () => {
    Clipboard.setString(data?.referralCode || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `ReachFlow এ join করো আমার referral code দিয়ে: ${data?.referralCode}\nLink: ${data?.referralLink || 'https://reachflow-lovat.vercel.app'}`,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Referral</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" colors={['#8b5cf6']} />
          }
        >
          {/* Hero */}
          <View style={styles.heroBox}>
            <View style={styles.heroIcon}>
              <Ionicons name="gift" size={36} color="#22c55e" />
            </View>
            <Text style={styles.heroTitle}>বন্ধুদের invite করো</Text>
            <Text style={styles.heroSub}>
              তোমার referral code দিয়ে কেউ join করলে তুমি bonus পাবে!
            </Text>
          </View>

          {/* Referral Code */}
          <Text style={styles.sectionLabel}>তোমার Referral Code</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{data?.referralCode || 'N/A'}</Text>
            <TouchableOpacity
              style={[styles.copyBtn, copied && styles.copiedBtn]}
              onPress={handleCopy}
            >
              <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color="#fff" />
              <Text style={styles.copyBtnText}>{copied ? 'Copied!' : 'Copy'}</Text>
            </TouchableOpacity>
          </View>

          {/* Share Button */}
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
            <Ionicons name="share-social-outline" size={20} color="#fff" />
            <Text style={styles.shareBtnText}>শেয়ার করো</Text>
          </TouchableOpacity>

          {/* Stats */}
          <Text style={styles.sectionLabel}>তোমার পারফরম্যান্স</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="people-outline" size={22} color="#8b5cf6" />
              <Text style={styles.statValue}>{data?.totalReferrals ?? 0}</Text>
              <Text style={styles.statLabel}>মোট Referral</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle-outline" size={22} color="#22c55e" />
              <Text style={styles.statValue}>{data?.completedReferrals ?? 0}</Text>
              <Text style={styles.statLabel}>Successful</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statCard}>
              <Ionicons name="cash-outline" size={22} color="#f59e0b" />
              <Text style={styles.statValue}>৳{data?.totalEarned ?? 0}</Text>
              <Text style={styles.statLabel}>মোট Bonus</Text>
            </View>
          </View>

          {/* Referred Users List */}
          {data?.referrals?.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Referred Users</Text>
              {data.referrals.map((item, index) => (
                <View key={index} style={styles.userRow}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>
                      {item.name?.charAt(0)?.toUpperCase() || '?'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <Text style={styles.userDate}>{item.joinedAt || 'সম্প্রতি join করেছে'}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: item.status === 'ACTIVE' ? '#14532d' : '#1c1a0f' }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: item.status === 'ACTIVE' ? '#22c55e' : '#f59e0b' }
                    ]}>
                      {item.status === 'ACTIVE' ? 'Active' : 'Pending'}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Empty referrals */}
          {(!data?.referrals || data.referrals.length === 0) && (
            <View style={styles.emptyBox}>
              <Ionicons name="people-outline" size={48} color="#3f3f46" />
              <Text style={styles.emptyTitle}>এখনো কেউ join করেনি</Text>
              <Text style={styles.emptySub}>কোড শেয়ার করো, bonus পাও!</Text>
            </View>
          )}

          {/* How it works */}
          <Text style={styles.sectionLabel}>কীভাবে কাজ করে</Text>
          <View style={styles.stepsBox}>
            {[
              { icon: 'share-outline', text: 'তোমার code বন্ধুকে দাও' },
              { icon: 'person-add-outline', text: 'বন্ধু সেই code দিয়ে register করে' },
              { icon: 'cash-outline', text: 'তুমি bonus পাও!' },
            ].map((step, i) => (
              <View key={i} style={styles.step}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <View style={styles.stepIcon}>
                  <Ionicons name={step.icon} size={20} color="#8b5cf6" />
                </View>
                <Text style={styles.stepText}>{step.text}</Text>
              </View>
            ))}
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f23',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#1f1f23',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  heroBox: {
    alignItems: 'center',
    backgroundColor: '#141417',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1f1f23',
  },
  heroIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#14532d',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f4f4f5',
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 14,
    color: '#71717a',
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 13,
    color: '#52525b',
    fontWeight: '600',
    marginBottom: 10,
    marginTop: 4,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141417',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2d2d35',
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  codeText: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: '#8b5cf6',
    letterSpacing: 3,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8b5cf6',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  copiedBtn: {
    backgroundColor: '#22c55e',
  },
  copyBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 28,
  },
  shareBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#141417',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1f1f23',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 18,
    gap: 6,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#1f1f23',
    marginVertical: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f4f4f5',
  },
  statLabel: {
    fontSize: 11,
    color: '#71717a',
    textAlign: 'center',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141417',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1f1f23',
    gap: 10,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2d2d35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: '#f4f4f5',
    fontWeight: '700',
    fontSize: 16,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f4f4f5',
  },
  userDate: {
    fontSize: 12,
    color: '#52525b',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyBox: {
    alignItems: 'center',
    backgroundColor: '#141417',
    borderRadius: 14,
    padding: 32,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#1f1f23',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#71717a',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 13,
    color: '#3f3f46',
  },
  stepsBox: {
    backgroundColor: '#141417',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1f1f23',
    padding: 16,
    gap: 16,
    marginBottom: 8,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2d2d35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumText: {
    color: '#71717a',
    fontSize: 12,
    fontWeight: '700',
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1425',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#a1a1aa',
  },
});

export default ReferralScreen;
