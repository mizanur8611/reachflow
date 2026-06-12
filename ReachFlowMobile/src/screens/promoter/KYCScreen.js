import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Image
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getKYCStatus } from '../../api/apiService';
import { getToken } from '../../api/apiService';

export default function KYCScreen({ navigation }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [nidFront, setNidFront] = useState(null);
  const [nidBack, setNidBack] = useState(null);
  const [selfie, setSelfie] = useState(null);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await getKYCStatus();
      setStatus(res.data.status);
    } catch (e) {
      setStatus('NOT_SUBMITTED');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (setter) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
    });
    if (!result.canceled) setter(result.assets[0]);
  };

  const handleSubmit = async () => {
    if (!nidFront || !nidBack || !selfie) {
      Alert.alert('Error', 'সব ছবি দিন: NID সামনে, NID পেছনে, এবং Selfie');
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('type', 'NID');
      formData.append('nidFront', { uri: nidFront.uri, type: 'image/jpeg', name: 'nidFront.jpg' });
      formData.append('nidBack', { uri: nidBack.uri, type: 'image/jpeg', name: 'nidBack.jpg' });
      formData.append('selfie', { uri: selfie.uri, type: 'image/jpeg', name: 'selfie.jpg' });

      const token = getToken();
      const res = await fetch('https://reachflow-j34o.onrender.com/api/kyc/submit', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('সফল!', 'KYC জমা হয়েছে। Review এর জন্য অপেক্ষা করুন।');
        setStatus('PENDING');
      } else {
        Alert.alert('Error', data.message || 'কিছু সমস্যা হয়েছে');
      }
    } catch (e) {
      Alert.alert('Error', 'Submit করা যায়নি');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color="#6C63FF" />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>KYC যাচাইকরণ</Text>
        <Text style={styles.subtitle}>Withdraw করতে KYC দরকার</Text>
      </View>

      {status === 'VERIFIED' && (
        <View style={[styles.statusBox, { backgroundColor: '#e6f4ea' }]}>
          <Text style={[styles.statusText, { color: '#2e7d32' }]}>✅ KYC যাচাই সম্পন্ন!</Text>
        </View>
      )}

      {status === 'PENDING' && (
        <View style={[styles.statusBox, { backgroundColor: '#fff8e1' }]}>
          <Text style={[styles.statusText, { color: '#f57f17' }]}>⏳ Review চলছে...</Text>
        </View>
      )}

      {status === 'REJECTED' && (
        <View style={[styles.statusBox, { backgroundColor: '#fce4ec' }]}>
          <Text style={[styles.statusText, { color: '#c62828' }]}>❌ Rejected — আবার submit করুন</Text>
        </View>
      )}

      {(status === 'NOT_SUBMITTED' || status === 'REJECTED') && (
        <View style={styles.form}>
          <Text style={styles.label}>NID সামনের ছবি *</Text>
          <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage(setNidFront)}>
            {nidFront ? <Image source={{ uri: nidFront.uri }} style={styles.preview} /> :
              <Text style={styles.uploadText}>📷 ছবি বেছে নিন</Text>}
          </TouchableOpacity>

          <Text style={styles.label}>NID পেছনের ছবি *</Text>
          <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage(setNidBack)}>
            {nidBack ? <Image source={{ uri: nidBack.uri }} style={styles.preview} /> :
              <Text style={styles.uploadText}>📷 ছবি বেছে নিন</Text>}
          </TouchableOpacity>

          <Text style={styles.label}>Selfie *</Text>
          <TouchableOpacity style={styles.uploadBtn} onPress={() => pickImage(setSelfie)}>
            {selfie ? <Image source={{ uri: selfie.uri }} style={styles.preview} /> :
              <Text style={styles.uploadText}>🤳 Selfie তুলুন</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
            {submitting ? <ActivityIndicator color="#fff" /> :
              <Text style={styles.submitText}>Submit করুন</Text>}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#6C63FF', padding: 24, paddingTop: 48 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 14, color: '#ddd', marginTop: 4 },
  statusBox: { margin: 16, padding: 16, borderRadius: 12 },
  statusText: { fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  form: { padding: 16 },
  label: { fontSize: 15, fontWeight: 'bold', color: '#333', marginBottom: 8, marginTop: 16 },
  uploadBtn: { backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed' },
  uploadText: { color: '#6C63FF', fontSize: 15 },
  preview: { width: '100%', height: 150, borderRadius: 8 },
  submitBtn: { backgroundColor: '#6C63FF', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24, marginBottom: 40 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

