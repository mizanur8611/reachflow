import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
  TouchableOpacity, Alert, Modal, TextInput, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCampaigns, applyCampaign, submitProof } from '../../api/apiService';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../context/AuthContext';

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
  const [applicationIds, setApplicationIds] = useState({});

  useEffect(() => {
    fetchCampaigns();
  }, []);

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
      // Tracking Link screen এ navigate করো
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
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true, quality: 0.7,
  });
  if (result.canceled) return;
  setUploadingImage(true);
  try {
    const formData = new FormData();
    formData.append('image', { uri: result.assets[0].uri, type: 'image/jpeg', name: 'proof.jpg' });
    const res = await fetch('https://reachflow-j34o.onrender.com/api/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${getToken()}` },
      body: formData,
    });
    const data = await res.json();
    if (data.url) setProofImage(data.url);
  } catch (e) { Alert.alert('Error', 'Upload failed'); }
  finally { setUploadingImage(false); }
};

  const handleSubmitProof = async () => {
    if (!postUrl) {
      Alert.alert('Error', 'Post URL দিন');
      return;
    }
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

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#8b5cf6" />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerBox}>
        <Text style={styles.header}>সকল ক্যাম্পেইন</Text>
        <Text style={styles.headerSub}>{campaigns.length}টি ক্যাম্পেইন পাওয়া গেছে</Text>
      </View>

      <FlatList
        data={campaigns}
        keyExtractor={(item) => String(item.id || item._id)}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Ionicons name="megaphone-outline" size={48} color="#3f3f46" />
            <Text style={styles.emptyText}>কোনো ক্যাম্পেইন নেই</Text>
          </View>
        }
        renderItem={({ item }) => {
          const id = item.id || item._id;
          const isApplying = applyingId === id;
          return (
            <View style={styles.card}>
              {/* Top row */}
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                <View style={[
                  styles.badge,
                  { backgroundColor: item.status === 'ACTIVE' ? '#14532d' : '#431407' }
                ]}>
                  <Text style={[
                    styles.badgeText,
                    { color: item.status === 'ACTIVE' ? '#22c55e' : '#f97316' }
                  ]}>
                    {item.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.description} numberOfLines={2}>{item.description}</Text>

              {/* Platforms */}
              {item.platforms?.length > 0 && (
                <View style={styles.platformRow}>
                  {item.platforms.map((p) => (
                    <View key={p} style={styles.platformTag}>
                      <Text style={styles.platformText}>{p}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Footer */}
              <View style={styles.cardFooter}>
                <View>
                  <Text style={styles.commission}>৳{item.commissionAmount}</Text>
                  <Text style={styles.commissionLabel}>কমিশন / পোস্ট</Text>
                </View>
                <View style={styles.btnRow}>
                  <TouchableOpacity
                    style={[styles.applyBtn, isApplying && styles.applyBtnDisabled]}
                    onPress={() => handleApply(item)}
                    disabled={isApplying}
                  >
                    {isApplying
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={styles.applyText}>Apply</Text>
                    }
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.proofBtn}
                    onPress={() => {
                      setSelectedCampaign(item);
                      setModalVisible(true);
                    }}
                  >
                    <Text style={styles.proofText}>Proof</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />

      <Text style={styles.inputLabel}>Proof Screenshot (optional)</Text>
      <TouchableOpacity style={styles.imagePickerBtn} onPress={handlePickImage}>
        {uploadingImage ? (
          <ActivityIndicator color="#8b5cf6" />
        ) : proofImage ? (
          <Image source={{ uri: proofImage }} style={styles.proofImagePreview} />
        ) : (
          <>
            <Ionicons name="image-outline" size={24} color="#8b5cf6" />
            <Text style={styles.imagePickerText}>Screenshot select করুন</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Proof Submit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Proof Submit করুন</Text>
            <Text style={styles.modalSubtitle}>{selectedCampaign?.title}</Text>

            <Text style={styles.inputLabel}>Post URL *</Text>
            <TextInput
              style={styles.input}
              value={postUrl}
              onChangeText={setPostUrl}
              placeholder="https://facebook.com/..."
              placeholderTextColor="#52525b"
              color="#f4f4f5"
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Caption (optional)</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              value={caption}
              onChangeText={setCaption}
              placeholder="Post এর caption..."
              placeholderTextColor="#52525b"
              color="#f4f4f5"
              multiline
            />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelText}>বাতিল</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmitProof}
                disabled={submitting}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.submitText}>Submit</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  headerBox: {
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f23',
  },
  header: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSub: {
    fontSize: 13,
    color: '#71717a',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#141417',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1f1f23',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f4f4f5',
    flex: 1,
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  description: {
    fontSize: 13,
    color: '#71717a',
    marginBottom: 12,
    lineHeight: 18,
  },
  platformRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  platformTag: {
    backgroundColor: '#1f1f23',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  platformText: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commission: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  commissionLabel: {
    fontSize: 11,
    color: '#52525b',
    marginTop: 1,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  applyBtn: {
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 72,
    alignItems: 'center',
  },
  applyBtnDisabled: {
    backgroundColor: '#6d42c4',
  },
  applyText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  proofBtn: {
    backgroundColor: '#1f1f23',
    borderWidth: 1,
    borderColor: '#2d2d35',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  proofText: {
    color: '#a1a1aa',
    fontWeight: '700',
    fontSize: 14,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#52525b',
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: '#141417',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderColor: '#1f1f23',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#2d2d35',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#f4f4f5',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#71717a',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#a1a1aa',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2d2d35',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#1f1f23',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelText: {
    color: '#a1a1aa',
    fontWeight: '700',
  },
  submitBtn: {
    flex: 1,
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  submitText: {
    color: '#fff',
    fontWeight: '700',
  },
  imagePickerBtn: {
  backgroundColor: '#0a0a0a',
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#2d2d35',
  padding: 20,
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: 16,
  height: 100,
  },
  imagePickerText: {
    color: '#8b5cf6',
    fontSize: 13,
    marginTop: 6,
  },
  proofImagePreview: {
    width: '100%',
    height: 90,
    borderRadius: 8,
  },
});



