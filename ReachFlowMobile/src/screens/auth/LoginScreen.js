import { useAuth } from '../../context/AuthContext';
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext'; // ✅

export default function LoginScreen({ navigation }) {
  const { theme } = useTheme(); // ✅
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Email ও Password দিন');
      return;
    }
    try {
      setLoading(true);
      const res = await fetch('https://reachflow-j34o.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.success) {
        console.log('Login user:', JSON.stringify(data.user));
        await login(data.user, data.token);
      } else {
        Alert.alert('Error', data.error || 'Login failed');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
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
            <View style={styles.tabActive}>
              <Text style={styles.tabActiveText}>Sign In</Text>
            </View>
            <TouchableOpacity style={styles.tabInactive} onPress={() => navigation.navigate('Register')}>
              <Text style={styles.tabInactiveText}>Create Account</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.cardTitle}>Welcome Back 👋</Text>
          <Text style={styles.cardSubtitle}>Sign in to your account</Text>

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
              placeholder="Your password"
              placeholderTextColor={theme.subtext}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={20} color={theme.subtext} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> :
              <Text style={styles.buttonText}>Sign In →</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>অ্যাকাউন্ট নেই? <Text style={styles.linkBold}>Register করুন</Text></Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>80K+</Text>
            <Text style={styles.statLabel}>Promoters</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>12K+</Text>
            <Text style={styles.statLabel}>Campaigns</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>$2M+</Text>
            <Text style={styles.statLabel}>Paid Out</Text>
          </View>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  inner: { flexGrow: 1, padding: 20, paddingTop: 60 },
  headerSection: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 36, fontWeight: 'bold', color: theme.primary, marginBottom: 6 },
  tagline: { fontSize: 13, color: theme.subtext },
  card: {
    backgroundColor: theme.card, borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: theme.border, marginBottom: 24,
  },
  tabRow: {
    flexDirection: 'row', backgroundColor: theme.background,
    borderRadius: 12, padding: 4, marginBottom: 24,
  },
  tabActive: {
    flex: 1, padding: 12, alignItems: 'center',
    borderRadius: 10, backgroundColor: theme.primary,
  },
  tabActiveText: { color: '#fff', fontWeight: '600' },
  tabInactive: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 10 },
  tabInactiveText: { color: theme.subtext, fontWeight: '600' },
  cardTitle: { fontSize: 22, fontWeight: 'bold', color: theme.text, marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: theme.subtext, marginBottom: 20 },
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
  link: { textAlign: 'center', color: theme.subtext, fontSize: 14 },
  linkBold: { color: theme.primary, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16 },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: 'bold', color: theme.primary },
  statLabel: { fontSize: 11, color: theme.subtext, marginTop: 2 },
});



