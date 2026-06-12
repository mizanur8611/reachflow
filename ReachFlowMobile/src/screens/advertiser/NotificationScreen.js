import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
  RefreshControl, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';

const NOTIFICATION_ICONS = {
  CAMPAIGN: { icon: 'megaphone-outline', color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  PAYMENT: { icon: 'cash-outline', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  PROMOTER: { icon: 'people-outline', color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  SYSTEM: { icon: 'notifications-outline', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  DEFAULT: { icon: 'bell-outline', color: '#71717a', bg: 'rgba(113,113,122,0.15)' },
};

function timeAgo(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'এইমাত্র';
  if (diff < 3600) return `${Math.floor(diff / 60)} মিনিট আগে`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ঘণ্টা আগে`;
  return `${Math.floor(diff / 86400)} দিন আগে`;
}

export default function NotificationScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('ALL');

  const filters = ['ALL', 'CAMPAIGN', 'PAYMENT', 'PROMOTER', 'SYSTEM'];

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/notifications');
      setNotifications(res.data?.notifications || res.data || []);
    } catch (error) {
      console.log('Notification fetch error:', error);
      // Demo data for UI testing
      setNotifications([
        { id: 1, type: 'CAMPAIGN', title: 'নতুন Promoter Apply করেছে', message: 'Summer Sale 2025 campaign এ একজন নতুন promoter apply করেছে।', createdAt: new Date(Date.now() - 300000).toISOString(), read: false },
        { id: 2, type: 'PAYMENT', title: 'Payment সফল হয়েছে', message: 'আপনার wallet এ ৳5,000 যোগ হয়েছে।', createdAt: new Date(Date.now() - 3600000).toISOString(), read: false },
        { id: 3, type: 'PROMOTER', title: 'Campaign Completed', message: 'Eid Special campaign সফলভাবে শেষ হয়েছে।', createdAt: new Date(Date.now() - 86400000).toISOString(), read: true },
        { id: 4, type: 'SYSTEM', title: 'Subscription Renewal', message: 'আপনার subscription ৭ দিনের মধ্যে শেষ হবে।', createdAt: new Date(Date.now() - 172800000).toISOString(), read: true },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const filtered = filter === 'ALL' ? notifications : notifications.filter(n => n.type === filter);
  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#8b5cf6" />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSub}>{unreadCount}টি অপঠিত</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>সব পড়া</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filters}
          keyExtractor={item => item}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterBtn, filter === item && styles.filterBtnActive]}
              onPress={() => setFilter(item)}
            >
              <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
                {item === 'ALL' ? 'সব' : item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id || item._id)}
        contentContainerStyle={filtered.length === 0 ? styles.emptyList : styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchNotifications(); }}
            tintColor="#8b5cf6"
            colors={['#8b5cf6']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#3f3f46" />
            <Text style={styles.emptyText}>কোনো notification নেই</Text>
          </View>
        }
        renderItem={({ item }) => {
          const iconInfo = NOTIFICATION_ICONS[item.type] || NOTIFICATION_ICONS.DEFAULT;
          return (
            <TouchableOpacity
              style={[styles.card, !item.read && styles.cardUnread]}
              onPress={() => markRead(item.id || item._id)}
              activeOpacity={0.75}
            >
              {/* Icon */}
              <View style={[styles.iconBox, { backgroundColor: iconInfo.bg }]}>
                <Ionicons name={iconInfo.icon} size={22} color={iconInfo.color} />
              </View>

              {/* Content */}
              <View style={styles.cardContent}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                  {!item.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.cardMessage} numberOfLines={2}>{item.message}</Text>
                <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
              </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f23',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#141417',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: '#8b5cf6', marginTop: 2 },
  markAllBtn: {
    paddingHorizontal: 12, paddingVertical: 6,
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderRadius: 20, borderWidth: 1, borderColor: '#8b5cf6',
  },
  markAllText: { color: '#8b5cf6', fontSize: 12, fontWeight: '600' },
  filterRow: { paddingVertical: 12 },
  filterBtn: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
    borderColor: '#1f1f23', backgroundColor: '#141417',
  },
  filterBtnActive: {
    borderColor: '#8b5cf6',
    backgroundColor: 'rgba(139,92,246,0.15)',
  },
  filterText: { color: '#52525b', fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: '#8b5cf6' },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  emptyList: { flex: 1 },
  card: {
    flexDirection: 'row',
    backgroundColor: '#141417',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1f1f23',
    gap: 12,
  },
  cardUnread: {
    borderColor: 'rgba(139,92,246,0.3)',
    backgroundColor: 'rgba(139,92,246,0.05)',
  },
  iconBox: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  cardContent: { flex: 1 },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14, fontWeight: '700', color: '#f4f4f5', flex: 1,
  },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#8b5cf6', marginLeft: 8,
  },
  cardMessage: { fontSize: 13, color: '#71717a', lineHeight: 18, marginBottom: 6 },
  cardTime: { fontSize: 11, color: '#52525b' },
  emptyContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingBottom: 80, gap: 12,
  },
  emptyText: { fontSize: 16, color: '#52525b', marginTop: 8 },
});
