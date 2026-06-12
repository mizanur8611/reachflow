import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, StatusBar,
  ScrollView, Alert, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { updateProfile } from '../../api/apiService';
import { getToken } from '../../api/apiService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileEditScreen = ({ navigation }) => {
  const { user, setUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasChanges =
    name !== (user?.name || '') ||
    phone !== (user?.phone || '') ||
    bio !== (user?.bio || '') ||
    avatar !== (user?.avatar || null);

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled) return;

    setUploading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();
      formData.append('image', {
        uri: result.assets[0].uri,
        type: 'image/jpeg',
        name: 'avatar.jpg',
      });
      const res = await fetch('https://reachflow-j34o.onrender.com/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      console.log('Upload response:', JSON.stringify(data));
      if (data.url) {
        setAvatar(data.url);
      } else {
        Alert.alert('Error', 'ছবি upload হয়নি');
      }
    } catch (e) {
      Alert.alert('Error', 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'নাম দিন');
      return;
    }
    setLoading(true);
    try {
      const res = await updateProfile({ 
        name: name.trim(), 
        phone: phone.trim(), 
        bio: bio.trim(),
        avatar,
      });
      if (setUser) setUser(res.data.user || res.data);
      Alert.alert('সফল!', 'প্রোফাইল আপডেট হয়েছে।', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      const msg = error.response?.data?.message || 'আপডেট ব্যর্থ হয়েছে';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Edit</Text>
        <TouchableOpacity
          style={[styles.saveBtn, !hasChanges && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={!hasChanges || loading}
        >
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.saveBtnText}>Save</Text>
          }
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickAvatar} style={styles.avatarWrapper}>
            {uploading ? (
              <View style={styles.avatar}>
                <ActivityIndicator color="#fff" />
              </View>
            ) : avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{name?.charAt(0)?.toUpperCase() || '?'}</Text>
              </View>
            )}
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarEmail}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role || 'PROMOTER'}</Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>নাম *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="তোমার নাম"
              placeholderTextColor="#52525b"
              color="#f4f4f5"
              maxLength={50}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <View style={styles.inputDisabled}>
              <Text style={styles.inputDisabledText}>{user?.email}</Text>
              <Ionicons name="lock-closed-outline" size={16} color="#52525b" />
            </View>
            <Text style={styles.inputHint}>Email পরিবর্তন করা যাবে না</Text>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>ফোন নম্বর</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+880XXXXXXXXXX"
              placeholderTextColor="#52525b"
              color="#f4f4f5"
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={bio}
              onChangeText={setBio}
              placeholder="নিজের সম্পর্কে কিছু লিখুন..."
              placeholderTextColor="#52525b"
              color="#f4f4f5"
              multiline
              maxLength={200}
            />
            <Text style={styles.charCount}>{bio.length}/200</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.passwordLink}
          onPress={() => navigation.navigate('PasswordChange')}
        >
          <Ionicons name="lock-closed-outline" size={18} color="#8b5cf6" />
          <Text style={styles.passwordLinkText}>পাসওয়ার্ড পরিবর্তন করুন</Text>
          <Ionicons name="chevron-forward" size={16} color="#52525b" />
        </TouchableOpacity>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: '#1f1f23',
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#1f1f23', justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  saveBtn: {
    backgroundColor: '#8b5cf6', borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  saveBtnDisabled: { backgroundColor: '#4c1d95' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  content: { padding: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatarWrapper: { position: 'relative', marginBottom: 10 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#8b5cf6',
    justifyContent: 'center', alignItems: 'center',
  },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 32 },
  cameraIcon: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#8b5cf6', borderRadius: 12,
    width: 24, height: 24,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#0a0a0a',
  },
  avatarEmail: { fontSize: 14, color: '#71717a', marginBottom: 8 },
  roleBadge: {
    backgroundColor: '#1a1425', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 4,
    borderWidth: 1, borderColor: '#8b5cf633',
  },
  roleText: { color: '#8b5cf6', fontSize: 12, fontWeight: '600' },
  form: { gap: 4 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#a1a1aa', marginBottom: 8 },
  input: {
    backgroundColor: '#141417', borderRadius: 12, padding: 14,
    fontSize: 14, borderWidth: 1, borderColor: '#2d2d35',
  },
  textarea: { height: 100, textAlignVertical: 'top' },
  inputDisabled: {
    backgroundColor: '#0a0a0a', borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: '#1f1f23',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  inputDisabledText: { color: '#52525b', fontSize: 14 },
  inputHint: { fontSize: 11, color: '#3f3f46', marginTop: 4 },
  charCount: { fontSize: 11, color: '#52525b', textAlign: 'right', marginTop: 4 },
  passwordLink: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#141417', borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: '#1f1f23', marginTop: 8,
  },
  passwordLinkText: { flex: 1, color: '#f4f4f5', fontSize: 14, fontWeight: '500' },
});

export default ProfileEditScreen;



