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

const getMedalColor = (rank) => {
  if (rank === 1) return '#FFD700';
  if (rank === 2) return '#C0C0C0';
  if (rank === 3) return '#CD7F32';
  return null;
};

const TopThreeCard = ({ item, rank }) => {
  const medalColor = getMedalColor(rank);
  const sizes = { 1: 80, 2: 68, 3: 68 };
  const avatarSize = sizes[rank] || 56;

  return (
    <View style={[styles.topCard, rank === 1 && styles.topCardFirst]}>
      {/* Crown for #1 */}
      {rank === 1 && (
        <Text style={styles.crown}>👑</Text>
      )}

      {/* Avatar */}
      <View style={[styles.avatarWrapper, { width: avatarSize, height: avatarSize, borderColor: medalColor }]}>
        {item.avatarUrl ? (
          <Image source={{ uri: item.avatarUrl }} style={{ width: '100%', height: '100%', borderRadius: avatarSize / 2 }} />
        ) : (
          <Text style={[styles.avatarText, { fontSize: rank === 1 ? 28 : 22 }]}>
            {item.name?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        )}
      </View>

      {/* Rank badge */}
      <View style={[styles.rankBadge, { backgroundColor: medalColor }]}>
        <Text style={styles.rankBadgeText}>{rank}</Text>
      </View>

      <Text style={styles.topName} numberOfLines={1}>{item.name}</Text>
      <Text style={[styles.topEarnings, { color: medalColor }]}>
        ৳{item.totalEarnings?.toLocaleString() || item.earnings?.toLocaleString() || 0}
      </Text>
    </View>
  );
};

const LeaderboardScreen = () => {
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

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLeaderboard();
  };

  const topThree = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  const renderRow = ({ item, index }) => {
    const rank = index + 4;
    return (
      <View style={[styles.row, item.isMe && styles.rowMe]}>
        <Text style={styles.rowRank}>#{rank}</Text>

        <View style={styles.rowAvatar}>
          {item.avatarUrl ? (
            <Image source={{ uri: item.avatarUrl }} style={styles.rowAvatarImg} />
          ) : (
            <Text style={styles.rowAvatarText}>
              {item.name?.charAt(0)?.toUpperCase() || '?'}
            </Text>
          )}
        </View>

        <View style={styles.rowInfo}>
          <Text style={styles.rowName} numberOfLines={1}>
            {item.name} {item.isMe && <Text style={styles.youTag}>(তুমি)</Text>}
          </Text>
          <Text style={styles.rowSub}>{item.totalSubmissions || 0} submissions</Text>
        </View>

        <Text style={styles.rowEarnings}>
          ৳{item.totalEarnings?.toLocaleString() || item.earnings?.toLocaleString() || 0}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <Text style={styles.headerSubtitle}>শীর্ষ Promoter রা</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      ) : leaders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="trophy-outline" size={64} color="#3f3f46" />
          <Text style={styles.emptyTitle}>এখনো কোনো ডেটা নেই</Text>
          <Text style={styles.emptySubtitle}>Campaign complete করলে এখানে দেখাবে</Text>
        </View>
      ) : (
        <FlatList
          data={rest}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderRow}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" colors={['#8b5cf6']} />
          }
          ListHeaderComponent={
            <>
              {/* Top 3 podium */}
              <View style={styles.podium}>
                {/* 2nd place */}
                {topThree[1] && <TopThreeCard item={topThree[1]} rank={2} />}
                {/* 1st place */}
                {topThree[0] && <TopThreeCard item={topThree[0]} rank={1} />}
                {/* 3rd place */}
                {topThree[2] && <TopThreeCard item={topThree[2]} rank={3} />}
              </View>

              {/* My rank banner */}
              {myRank && (
                <View style={styles.myRankBanner}>
                  <Ionicons name="person-circle-outline" size={20} color="#8b5cf6" />
                  <Text style={styles.myRankText}>তোমার অবস্থান: </Text>
                  <Text style={styles.myRankValue}>#{myRank}</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f23',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#71717a',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#71717a',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#3f3f46',
  },
  list: {
    paddingBottom: 32,
  },
  // Podium
  podium: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 20,
    gap: 8,
  },
  topCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#141417',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#1f1f23',
  },
  topCardFirst: {
    backgroundColor: '#1a1425',
    borderColor: '#8b5cf633',
    paddingVertical: 20,
  },
  crown: {
    fontSize: 22,
    marginBottom: 4,
  },
  avatarWrapper: {
    borderRadius: 50,
    borderWidth: 2,
    backgroundColor: '#2d2d35',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarText: {
    color: '#f4f4f5',
    fontWeight: '700',
  },
  rankBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  rankBadgeText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '800',
  },
  topName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#f4f4f5',
    textAlign: 'center',
    marginBottom: 4,
  },
  topEarnings: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  // My rank
  myRankBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1425',
    borderWidth: 1,
    borderColor: '#8b5cf633',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  myRankText: {
    color: '#a1a1aa',
    fontSize: 14,
  },
  myRankValue: {
    color: '#8b5cf6',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 13,
    color: '#52525b',
    fontWeight: '600',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  // Row
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141417',
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1f1f23',
    gap: 10,
  },
  rowMe: {
    borderColor: '#8b5cf633',
    backgroundColor: '#1a1425',
  },
  rowRank: {
    width: 32,
    fontSize: 13,
    fontWeight: '700',
    color: '#52525b',
    textAlign: 'center',
  },
  rowAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2d2d35',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowAvatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  rowAvatarText: {
    color: '#f4f4f5',
    fontWeight: '700',
    fontSize: 16,
  },
  rowInfo: {
    flex: 1,
  },
  rowName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f4f4f5',
  },
  rowSub: {
    fontSize: 12,
    color: '#52525b',
    marginTop: 2,
  },
  youTag: {
    color: '#8b5cf6',
    fontSize: 12,
  },
  rowEarnings: {
    fontSize: 14,
    fontWeight: '700',
    color: '#22c55e',
  },
});

export default LeaderboardScreen;
