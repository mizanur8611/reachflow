import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
  RefreshControl, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAnalytics } from '../../api/apiService';

const BAR_COLORS = ['#8b5cf6', '#22c55e', '#3b82f6', '#f59e0b', '#ec4899', '#14b8a6'];

const AnalyticsScreen = ({ navigation }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('week');

  const fetchAnalytics = async () => {
    try {
      const res = await getAnalytics(period);
      setData(res.data);
    } catch (error) {
      console.error('Analytics fetch failed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, [period]);
  const onRefresh = () => { setRefreshing(true); fetchAnalytics(); };

  const maxVal = (arr) => Math.max(...(arr?.map(i => i.value || i.count || 0) || [1]), 1);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Period filter */}
      <View style={styles.periodRow}>
        {['week', 'month', 'year'].map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodBtnText, period === p && styles.periodBtnTextActive]}>
              {p === 'week' ? 'এই সপ্তাহ' : p === 'month' ? 'এই মাস' : 'এই বছর'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" colors={['#8b5cf6']} />}
          contentContainerStyle={styles.content}
        >
          {/* Summary Cards */}
          <View style={styles.summaryGrid}>
            {[
              { label: 'Total Spend', value: `$${data?.totalSpend || 0}`, icon: 'cash-outline', color: '#8b5cf6' },
              { label: 'Total Clicks', value: data?.totalClicks || 0, icon: 'finger-print-outline', color: '#22c55e' },
              { label: 'Conversions', value: data?.totalConversions || 0, icon: 'checkmark-done-outline', color: '#3b82f6' },
              { label: 'Active Promoters', value: data?.activePromoters || 0, icon: 'people-outline', color: '#f59e0b' },
            ].map((s, i) => (
              <View key={i} style={styles.summaryCard}>
                <View style={[styles.summaryIcon, { backgroundColor: s.color + '22' }]}>
                  <Ionicons name={s.icon} size={18} color={s.color} />
                </View>
                <Text style={styles.summaryValue}>{s.value}</Text>
                <Text style={styles.summaryLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* Spend Chart */}
          {data?.spendByDay?.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Daily Spend</Text>
              <View style={styles.chartBox}>
                <View style={styles.barChart}>
                  {data.spendByDay.map((item, i) => {
                    const max = maxVal(data.spendByDay);
                    const height = Math.max(((item.value || 0) / max) * 120, 4);
                    return (
                      <View key={i} style={styles.barWrapper}>
                        <Text style={styles.barValue}>${item.value || 0}</Text>
                        <View style={[styles.bar, { height, backgroundColor: BAR_COLORS[i % BAR_COLORS.length] }]} />
                        <Text style={styles.barLabel}>{item.label || item.day}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            </>
          )}

          {/* Campaign Performance */}
          {data?.campaignPerformance?.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Campaign Performance</Text>
              {data.campaignPerformance.map((item, i) => {
                const percentage = Math.min(((item.spent || 0) / (item.budget || 1)) * 100, 100);
                return (
                  <View key={i} style={styles.perfCard}>
                    <View style={styles.perfTop}>
                      <Text style={styles.perfTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={styles.perfSpent}>${item.spent || 0}</Text>
                    </View>
                    <View style={styles.perfStats}>
                      <Text style={styles.perfStat}>👥 {item.promoters || 0} promoters</Text>
                      <Text style={styles.perfStat}>🖱 {item.clicks || 0} clicks</Text>
                      <Text style={styles.perfStat}>✅ {item.conversions || 0} conv.</Text>
                    </View>
                    <View style={styles.progressBg}>
                      <View style={[styles.progressFill, { width: `${percentage}%` }]} />
                    </View>
                    <Text style={styles.budgetText}>{percentage.toFixed(0)}% of ${item.budget || 0} budget used</Text>
                  </View>
                );
              })}
            </>
          )}

          {/* Top Promoters */}
          {data?.topPromoters?.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Top Promoters</Text>
              {data.topPromoters.map((p, i) => (
                <View key={i} style={styles.promoterRow}>
                  <View style={styles.promoterRank}>
                    <Text style={styles.promoterRankText}>#{i + 1}</Text>
                  </View>
                  <View style={styles.promoterAvatar}>
                    <Text style={styles.promoterAvatarText}>{p.name?.charAt(0)?.toUpperCase() || '?'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.promoterName}>{p.name}</Text>
                    <Text style={styles.promoterSub}>{p.submissions || 0} submissions</Text>
                  </View>
                  <Text style={styles.promoterEarned}>${p.earned || 0}</Text>
                </View>
              ))}
            </>
          )}

          {!data?.spendByDay?.length && !data?.campaignPerformance?.length && (
            <View style={styles.emptyBox}>
              <Ionicons name="bar-chart-outline" size={64} color="#3f3f46" />
              <Text style={styles.emptyTitle}>কোনো data নেই</Text>
              <Text style={styles.emptySub}>Campaign চালু করলে analytics দেখাবে</Text>
            </View>
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
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#1f1f23', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  periodRow: { flexDirection: 'row', padding: 16, gap: 8 },
  periodBtn: {
    flex: 1, backgroundColor: '#141417', borderRadius: 10, padding: 10,
    alignItems: 'center', borderWidth: 1, borderColor: '#2d2d35',
  },
  periodBtnActive: { backgroundColor: '#1a1425', borderColor: '#8b5cf6' },
  periodBtnText: { color: '#71717a', fontWeight: '600', fontSize: 13 },
  periodBtnTextActive: { color: '#8b5cf6' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  summaryCard: {
    width: '47%', flex: 1, backgroundColor: '#141417', borderRadius: 14, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: '#1f1f23', gap: 6,
  },
  summaryIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  summaryValue: { fontSize: 20, fontWeight: '700', color: '#f4f4f5' },
  summaryLabel: { fontSize: 11, color: '#71717a', textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#f4f4f5', marginBottom: 12 },
  chartBox: { backgroundColor: '#141417', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#1f1f23', marginBottom: 24 },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 160 },
  barWrapper: { alignItems: 'center', gap: 4, flex: 1 },
  barValue: { fontSize: 9, color: '#71717a' },
  bar: { width: 24, borderRadius: 4, minHeight: 4 },
  barLabel: { fontSize: 10, color: '#52525b' },
  perfCard: {
    backgroundColor: '#141417', borderRadius: 14, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: '#1f1f23',
  },
  perfTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  perfTitle: { fontSize: 14, fontWeight: '600', color: '#f4f4f5', flex: 1 },
  perfSpent: { fontSize: 14, fontWeight: '700', color: '#8b5cf6' },
  perfStats: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  perfStat: { fontSize: 12, color: '#71717a' },
  progressBg: { height: 4, backgroundColor: '#1f1f23', borderRadius: 2, marginBottom: 4 },
  progressFill: { height: 4, backgroundColor: '#8b5cf6', borderRadius: 2 },
  budgetText: { fontSize: 11, color: '#52525b' },
  promoterRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#141417', borderRadius: 12, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: '#1f1f23',
  },
  promoterRank: { width: 28, alignItems: 'center' },
  promoterRankText: { color: '#52525b', fontWeight: '700', fontSize: 13 },
  promoterAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#2d2d35', justifyContent: 'center', alignItems: 'center',
  },
  promoterAvatarText: { color: '#f4f4f5', fontWeight: '700' },
  promoterName: { fontSize: 14, fontWeight: '600', color: '#f4f4f5' },
  promoterSub: { fontSize: 12, color: '#52525b', marginTop: 2 },
  promoterEarned: { fontSize: 14, fontWeight: '700', color: '#22c55e' },
  emptyBox: {
    alignItems: 'center', padding: 48, gap: 10,
    backgroundColor: '#141417', borderRadius: 14, borderWidth: 1, borderColor: '#1f1f23',
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#71717a', marginTop: 8 },
  emptySub: { fontSize: 14, color: '#3f3f46', textAlign: 'center' },
});

export default AnalyticsScreen;
