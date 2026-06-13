import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getLeaderboard } from '../../api/apiService';
import { useTheme } from '../../context/ThemeContext'; // ✅

const getMedalColor = (rank) => {
  if (rank === 1) return '#FFD700';
  if (rank === 2) return '#C0C0C0';
  if (rank === 3) return '#CD7F32';
  return null;
};

const TopThreeCard = ({ item, rank, theme }) => { // ✅ theme prop
  const medalColor = getMedalColor(rank);
  const sizes = { 1: 80, 2: 68, 3: 68 };
  const avatarSize = sizes[rank] || 56;

  return (
    <View style={[
      styles.topCard,
      { backgroundColor: theme.card, borderColor: theme.border },
      rank === 1 && { backgroundColor: theme.primaryLight, borderColor: theme.primary + '33' },
    ]}>
      {rank === 1 && <Text style={styles.crown}>👑</Text>}

      <View style={[styles.avatarWrapper, { width: avatarSize, height: avatarSize, borderColor: medalColor, backgroundColor: theme.border }]}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={{ width: '100%', height: '100%', borderRadius: avatarSize / 2 }} />
        ) : (
          <Text style={[styles.avatarText, { fontSize: rank === 1 ? 28 : 22, color: theme.text }]}>
            {item.name?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        )}
      </View>

      <View style={[styles.rankBadge, { backgroundColor: medalColor }]}>
        <Text style={styles.rankBadgeText}>{rank}</Text>
      </View>

      <Text style={[styles.topName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
      <Text style={[styles.topEarnings, { color: medalColor }]}>
        ৳{item.totalEarnings?.toLocaleString() || item.earnings?.toLocaleString() || 0}
      </Text>
    </View>
  );
};

const LeaderboardScreen = () => {
  const { theme, themeName } = useTheme(); // ✅
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [myRank, setMyRank] = useState(null);

  const fetchLeaderboard = async () => {
    try {
      const res = await getLeaderboard();
      const data = res.data.promoters || res.data.leaderboard || [];
      setLeaders(data);
      setMyRank(res.data.myRank || null);
    } catch (error) {
      console.error('Leaderboard fetch failed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchLeaderboard(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchLeaderboard(); };

  const topThree = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  const styles = makeStyles(theme); // ✅

  const renderRow = ({ item, index }) => {
    const rank = index + 4;
    return (
      <View style={[
        styles.row,
        item.isMe && { borderColor: theme.primary + '33', backgroundColor: theme.primaryLight },
      ]}>
        <Text style={styles.rowRank}>#{rank}</Text>

        <View style={[styles.rowAvatar, { backgroundColor: theme.border }]}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.rowAvatarImg} />
          ) : (
            <Text style={[styles.rowAvatarText, { color: theme.text }]}>
              {item.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          )}
        </View>

        <View style={styles.rowInfo}>
          <Text style={[styles.rowName, { color: theme.text }]} numberOfLines={1}>
            {item.name} {item.isMe && <Text style={[styles.youTag, { color: theme.primary }]}>(তুমি)</Text>}
          </Text>
          <Text style={[styles.rowSub, { color: theme.subtext }]}>{item.totalSubmissions || 0} submissions</Text>
        </View>

        <Text style={styles.rowEarnings}>
          ৳{item.totalEarnings?.toLocaleString() || item.earnings?.toLocaleString() || 0}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={themeName === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={theme.headerBg}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <Text style={styles.headerSubtitle}>শীর্ষ Promoter রা</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : leaders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="trophy-outline" size={64} color={theme.border} />
          <Text style={[styles.emptyTitle, { color: theme.subtext }]}>এখনো কোনো ডেটা নেই</Text>
          <Text style={[styles.emptySubtitle, { color: theme.subtext }]}>Campaign complete করলে এখানে দেখাবে</Text>
        </View>
      ) : (
        <FlatList
          data={rest}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderRow}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          ListHeaderComponent={
            <>
              {/* Top 3 podium */}
              <View style={styles.podium}>
                {topThree[1] && <TopThreeCard item={topThree[1]} rank={2} theme={theme} />}
                {topThree[0] && <TopThreeCard item={topThree[0]} rank={1} theme={theme} />}
                {topThree[2] && <TopThreeCard item={topThree[2]} rank={3} theme={theme} />}
              </View>

              {/* My rank banner */}
              {myRank && (
                <View style={styles.myRankBanner}>
                  <Ionicons name="person-circle-outline" size={20} color={theme.primary} />
                  <Text style={styles.myRankText}>তোমার অবস্থান: </Text>
                  <Text style={[styles.myRankValue, { color: theme.primary }]}>#{myRank}</Text>
                </View>
              )}

              {rest.length > 0 && (
                <Text style={styles.sectionLabel}>বাকি তালিকা</Text>
              )}
            </>
          }
        />
      )}
    </View>
  );
};

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: {
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: theme.border,
    backgroundColor: theme.headerBg,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: theme.text },
  headerSubtitle: { fontSize: 13, color: theme.subtext, marginTop: 2 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 12 },
  emptySubtitle: { fontSize: 14 },
  list: { paddingBottom: 32 },
  podium: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end',
    paddingHorizontal: 16, paddingTop: 28, paddingBottom: 20, gap: 8,
  },
  topCard: {
    flex: 1, alignItems: 'center', borderRadius: 16,
    paddingVertical: 16, paddingHorizontal: 8, borderWidth: 1,
  },
  crown: { fontSize: 22, marginBottom: 4 },
  avatarWrapper: {
    borderRadius: 50, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
  },
  avatarText: { fontWeight: '700' },
  rankBadge: {
    width: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  rankBadgeText: { color: '#000', fontSize: 11, fontWeight: '800' },
  topName: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginBottom: 4 },
  topEarnings: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  myRankBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.primaryLight,
    borderWidth: 1, borderColor: theme.primary + '33',
    borderRadius: 12, marginHorizontal: 16, marginBottom: 16,
    paddingHorizontal: 16, paddingVertical: 12, gap: 6,
  },
  myRankText: { color: theme.subtext, fontSize: 14 },
  myRankValue: { fontSize: 14, fontWeight: '700' },
  sectionLabel: { fontSize: 13, color: theme.subtext, fontWeight: '600', paddingHorizontal: 16, marginBottom: 8 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.card,
    marginHorizontal: 16, marginBottom: 8,
    borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: theme.border, gap: 10,
  },
  rowRank: { width: 32, fontSize: 13, fontWeight: '700', color: theme.subtext, textAlign: 'center' },
  rowAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  rowAvatarImg: { width: 40, height: 40, borderRadius: 20 },
  rowAvatarText: { fontWeight: '700', fontSize: 16 },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 14, fontWeight: '600' },
  rowSub: { fontSize: 12, marginTop: 2 },
  youTag: { fontSize: 12 },
  rowEarnings: { fontSize: 14, fontWeight: '700', color: '#22c55e' },
});

export default LeaderboardScreen;


