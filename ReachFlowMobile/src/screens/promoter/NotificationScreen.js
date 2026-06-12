import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../../api/apiService';

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data.notifications || res.data || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  const markAsRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'campaign_approved':
        return { name: 'checkmark-circle', color: '#22c55e' };
      case 'campaign_rejected':
        return { name: 'close-circle', color: '#ef4444' };
      case 'payment':
        return { name: 'cash', color: '#f59e0b' };
      case 'kyc':
        return { name: 'shield-checkmark', color: '#8b5cf6' };
      case 'message':
        return { name: 'chatbubble', color: '#3b82f6' };
      default:
        return { name: 'notifications', color: '#8b5cf6' };
    }
  };

  const formatTime = (dateStr) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 60) return 'এইমাত্র';
    if (diff < 3600) return `${Math.floor(diff / 60)} মিনিট আগে`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ঘন্টা আগে`;
    return `${Math.floor(diff / 86400)} দিন আগে`;
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const renderItem = ({ item }) => {
    const icon = getIcon(item.type);
    return (
      <TouchableOpacity
        style={[styles.card, !item.isRead && styles.unreadCard]}
        onPress={() => !item.isRead && markAsRead(item.id)}
        activeOpacity={0.75}
      >
        {!item.isRead && <View style={styles.unreadDot} />}

        <View style={[styles.iconWrapper, { backgroundColor: icon.color + '22' }]}>
          <Ionicons name={icon.name} size={22} color={icon.color} />
        </View>

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {item.message || item.body}
          </Text>
          <Text style={styles.time}>{formatTime(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-off-outline" size={64} color="#3f3f46" />
      <Text style={styles.emptyTitle}>কোনো নোটিফিকেশন নেই</Text>
      <Text style={styles.emptySubtitle}>নতুন আপডেট আসলে এখানে দেখাবে</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <Text style={styles.headerSubtitle}>{unreadCount}টি অপঠিত</Text>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>সব পড়া হয়েছে</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderItem}
          ListEmptyComponent={EmptyState}
          contentContainerStyle={
            notifications.length === 0 ? styles.emptyList : styles.list
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#8b5cf6"
              colors={['#8b5cf6']}
            />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    color: '#8b5cf6',
    marginTop: 2,
  },
  markAllBtn: {
    backgroundColor: '#1f1f23',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  markAllText: {
    color: '#8b5cf6',
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  emptyList: {
    flex: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#141417',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1f1f23',
    position: 'relative',
  },
  unreadCard: {
    borderColor: '#8b5cf633',
    backgroundColor: '#18141f',
  },
  unreadDot: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#8b5cf6',
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    paddingRight: 16,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f4f4f5',
    marginBottom: 4,
  },
  message: {
    fontSize: 13,
    color: '#a1a1aa',
    lineHeight: 18,
    marginBottom: 6,
  },
  time: {
    fontSize: 12,
    color: '#52525b',
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
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#71717a',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#3f3f46',
    marginTop: 6,
  },
});

export default NotificationScreen;
