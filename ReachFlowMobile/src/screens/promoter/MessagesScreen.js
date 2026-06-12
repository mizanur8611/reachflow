import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
  RefreshControl, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getConversations } from '../../api/apiService';

const MessagesScreen = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

 const fetchConversations = async () => {
    try {
      const res = await getConversations();
      const messages = res.data.messages || res.data || [];
      const convMap = {};
      messages.forEach(msg => {
        const other = msg.sender?.id ? msg.receiver : msg.sender;
        const key = other?.id;
        if (key && !convMap[key]) {
          convMap[key] = {
            id: key,
            otherUser: other,
            lastMessage: msg.content,
            lastMessageAt: msg.createdAt,
            unreadCount: 0,
          };
        }
      });
      setConversations(Object.values(convMap));
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchConversations();
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000);
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  };

  const renderItem = ({ item }) => {
    const hasUnread = item.unreadCount > 0;
    const otherUser = item.otherUser || item.participant || {};
    const initial = otherUser.name?.charAt(0)?.toUpperCase() || '?';

    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() => navigation.navigate('Chat', {
          conversationId: item.id,
          userName: otherUser.name || 'User',
        })}
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
          {item.isOnline && <View style={styles.onlineDot} />}
        </View>

        {/* Content */}
        <View style={styles.rowContent}>
          <View style={styles.rowTop}>
            <Text style={[styles.userName, hasUnread && styles.userNameBold]} numberOfLines={1}>
              {otherUser.name || 'Unknown'}
            </Text>
            <Text style={styles.time}>{formatTime(item.lastMessageAt || item.updatedAt)}</Text>
          </View>
          <View style={styles.rowBottom}>
            <Text style={[styles.lastMsg, hasUnread && styles.lastMsgBold]} numberOfLines={1}>
              {item.lastMessage || 'কোনো message নেই'}
            </Text>
            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderItem}
          contentContainerStyle={conversations.length === 0 ? styles.emptyList : styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" colors={['#8b5cf6']} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="#3f3f46" />
              <Text style={styles.emptyTitle}>কোনো message নেই</Text>
              <Text style={styles.emptySub}>Advertiser এর সাথে conversation শুরু হলে এখানে দেখাবে</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
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
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#1f1f23',
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { paddingVertical: 8 },
  emptyList: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f23',
    gap: 12,
  },
  avatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: '#2d2d35',
    justifyContent: 'center', alignItems: 'center',
    position: 'relative',
  },
  avatarText: { color: '#f4f4f5', fontWeight: '700', fontSize: 18 },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: '#22c55e',
    borderWidth: 2, borderColor: '#0a0a0a',
  },
  rowContent: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  userName: { fontSize: 15, color: '#a1a1aa', flex: 1 },
  userNameBold: { color: '#f4f4f5', fontWeight: '600' },
  time: { fontSize: 12, color: '#52525b' },
  rowBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  lastMsg: { fontSize: 13, color: '#52525b', flex: 1 },
  lastMsgBold: { color: '#a1a1aa', fontWeight: '500' },
  unreadBadge: {
    backgroundColor: '#8b5cf6', borderRadius: 10,
    minWidth: 20, height: 20,
    justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 5,
  },
  unreadText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  emptyContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 32, paddingBottom: 80, gap: 10,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#71717a', marginTop: 12 },
  emptySub: { fontSize: 14, color: '#3f3f46', textAlign: 'center', lineHeight: 20 },
});

export default MessagesScreen;
