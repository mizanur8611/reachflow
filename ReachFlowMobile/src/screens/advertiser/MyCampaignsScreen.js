import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, TouchableOpacity,
  RefreshControl, StatusBar, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMyCampaigns } from '../../api/apiService';

export default function MyCampaignsScreen({ navigation }) {
  const [campaigns, setCampaigns] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchCampaigns(); }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFiltered(campaigns);
    } else {
      setFiltered(campaigns.filter(c =>
        c.title?.toLowerCase().includes(search.toLowerCase())
      ));
    }
  }, [search, campaigns]);

  const fetchCampaigns = async () => {
    try {
      const res = await getMyCampaigns();
      const data = res.data.campaigns || res.data || [];
      setCampaigns(data);
      setFiltered(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); fetchCampaigns(); };

  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: '#0a0a0a' }} size="large" color="#8b5cf6" />;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Campaigns</Text>
          <Text style={styles.headerSub}>Manage and track your campaigns</Text>
        </View>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => navigation.navigate('Create')}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.newBtnText}>New Campaign</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchWrapper}>
        <Ionicons name="search-outline" size={18} color="#52525b" />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search campaigns..."
          placeholderTextColor="#52525b"
          color="#f4f4f5"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color="#52525b" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id || item._id)}
        contentContainerStyle={filtered.length === 0 ? styles.emptyList : styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" colors={['#8b5cf6']} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="megaphone-outline" size={64} color="#3f3f46" />
            <Text style={styles.emptyText}>
              {search ? 'কোনো ফলাফল পাওয়া যায়নি' : 'কোনো campaign নেই'}
            </Text>
            {!search && (
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate('Create')}
              >
                <Ionicons name="add" size={16} color="#fff" />
                <Text style={styles.emptyBtnText}>নতুন Campaign তৈরি করুন</Text>
              </TouchableOpacity>
            )}
          </View>
        }
        renderItem={({ item }) => {
          const budget = item.totalBudget || item.budget || 0;
          const spent = item.spent || 0;
          const pct = Math.min((spent / (budget || 1)) * 100, 100);
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('CampaignDetail', { campaignId: item.id || item._id })}
              activeOpacity={0.75}
            >
              {/* Top */}
              <View style={styles.cardTop}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <Ionicons name="eye-outline" size={18} color="#52525b" />
              </View>
              <View style={styles.statusRow}>
                <View style={[styles.badge, { backgroundColor: item.status === 'ACTIVE' ? '#14532d' : '#1c1a0f' }]}>
                  <Text style={[styles.badgeText, { color: item.status === 'ACTIVE' ? '#22c55e' : '#f59e0b' }]}>
                    {item.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

              {/* Stats */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="cash-outline" size={14} color="#8b5cf6" />
                  <Text style={styles.statText}>Budget: ${budget}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="trending-up-outline" size={14} color="#22c55e" />
                  <Text style={styles.statText}>${item.commissionAmount || 0}/Post</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="people-outline" size={14} color="#3b82f6" />
                  <Text style={styles.statText}>{item.promoterCount || item.applicationsCount || 0} Promoters</Text>
                </View>
              </View>

              {/* Progress */}
              <View style={styles.progressBg}>
                <View style={[styles.progressFill, { width: `${pct}%` }]} />
              </View>
              <Text style={styles.progressText}>{pct.toFixed(0)}% budget used</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#1f1f23',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 13, color: '#71717a', marginTop: 2 },
  newBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#8b5cf6', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  newBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  searchWrapper: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#141417', borderRadius: 12, margin: 16,
    paddingHorizontal: 14, borderWidth: 1, borderColor: '#2d2d35',
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  emptyList: { flex: 1 },
  card: {
    backgroundColor: '#141417', borderRadius: 14, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: '#1f1f23',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#f4f4f5', flex: 1, marginRight: 8 },
  statusRow: { marginBottom: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  description: { fontSize: 13, color: '#71717a', lineHeight: 18, marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12, color: '#a1a1aa' },
  progressBg: { height: 4, backgroundColor: '#1f1f23', borderRadius: 2, marginBottom: 4 },
  progressFill: { height: 4, backgroundColor: '#8b5cf6', borderRadius: 2 },
  progressText: { fontSize: 11, color: '#52525b' },
  emptyContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 32, paddingBottom: 80, gap: 12,
  },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#71717a', marginTop: 12 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#8b5cf6', borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
