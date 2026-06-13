import { registerUser } from '../../api/apiService';
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext'; // ✅

export default function RegisterScreen({ navigation }) {
  const { theme } = useTheme(); // ✅
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('ADVERTISER');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'সব তথ্য দিন');
      return;
    }
    try {
      setLoading(true);
      await registerUser({ name, email, password, role });
      Alert.alert('সফল! 🎉', 'Registration সম্পন্ন! Login করুন');
      navigation.navigate('Login');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const styles = makeStyles(theme); // ✅

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.logo}>ReachFlow</Text>
          <Text style={styles.tagline}>AI-Powered Influencer Marketing</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Tab switcher */}
          <View style={styles.tabRow}>
            <TouchableOpacity style={styles.tabInactive} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.tabInactiveText}>Sign In</Text>
            </TouchableOpacity>
            <View style={styles.tabActive}>
              <Text style={styles.tabActiveText}>Create Account</Text>
            </View>
          </View>

          <Text style={styles.cardTitle}>Join ReachFlow</Text>
          <Text style={styles.cardSubtitle}>Create your account in seconds</Text>

          {/* Role selector */}
          <View style={styles.roleRow}>
            <TouchableOpacity
              style={[styles.roleCard, role === 'ADVERTISER' && styles.roleCardActive]}
              onPress={() => setRole('ADVERTISER')}>
              <Text style={styles.roleEmoji}>📢</Text>
              <Text style={[styles.roleTitle, role === 'ADVERTISER' && styles.roleTitleActive]}>Advertiser</Text>
              <Text style={styles.roleDesc}>I want to promote my product</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleCard, role === 'PROMOTER' && styles.roleCardActive]}
              onPress={() => setRole('PROMOTER')}>
              <Text style={styles.roleEmoji}>💰</Text>
              <Text style={[styles.roleTitle, role === 'PROMOTER' && styles.roleTitleActive]}>Promoter</Text>
              <Text style={styles.roleDesc}>I want to earn by promoting</Text>
            </TouchableOpacity>
          </View>

          {/* Inputs */}
          <Text style={styles.inputLabel}>Full Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={theme.subtext}
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor={theme.subtext}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.passwordBox}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Min 8 characters"
              placeholderTextColor={theme.subtext}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={20} color={theme.subtext} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> :
              <Text style={styles.buttonText}>⚡ Create Free Account</Text>}
          </TouchableOpacity>

          <Text style={styles.terms}>
            By signing up, you agree to our{' '}
            <Text style={styles.termsLink}>Terms</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  inner: { flexGrow: 1, padding: 20, paddingTop: 30 },
  headerSection: { alignItems: 'center', marginBottom: 16 },
  logo: { fontSize: 36, fontWeight: 'bold', color: theme.primary, marginBottom: 6 },
  tagline: { fontSize: 13, color: theme.subtext },
  card: {
    backgroundColor: theme.card, borderRadius: 24, padding: 24,
    paddingBottom: 32, borderWidth: 1, borderColor: theme.border, marginBottom: 20,
  },
  tabRow: {
    flexDirection: 'row', backgroundColor: theme.background,
    borderRadius: 12, padding: 4, marginBottom: 24,
  },
  tabInactive: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 10 },
  tabInactiveText: { color: theme.subtext, fontWeight: '600' },
  tabActive: {
    flex: 1, padding: 12, alignItems: 'center',
    borderRadius: 10, backgroundColor: theme.primary,
  },
  tabActiveText: { color: '#fff', fontWeight: '600' },
  cardTitle: { fontSize: 22, fontWeight: 'bold', color: theme.text, marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: theme.subtext, marginBottom: 20 },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  roleCard: {
    flex: 1, padding: 14, borderRadius: 14, borderWidth: 1.5,
    borderColor: theme.border, backgroundColor: theme.background, alignItems: 'center',
  },
  roleCardActive: { borderColor: theme.primary, backgroundColor: theme.primaryLight },
  roleEmoji: { fontSize: 24, marginBottom: 6 },
  roleTitle: { fontSize: 14, fontWeight: 'bold', color: theme.subtext, marginBottom: 2 },
  roleTitleActive: { color: theme.primary },
  roleDesc: { fontSize: 11, color: theme.subtext, textAlign: 'center', opacity: 0.7 },
  inputLabel: { fontSize: 13, color: theme.subtext, marginBottom: 8, marginTop: 4 },
  input: {
    backgroundColor: theme.background, color: theme.text,
    borderRadius: 12, padding: 14, marginBottom: 12,
    fontSize: 15, borderWidth: 1, borderColor: theme.border,
  },
  passwordBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.background, borderRadius: 12,
    paddingHorizontal: 14, marginBottom: 20,
    borderWidth: 1, borderColor: theme.border,
  },
  passwordInput: { flex: 1, color: theme.text, fontSize: 15, paddingVertical: 14 },
  button: {
    backgroundColor: theme.primary, borderRadius: 14,
    padding: 16, alignItems: 'center', marginBottom: 16,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  terms: { textAlign: 'center', color: theme.subtext, fontSize: 12 },
  termsLink: { color: theme.primary },
});



