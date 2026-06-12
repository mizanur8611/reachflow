import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, TextInput, ActivityIndicator,
  KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMessages, sendMessage } from '../../api/apiService';
import { useAuth } from '../../context/AuthContext';

const ChatScreen = ({ route, navigation }) => {
  const { conversationId, userName } = route.params || {};
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef(null);

  const fetchMessages = async () => {
    try {
      const res = await getMessages(conversationId);
      setMessages(res.data.messages || res.data || []);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000); // poll every 5s
    return () => clearInterval(interval);
  }, []);

  const handleSend = async () => {
    if (!text.trim()) return;
    const msgText = text.trim();
    setText('');
    setSending(true);

    // Optimistic update
    const tempMsg = {
      id: Date.now().toString(),
      content: msgText,
      senderId: user?.id,
      createdAt: new Date().toISOString(),
      isTemp: true,
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      await sendMessage(conversationId, msgText);
      fetchMessages();
    } catch (error) {
      console.error('Send failed:', error);
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      setText(msgText);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item, index }) => {
    const isMine = item.senderId === user?.id || item.sender?.id === user?.id;
    const prevMsg = messages[index - 1];
    const showAvatar = !isMine && (!prevMsg || prevMsg.senderId !== item.senderId);

    return (
      <View style={[styles.msgRow, isMine ? styles.msgRowRight : styles.msgRowLeft]}>
        {!isMine && (
          <View style={[styles.msgAvatar, { opacity: showAvatar ? 1 : 0 }]}>
            <Text style={styles.msgAvatarText}>{userName?.charAt(0)?.toUpperCase() || '?'}</Text>
          </View>
        )}
        <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther, item.isTemp && styles.bubbleTemp]}>
          <Text style={[styles.bubbleText, isMine ? styles.bubbleTextMine : styles.bubbleTextOther]}>
            {item.content || item.message}
          </Text>
          <Text style={[styles.bubbleTime, isMine ? styles.bubbleTimeMine : styles.bubbleTimeOther]}>
            {formatTime(item.createdAt)}
            {isMine && (
              <Text> {item.isTemp ? '⏳' : '✓'}</Text>
            )}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{userName?.charAt(0)?.toUpperCase() || '?'}</Text>
          </View>
          <Text style={styles.headerName}>{userName}</Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderMessage}
          contentContainerStyle={styles.msgList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatText}>কথোপকথন শুরু করুন 👋</Text>
            </View>
          }
        />
      )}

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Message লিখুন..."
          placeholderTextColor="#52525b"
          color="#f4f4f5"
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          {sending
            ? <ActivityIndicator size="small" color="#fff" />
            : <Ionicons name="send" size={18} color="#fff" />
          }
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f23',
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#1f1f23',
    justifyContent: 'center', alignItems: 'center',
  },
  headerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center', alignItems: 'center',
  },
  headerAvatarText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  headerName: { fontSize: 16, fontWeight: '700', color: '#f4f4f5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  msgList: { padding: 16, gap: 4 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 4, gap: 8 },
  msgRowRight: { justifyContent: 'flex-end' },
  msgRowLeft: { justifyContent: 'flex-start' },
  msgAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#2d2d35',
    justifyContent: 'center', alignItems: 'center',
  },
  msgAvatarText: { color: '#f4f4f5', fontWeight: '700', fontSize: 11 },
  bubble: {
    maxWidth: '75%', borderRadius: 16, padding: 10,
    paddingHorizontal: 14,
  },
  bubbleMine: {
    backgroundColor: '#8b5cf6',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: '#141417',
    borderWidth: 1,
    borderColor: '#1f1f23',
    borderBottomLeftRadius: 4,
  },
  bubbleTemp: { opacity: 0.7 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTextMine: { color: '#fff' },
  bubbleTextOther: { color: '#f4f4f5' },
  bubbleTime: { fontSize: 10, marginTop: 4 },
  bubbleTimeMine: { color: '#ddd6fe', textAlign: 'right' },
  bubbleTimeOther: { color: '#52525b' },
  emptyChat: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyChatText: { color: '#52525b', fontSize: 14 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#1f1f23',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#141417',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2d2d35',
    maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center', alignItems: 'center',
  },
  sendBtnDisabled: { backgroundColor: '#2d2d35' },
});

export default ChatScreen;

