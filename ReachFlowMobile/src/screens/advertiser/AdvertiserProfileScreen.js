import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, StatusBar, Image, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';

export default function AdvertiserProfileScreen({ navigation }) {
  const { user, logout, setUser, getToken } = useAuth();
  const { theme, themeName } = useTheme();
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
    <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, { backgroundColor: (danger ? '#ef4444' : color) + '22' }]}>
        <Ionicons name={icon} size={18} color={danger ? '#ef4444' : color} />
      </View>
      <Text style={[styles.menuText, { color: danger ? '#ef4444' : theme.text }]}>{title}</Text>
      <Ionicons name="chevron-forward" size={16} color={theme.subtext} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} showsVerticalScrollIndicator={false}>
      <StatusBar barStyle={themeName === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />

      <View style={[styles.header, { backgroundColor: theme.background, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={handlePhotoUpload} style={styles.avatarWrapper}>
          {uploading ? (
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <ActivityIndicator color="#fff" />
            </View>
          ) : user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'A'}</Text>
            </View>
          )}
          <View style={[styles.cameraIcon, { backgroundColor: theme.primary, borderColor: theme.background }]}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={[styles.name, { color: theme.text }]}>{user?.name}</Text>
        <Text style={[styles.email, { color: theme.subtext }]}>{user?.email}</Text>
        <View style={[styles.roleBadge, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}>
          <Text style={[styles.roleText, { color: theme.primary }]}>Advertiser</Text>
        </View>
      </View>

      <View style={[styles.menuSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <MenuItem icon="wallet-outline" title="Wallet ও Payment" color="#8b5cf6" onPress={() => navigation.navigate('AdvertiserWallet')} />
        <MenuItem icon="bar-chart-outline" title="Analytics" color="#22c55e" onPress={() => navigation.navigate('Analytics')} />
        <MenuItem icon="ribbon-outline" title="Subscription Plans" color="#f59e0b" onPress={() => navigation.navigate('Subscription')} />
        <MenuItem icon="chatbubble-outline" title="Messages" color="#3b82f6" onPress={() => navigation.navigate('Messages')} />
        <MenuItem icon="lock-closed-outline" title="পাসওয়ার্ড পরিবর্তন" color="#71717a" onPress={() => navigation.navigate('PasswordChange')} />
        <MenuItem icon="notifications-outline" title="Notifications" color="#ec4899" onPress={() => navigation.navigate('Notifications')} />
        <MenuItem icon="settings-outline" title="Settings" color="#6366f1" onPress={() => navigation.navigate('Settings')} />
        <MenuItem icon="help-circle-outline" title="সাহায্য ও সাপোর্ট" color="#14b8a6" onPress={() => Alert.alert('Help', 'support@reachflow.com')} />
      </View>

      <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: theme.card, borderColor: '#ef444433' }]} onPress={handleLogout} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={20} color="#ef4444" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: 56, paddingBottom: 28, alignItems: 'center', borderBottomWidth: 1 },
  avatarWrapper: { position: 'relative', marginBottom: 14 },
  avatar: { width: 84, height: 84, borderRadius: 42, justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 84, height: 84, borderRadius: 42 },
  avatarText: { fontSize: 36, fontWeight: '700', color: '#fff' },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, borderRadius: 12, width: 26, height: 26, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  name: { fontSize: 22, fontWeight: '700' },
  email: { fontSize: 14, marginTop: 4 },
  roleBadge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, marginTop: 10, borderWidth: 1 },
  roleText: { fontSize: 12, fontWeight: '600' },
  menuSection: { margin: 16, borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuText: { flex: 1, fontSize: 15, fontWeight: '500' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, borderRadius: 14, padding: 16, gap: 8, borderWidth: 1 },
  logoutText: { color: '#ef4444', fontSize: 15, fontWeight: '700' },
});



