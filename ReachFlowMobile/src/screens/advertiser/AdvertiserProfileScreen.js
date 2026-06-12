import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, StatusBar } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function AdvertiserProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Logout করতে চান?', [
      { text: 'না', style: 'cancel' },
      { text: 'হ্যাঁ', onPress: logout }
    ]);
  };

  const MenuItem = ({ icon, title, onPress, color = '#8b5cf6', danger = false }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, { backgroundColor: (danger ? '#ef4444' : color) + '22' }]}>
        <Ionicons name={icon} size={18} color={danger ? '#ef4444' : color} />
      </View>
      <Text style={[styles.menuText, danger && { color: '#ef4444' }]}>{title}</Text>
      <Ionicons name="chevron-forward" size={16} color="#3f3f46" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'A'}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>Advertiser</Text>
        </View>
      </View>

      {/* Menu */}
      <View style={styles.menuSection}>
        <MenuItem
          icon="wallet-outline"
          title="Wallet ও Payment"
          color="#8b5cf6"
          onPress={() => navigation.navigate('AdvertiserWallet')}
        />
        <MenuItem
          icon="bar-chart-outline"
          title="Analytics"
          color="#22c55e"
          onPress={() => navigation.navigate('Analytics')}
        />
        <MenuItem
          icon="crown-outline"
          title="Subscription Plans"
          color="#f59e0b"
          onPress={() => navigation.navigate('Subscription')}
        />
        <MenuItem
          icon="chatbubble-outline"
          title="Messages"
          color="#3b82f6"
          onPress={() => navigation.navigate('Messages')}
        />
        <MenuItem
          icon="lock-closed-outline"
          title="পাসওয়ার্ড পরিবর্তন"
          color="#71717a"
          onPress={() => navigation.navigate('PasswordChange')}
        />
        <MenuItem
          icon="notifications-outline"
          title="Notifications"
          color="#ec4899"
          onPress={() => navigation.navigate('Notifications')}
        />
        <MenuItem
          icon="help-circle-outline"
          title="সাহায্য ও সাপোর্ট"
          color="#14b8a6"
          onPress={() => Alert.alert('Help', 'support@reachflow.com')}
        />
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    backgroundColor: '#0a0a0a',
    paddingTop: 56, paddingBottom: 28,
    alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#1f1f23',
  },
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center', alignItems: 'center', marginBottom: 14,
  },
  avatarText: { fontSize: 36, fontWeight: '700', color: '#fff' },
  name: { fontSize: 22, fontWeight: '700', color: '#f4f4f5' },
  email: { fontSize: 14, color: '#71717a', marginTop: 4 },
  roleBadge: {
    backgroundColor: '#1a1425', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 5, marginTop: 10,
    borderWidth: 1, borderColor: '#8b5cf633',
  },
  roleText: { color: '#8b5cf6', fontSize: 12, fontWeight: '600' },
  menuSection: {
    backgroundColor: '#141417', margin: 16,
    borderRadius: 16, borderWidth: 1, borderColor: '#1f1f23',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f1f23',
    gap: 12,
  },
  menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuText: { flex: 1, fontSize: 15, color: '#f4f4f5', fontWeight: '500' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#141417', marginHorizontal: 16, borderRadius: 14,
    padding: 16, gap: 8, borderWidth: 1, borderColor: '#ef444433',
  },
  logoutText: { color: '#ef4444', fontSize: 15, fontWeight: '700' },
});

