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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';

const ProfileEditScreen = ({ navigation }) => {
  const { user, setUser } = useAuth();
  const { theme, themeName } = useTheme();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatar, setAvatar] = useState(user?.avatar ?? null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasChanges =
    name !== (user?.name || '') ||
    phone !== (user?.phone || '') ||
    bio !== (user?.bio || '');

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
      if (data.url) {
        setAvatar(data.url);
        const saveRes = await updateProfile({
          name: name.trim(),
          phone: phone.trim(),
          bio: bio.trim(),
          avatar: data.url,
        });
        if (setUser) setUser(saveRes.data.user || saveRes.data);
        Alert.alert('সফল!', 'Profile photo update হয়েছে!');
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
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar barStyle={themeName === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.headerBg} />
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.card }]}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Profile Edit</Text>
        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: theme.primary }, !hasChanges && { backgroundColor: theme.primaryLight }]}
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
              <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                <ActivityIndicator color="#fff" />
              </View>
            ) : avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                <Text style={styles.avatarText}>{name?.charAt(0)?.toUpperCase() || '?'}</Text>
              </View>
            )}
            <View style={[styles.cameraIcon, { backgroundColor: theme.primary, borderColor: theme.background }]}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.avatarEmail, { color: theme.subtext }]}>{user?.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}>
            <Text style={[styles.roleText, { color: theme.primary }]}>{user?.role || 'PROMOTER'}</Text>
          </View>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.subtext }]}>নাম *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              value={name}
              onChangeText={setName}
              placeholder="তোমার নাম"
              placeholderTextColor={theme.subtext}
              maxLength={50}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.subtext }]}>Email</Text>
            <View style={[styles.inputDisabled, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Text style={[styles.inputDisabledText, { color: theme.subtext }]}>{user?.email}</Text>
              <Ionicons name="lock-closed-outline" size={16} color={theme.subtext} />
            </View>
            <Text style={[styles.inputHint, { color: theme.subtext }]}>Email পরিবর্তন করা যাবে না</Text>
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.subtext }]}>ফোন নম্বর</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="+880XXXXXXXXXX"
              placeholderTextColor={theme.subtext}
              keyboardType="phone-pad"
              maxLength={15}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.subtext }]}>Bio</Text>
            <TextInput
              style={[styles.input, styles.textarea, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              value={bio}
              onChangeText={setBio}
              placeholder="নিজের সম্পর্কে কিছু লিখুন..."
              placeholderTextColor={theme.subtext}
              multiline
              maxLength={200}
            />
            <Text style={[styles.charCount, { color: theme.subtext }]}>{bio.length}/200</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.passwordLink, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => navigation.navigate('PasswordChange')}
        >
          <Ionicons name="lock-closed-outline" size={18} color={theme.primary} />
          <Text style={[styles.passwordLinkText, { color: theme.text }]}>পাসওয়ার্ড পরিবর্তন করুন</Text>
          <Ionicons name="chevron-forward" size={16} color={theme.subtext} />
        </TouchableOpacity>
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16, borderBottomWidth: 1,
  },
  backBtn: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  saveBtn: { borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8 },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  content: { padding: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 28 },
  avatarWrapper: { position: 'relative', marginBottom: 10 },
  avatar: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 32 },
  cameraIcon: { position: 'absolute', bottom: 0, right: 0, borderRadius: 12, width: 24, height: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
  avatarEmail: { fontSize: 14, marginBottom: 8 },
  roleBadge: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1 },
  roleText: { fontSize: 12, fontWeight: '600' },
  form: { gap: 4 },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { borderRadius: 12, padding: 14, fontSize: 14, borderWidth: 1 },
  textarea: { height: 100, textAlignVertical: 'top' },
  inputDisabled: { borderRadius: 12, padding: 14, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  inputDisabledText: { fontSize: 14 },
  inputHint: { fontSize: 11, marginTop: 4 },
  charCount: { fontSize: 11, textAlign: 'right', marginTop: 4 },
  passwordLink: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, padding: 16, borderWidth: 1, marginTop: 8 },
  passwordLinkText: { flex: 1, fontSize: 14, fontWeight: '500' },
});

export default ProfileEditScreen;






