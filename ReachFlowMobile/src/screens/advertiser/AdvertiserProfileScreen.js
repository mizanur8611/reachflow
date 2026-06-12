import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, StatusBar, Image, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function AdvertiserProfileScreen({ navigation }) {
  const { user, logout, setUser, getToken } = useAuth();
  const [uploading, setUploading] = useState(false);

  const handleLogout = () => {
    Alert.alert('Logout', 'Logout করতে চান?', [
      { text: 'না', style: 'cancel' },
      { text: 'হ্যাঁ', onPress: logout }
    ]);
  };

  const handlePhotoUpload = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission', 'Photo access permission দিন');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', {
        uri: result.assets[0].uri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      });
      const token = await getToken();
      const res = await fetch('https://reachflow-j34o.onrender.com/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.url) {
        if (setUser) setUser({ ...user, avatar: data.url });
        Alert.alert('সফল!', 'Profile photo update হয়েছে!');
      } else {
        Alert.alert('Error', 'ছবি upload হয়নি');
      }
    } catch (error) {
      Alert.alert('Error', 'Upload failed');
    } finally {
      setUploading(false);
    }
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

      <View style={styles.header}>
        <TouchableOpacity onPress={handlePhotoUpload} style={styles.avatarWrapper}>
          {uploading ? (
            <View style={styles.avatar}>
              <ActivityIndicator color="#fff" />
            </View>
          ) : user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'A'}</Text>
            </View>
          )}
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>Advertiser</Text>
        </View>
      </View>

      <View style={styles.menuSection}>
        <MenuItem icon="wallet-outline" title="Wallet ও Payment" color="#8b5cf6" onPress={() => navigation.navigate('AdvertiserWallet')} />
        <MenuItem icon="bar-chart-outline" title="Analytics" color="#22c55e" onPress={() => navigation.navigate('Analytics')} />
        <MenuItem icon="crown-outline" title="Subscription Plans" color="#f59e0b" onPress={() => navigation.navigate('Subscription')} />
        <MenuItem icon="chatbubble-outline" title="Messages" color="#3b82f6" onPress={() => navigation.navigate('Messages')} />
        <MenuItem icon="lock-closed-outline" title="পাসওয়ার্ড পরিবর্তন" color="#71717a" onPress={() => navigation.navigate('PasswordChange')} />
        <MenuItem icon="notifications-outline" title="Notifications" color="#ec4899" onPress={() => navigation.navigate('Notifications')} />
        <MenuItem icon="help-circle-outline" title="সাহায্য ও সাপোর্ট" color="#14b8a6" onPress={() => Alert.alert('Help', 'support@reachflow.com')} />
      </View>

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
  avatarWrapper: { position: 'relative', marginBottom: 14 },
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarImage: { width: 84, height: 84, borderRadius: 42 },
  avatarText: { fontSize: 36, fontWeight: '700', color: '#fff' },
  cameraIcon: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#8b5cf6', borderRadius: 12,
    width: 26, height: 26,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#0a0a0a',
  },
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




