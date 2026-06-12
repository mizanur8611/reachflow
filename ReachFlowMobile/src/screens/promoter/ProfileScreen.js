import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';

export default function ProfileScreen({ navigation }) {
  const { user, logout, setUser, getToken } = useAuth();
  const { theme } = useTheme();
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
      }
    } catch (error) {
      Alert.alert('Error', 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const MenuItem = ({ icon, title, onPress }) => (
    <TouchableOpacity style={[styles.menuItem, { borderBottomColor: theme.border }]} onPress={onPress}>
      <Ionicons name={icon} size={22} color={theme.primary} />
      <Text style={[styles.menuText, { color: theme.text }]}>{title}</Text>
      <Ionicons name="chevron-forward" size={18} color={theme.subtext} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={[styles.header, { backgroundColor: theme.primary }]}>
        <TouchableOpacity onPress={handlePhotoUpload} style={styles.avatarWrapper}>
          {uploading ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase()}</Text>
          )}
          <View style={[styles.cameraIcon, { backgroundColor: theme.primary }]}>
            <Ionicons name="camera" size={14} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>Promoter</Text>
        </View>
      </View>

      <View style={[styles.menuSection, { backgroundColor: theme.card }]}>
        <MenuItem icon="shield-checkmark-outline" title="KYC যাচাইকরণ" onPress={() => navigation.navigate('KYC')} />
        <MenuItem icon="person-outline" title="প্রোফাইল এডিট করুন" onPress={() => navigation.navigate('ProfileEdit')} />
        <MenuItem icon="notifications-outline" title="নোটিফিকেশন" onPress={() => navigation.navigate('Notifications')} />
        <MenuItem icon="lock-closed-outline" title="পাসওয়ার্ড পরিবর্তন" onPress={() => navigation.navigate('PasswordChange')} />
        <MenuItem icon="settings-outline" title="Settings" onPress={() => navigation.navigate('Settings')} />
        <MenuItem icon="help-circle-outline" title="সাহায্য ও সাপোর্ট" onPress={() => Alert.alert('Coming Soon')} />
        <MenuItem icon="document-text-outline" title="Terms & Conditions" onPress={() => Alert.alert('Coming Soon')} />
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { padding: 24, paddingTop: 60, alignItems: 'center' },
  avatarWrapper: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
    position: 'relative',
  },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  cameraIcon: {
    position: 'absolute', bottom: 0, right: 0,
    borderRadius: 10, width: 20, height: 20,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  name: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  email: { fontSize: 14, color: '#e0deff', marginTop: 4 },
  roleBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20, marginTop: 8 },
  roleText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  menuSection: { margin: 16, borderRadius: 16, overflow: 'hidden', elevation: 2 },
  menuItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  menuText: { flex: 1, fontSize: 15, marginLeft: 12 },
  logoutBtn: { backgroundColor: '#ff4757', margin: 16, borderRadius: 12, padding: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});




