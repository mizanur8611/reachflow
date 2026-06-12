import { useAuth } from '../../context/AuthContext';
import React, { useState } from 'react';
import {
  ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform, StyleSheet, Text, TextInput, TouchableOpacity, View, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({ navigation }) {
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

          {/* Inputs */}
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#888"
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
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={20} color="#888" />
            </TouchableOpacity>
          </View>

          {/* Login button */}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0a1e' },
  inner: { flexGrow: 1, padding: 20, paddingTop: 60 },
  headerSection: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 36, fontWeight: 'bold', color: '#a78bfa', marginBottom: 6 },
  tagline: { fontSize: 13, color: '#6b7280' },
  card: { backgroundColor: '#1a1033', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#2d1b69', marginBottom: 24 },
  tabRow: { flexDirection: 'row', backgroundColor: '#0f0a1e', borderRadius: 12, padding: 4, marginBottom: 24 },
  tabActive: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 10, backgroundColor: '#7C3AED' },
  tabActiveText: { color: '#fff', fontWeight: '600' },
  tabInactive: { flex: 1, padding: 12, alignItems: 'center', borderRadius: 10 },
  tabInactiveText: { color: '#6b7280', fontWeight: '600' },
  cardTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: '#6b7280', marginBottom: 20 },
  inputLabel: { fontSize: 13, color: '#9ca3af', marginBottom: 8, marginTop: 4 },
  input: { backgroundColor: '#0f0a1e', color: '#fff', borderRadius: 12, padding: 14, marginBottom: 12, fontSize: 15, borderWidth: 1, borderColor: '#2d1b69' },
  passwordBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f0a1e', borderRadius: 12, paddingHorizontal: 14, marginBottom: 20, borderWidth: 1, borderColor: '#2d1b69' },
  passwordInput: { flex: 1, color: '#fff', fontSize: 15, paddingVertical: 14 },
  button: { backgroundColor: '#7C3AED', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 16 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  link: { textAlign: 'center', color: '#6b7280', fontSize: 14 },
  linkBold: { color: '#a78bfa', fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16 },
  statItem: { alignItems: 'center' },
  statNum: { fontSize: 20, fontWeight: 'bold', color: '#a78bfa' },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
});



