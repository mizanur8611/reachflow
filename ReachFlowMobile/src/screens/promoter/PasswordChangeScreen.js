import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, StatusBar,
  ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { changePassword } from '../../api/apiService';

const PasswordChangeScreen = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const isStrong = (pass) => pass.length >= 8;
  const isMatch = newPassword && confirmPassword && newPassword === confirmPassword;
  const canSubmit = currentPassword && isStrong(newPassword) && isMatch;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      await changePassword({ currentPassword, newPassword });
      Alert.alert('সফল!', 'পাসওয়ার্ড পরিবর্তন হয়েছে।', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      const msg = error.response?.data?.message || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const PasswordInput = ({ label, value, onChange, show, toggleShow, placeholder }) => (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor="#52525b"
          color="#f4f4f5"
          secureTextEntry={!show}
          autoCapitalize="none"
        />
        <TouchableOpacity onPress={toggleShow} style={styles.eyeBtn}>
          <Ionicons name={show ? 'eye-off-outline' : 'eye-outline'} size={20} color="#71717a" />
        </TouchableOpacity>
      </View>
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
        <Text style={styles.headerTitle}>Password Change</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Icon */}
        <View style={styles.iconBox}>
          <Ionicons name="lock-closed" size={32} color="#8b5cf6" />
        </View>
        <Text style={styles.title}>নতুন পাসওয়ার্ড সেট করুন</Text>
        <Text style={styles.subtitle}>নিরাপদ পাসওয়ার্ড ব্যবহার করুন</Text>

        {/* Inputs */}
        <PasswordInput
          label="বর্তমান পাসওয়ার্ড"
          value={currentPassword}
          onChange={setCurrentPassword}
          show={showCurrent}
          toggleShow={() => setShowCurrent(!showCurrent)}
          placeholder="বর্তমান পাসওয়ার্ড দিন"
        />
        <PasswordInput
          label="নতুন পাসওয়ার্ড"
          value={newPassword}
          onChange={setNewPassword}
          show={showNew}
          toggleShow={() => setShowNew(!showNew)}
          placeholder="নতুন পাসওয়ার্ড দিন"
        />

        {/* Strength indicator */}
        {newPassword.length > 0 && (
          <View style={styles.strengthRow}>
            <View style={[styles.strengthBar, { backgroundColor: isStrong(newPassword) ? '#22c55e' : '#ef4444' }]} />
            <Text style={[styles.strengthText, { color: isStrong(newPassword) ? '#22c55e' : '#ef4444' }]}>
              {isStrong(newPassword) ? 'শক্তিশালী পাসওয়ার্ড' : 'কমপক্ষে ৮ অক্ষর দিন'}
            </Text>
          </View>
        )}

        <PasswordInput
          label="পাসওয়ার্ড নিশ্চিত করুন"
          value={confirmPassword}
          onChange={setConfirmPassword}
          show={showConfirm}
          toggleShow={() => setShowConfirm(!showConfirm)}
          placeholder="পাসওয়ার্ড আবার দিন"
        />

        {/* Match indicator */}
        {confirmPassword.length > 0 && (
          <View style={styles.matchRow}>
            <Ionicons
              name={isMatch ? 'checkmark-circle' : 'close-circle'}
              size={16}
              color={isMatch ? '#22c55e' : '#ef4444'}
            />
            <Text style={{ color: isMatch ? '#22c55e' : '#ef4444', fontSize: 13 }}>
              {isMatch ? 'পাসওয়ার্ড মিলেছে' : 'পাসওয়ার্ড মিলছে না'}
            </Text>
          </View>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.submitText}>পাসওয়ার্ড পরিবর্তন করুন</Text>
          }
        </TouchableOpacity>
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
  content: { padding: 24, alignItems: 'center' },
  iconBox: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#1a1425', borderWidth: 1, borderColor: '#8b5cf633',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#f4f4f5', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#71717a', marginBottom: 28 },
  inputGroup: { width: '100%', marginBottom: 16 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#a1a1aa', marginBottom: 8 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#141417', borderRadius: 12,
    borderWidth: 1, borderColor: '#2d2d35',
  },
  input: { flex: 1, padding: 14, fontSize: 14 },
  eyeBtn: { padding: 14 },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', marginTop: -8, marginBottom: 16 },
  strengthBar: { width: 40, height: 4, borderRadius: 2 },
  strengthText: { fontSize: 12 },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '100%', marginTop: -8, marginBottom: 16 },
  submitBtn: {
    width: '100%', backgroundColor: '#8b5cf6',
    borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 8,
  },
  submitBtnDisabled: { backgroundColor: '#4c1d95' },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default PasswordChangeScreen;



