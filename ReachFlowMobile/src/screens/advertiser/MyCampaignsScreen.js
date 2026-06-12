import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, TouchableOpacity,
  RefreshControl, StatusBar, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMyCampaigns } from '../../api/apiService';
import { useTheme } from '../../context/ThemeContext';

export default function MyCampaignsScreen({ navigation }) {
  const { theme, themeName } = useTheme();
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

  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: theme.background }} size="large" color={theme.primary} />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar barStyle={themeName === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.headerBg} />

      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>My Campaigns</Text>
          <Text style={[styles.headerSub, { color: theme.subtext }]}>Manage and track your campaigns</Text>
        </View>
        <TouchableOpacity
          style={[styles.newBtn, { backgroundColor: theme.primary }]}
          onPress={() => navigation.navigate('CreateCampaign')}
        >
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.newBtnText}>New Campaign</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.searchWrapper, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <Ionicons name="search-outline" size={18} color={theme.subtext} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          value={search}
          onChangeText={setSearch}
          placeholder="Search campaigns..."
          placeholderTextColor={theme.subtext}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={theme.subtext} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id || item._id)}
        contentContainerStyle={filtered.length === 0 ? styles.emptyList : styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} colors={[theme.primary]} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="megaphone-outline" size={64} color={theme.subtext} />
            <Text style={[styles.emptyText, { color: theme.subtext }]}>
              {search ? 'কোনো ফলাফল পাওয়া যায়নি' : 'কোনো campaign নেই'}
            </Text>
            {!search && (
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: theme.primary }]}
                onPress={() => navigation.navigate('CreateCampaign')}
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
              style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={() => navigation.navigate('CampaignDetail', { campaignId: item.id || item._id })}
              activeOpacity={0.75}
            >
              <View style={styles.cardTop}>
                <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
                <Ionicons name="eye-outline" size={18} color={theme.subtext} />
              </View>
              <View style={styles.statusRow}>
                <View style={[styles.badge, { backgroundColor: item.status === 'ACTIVE' ? '#14532d' : '#1c1a0f' }]}>
                  <Text style={[styles.badgeText, { color: item.status === 'ACTIVE' ? '#22c55e' : '#f59e0b' }]}>
                    {item.status}
                  </Text>
                </View>
              </View>
              <Text style={[styles.description, { color: theme.subtext }]} numberOfLines={2}>{item.description}</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Ionicons name="cash-outline" size={14} color={theme.primary} />
                  <Text style={[styles.statText, { color: theme.subtext }]}>Budget: ${budget}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="trending-up-outline" size={14} color="#22c55e" />
                  <Text style={[styles.statText, { color: theme.subtext }]}>${item.commissionAmount || 0}/Post</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="people-outline" size={14} color="#3b82f6" />
                  <Text style={[styles.statText, { color: theme.subtext }]}>{item.promoterCount || item.applicationsCount || 0} Promoters</Text>
                </View>
              </View>
              <View style={[styles.progressBg, { backgroundColor: theme.border }]}>
                <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: theme.primary }]} />
              </View>
              <Text style={[styles.progressText, { color: theme.subtext }]}>{pct.toFixed(0)}% budget used</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  headerSub: { fontSize: 13, marginTop: 2 },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  newBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  searchWrapper: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, margin: 16, paddingHorizontal: 14, borderWidth: 1 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  emptyList: { flex: 1 },
  card: { borderRadius: 14, padding: 16, marginBottom: 10, borderWidth: 1 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardTitle: { fontSize: 16, fontWeight: '700', flex: 1, marginRight: 8 },
  statusRow: { marginBottom: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700' },
  description: { fontSize: 13, lineHeight: 18, marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: 12 },
  progressBg: { height: 4, borderRadius: 2, marginBottom: 4 },
  progressFill: { height: 4, borderRadius: 2 },
  progressText: { fontSize: 11 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingBottom: 80, gap: 12 },
  emptyText: { fontSize: 18, fontWeight: '600', marginTop: 12 },
  emptyBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});




