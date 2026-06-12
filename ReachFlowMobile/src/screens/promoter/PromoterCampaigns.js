import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, Alert, Modal, TextInput, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCampaigns, applyCampaign, submitProof } from '../../api/apiService';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export default function CampaignsScreen({ navigation }) {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [postUrl, setPostUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [applyingId, setApplyingId] = useState(null);
  const [proofImage, setProofImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { getToken } = useAuth();
  const { theme } = useTheme();
  const [applicationIds, setApplicationIds] = useState({});

  useEffect(() => { fetchCampaigns(); }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await getCampaigns();
      setCampaigns(res.data.campaigns || res.data || []);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (campaign) => {
    const id = campaign.id || campaign._id;
    setApplyingId(id);
    try {
      const res = await applyCampaign(id);
      const applicationId = res.data?.application?.id || res.data?.id;
      setApplicationIds(prev => ({ ...prev, [campaign.id]: applicationId }));
      navigation.navigate('TrackingLink', {
        applicationId,
        campaignId: campaign.id,
        campaignTitle: campaign.title,
      });
    } catch (error) {
      const msg = error.response?.data?.message || 'Apply failed';
      Alert.alert('Error', msg);
    } finally {
      setApplyingId(null);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission', 'Photo access permission দিন'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], allowsEditing: true, quality: 0.7,
    });
    if (result.canceled) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', { uri: result.assets[0].uri, type: 'image/jpeg', name: 'proof.jpg' });
      const res = await fetch('https://reachflow-j34o.onrender.com/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${await getToken()}` },
        body: formData,
      });
      const data = await res.json();
      if (data.url) setProofImage(data.url);
    } catch (e) { Alert.alert('Error', 'Upload failed'); }
    finally { setUploadingImage(false); }
  };

  const handleSubmitProof = async () => {
    if (!postUrl) { Alert.alert('Error', 'Post URL দিন'); return; }
    setSubmitting(true);
    try {
      await submitProof({
        applicationId: applicationIds[selectedCampaign.id] || selectedCampaign.id,
        postUrl,
        description: caption,
      });
      Alert.alert('Success', 'Proof জমা হয়েছে!');
      setModalVisible(false);
      setPostUrl('');
      setCaption('');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1, backgroundColor: theme.background }} size="large" color={theme.primary} />;

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={[styles.headerBox, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <Text style={[styles.header, { color: theme.text }]}>সকল ক্যাম্পেইন</Text>
        <Text style={[styles.headerSub, { color: theme.subtext }]}>{campaigns.length}টি ক্যাম্পেইন পাওয়া গেছে</Text>
      </View>

      <FlatList
        data={campaigns}
        keyExtractor={(item) => String(item.id || item._id)}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Ionicons name="megaphone-outline" size={48} color={theme.subtext} />
            <Text style={[styles.emptyText, { color: theme.subtext }]}>কোনো ক্যাম্পেইন নেই</Text>
          </View>
        }
        renderItem={({ item }) => {
          const id = item.id || item._id;
          const isApplying = applyingId === id;
          return (
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>{item.title}</Text>
                <View style={[styles.badge, { backgroundColor: item.status === 'ACTIVE' ? '#14532d' : '#431407' }]}>
                  <Text style={[styles.badgeText, { color: item.status === 'ACTIVE' ? '#22c55e' : '#f97316' }]}>
                    {item.status}
                  </Text>
                </View>
              </View>
              <Text style={[styles.description, { color: theme.subtext }]} numberOfLines={2}>{item.description}</Text>
              {item.platforms?.length > 0 && (
                <View style={styles.platformRow}>
                  {item.platforms.map((p) => (
                    <View key={p} style={[styles.platformTag, { backgroundColor: theme.primaryLight }]}>
                      <Text style={[styles.platformText, { color: theme.primary }]}>{p}</Text>
                    </View>
                  ))}
                </View>
              )}
              <View style={styles.cardFooter}>
                <View>
                  <Text style={[styles.commission, { color: theme.primary }]}>৳{item.commissionAmount}</Text>
                  <Text style={[styles.commissionLabel, { color: theme.subtext }]}>কমিশন / পোস্ট</Text>
                </View>
                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={[styles.applyBtn, { backgroundColor: theme.primary }, isApplying && { opacity: 0.7 }]}
                    onPress={() => handleApply(item)}
                    disabled={isApplying}
                  >
                    {isApplying
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={styles.applyText}>Apply</Text>
                    }
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.proofBtn, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}
                    onPress={() => { setSelectedCampaign(item); setModalVisible(true); }}
                  >
                    <Text style={[styles.proofText, { color: theme.primary }]}>Proof</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />

      <Text style={[styles.inputLabel, { color: theme.subtext }]}>Proof Screenshot (optional)</Text>
      <TouchableOpacity style={[styles.imagePickerBtn, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={handlePickImage}>
        {uploadingImage ? (
          <ActivityIndicator color={theme.primary} />
        ) : proofImage ? (
          <Image source={{ uri: proofImage }} style={styles.proofImagePreview} />
        ) : (
          <>
            <Ionicons name="image-outline" size={24} color={theme.primary} />
            <Text style={[styles.imagePickerText, { color: theme.primary }]}>Screenshot select করুন</Text>
          </>
        )}
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={[styles.modalHandle, { backgroundColor: theme.border }]} />
            <Text style={[styles.modalTitle, { color: theme.text }]}>Proof Submit করুন</Text>
            <Text style={[styles.modalSubtitle, { color: theme.subtext }]}>{selectedCampaign?.title}</Text>
            <Text style={[styles.inputLabel, { color: theme.subtext }]}>Post URL *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              value={postUrl}
              onChangeText={setPostUrl}
              placeholder="https://facebook.com/..."
              placeholderTextColor={theme.subtext}
              autoCapitalize="none"
            />
            <Text style={[styles.inputLabel, { color: theme.subtext }]}>Caption (optional)</Text>
            <TextInput
              style={[styles.input, { height: 80, backgroundColor: theme.inputBg, borderColor: theme.border, color: theme.text }]}
              value={caption}
              onChangeText={setCaption}
              placeholder="Post এর caption..."
              placeholderTextColor={theme.subtext}
              multiline
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: theme.background, borderColor: theme.border, borderWidth: 1 }]} onPress={() => setModalVisible(false)}>
                <Text style={[styles.cancelText, { color: theme.text }]}>বাতিল</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.primary }]} onPress={handleSubmitProof} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Submit</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  headerBox: { paddingHorizontal: 20, paddingTop: 56, paddingBottom: 16, borderBottomWidth: 1 },
  header: { fontSize: 22, fontWeight: '700' },
  headerSub: { fontSize: 13, marginTop: 2 },
  card: { borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', flex: 1, marginRight: 8 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  description: { fontSize: 13, marginBottom: 12, lineHeight: 18 },
  platformRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },
  platformTag: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  platformText: { fontSize: 11, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  commission: { fontSize: 20, fontWeight: '700' },
  commissionLabel: { fontSize: 11, marginTop: 1 },
  btnRow: { flexDirection: 'row', gap: 8 },
  applyBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, minWidth: 72, alignItems: 'center' },
  applyText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  proofBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  proofText: { fontWeight: '700', fontSize: 14 },
  emptyCard: { alignItems: 'center', padding: 60, gap: 12 },
  emptyText: { fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderTopWidth: 1 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', marginBottom: 4 },
  modalSubtitle: { fontSize: 14, marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  input: { borderRadius: 12, padding: 14, marginBottom: 16, fontSize: 14, borderWidth: 1 },
  modalBtnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
  cancelText: { fontWeight: '700' },
  submitBtn: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '700' },
  imagePickerBtn: { borderRadius: 12, borderWidth: 1, padding: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 16, height: 100 },
  imagePickerText: { fontSize: 13, marginTop: 6 },
  proofImagePreview: { width: '100%', height: 90, borderRadius: 8 },
});




