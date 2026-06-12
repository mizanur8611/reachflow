import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
  RefreshControl, StatusBar, Modal,
  TextInput, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDisputes, createDispute } from '../../api/apiService';

const STATUS_CONFIG = {
  OPEN:       { label: 'Open',       color: '#f59e0b', bg: '#1c1a0f' },
  IN_REVIEW:  { label: 'In Review',  color: '#3b82f6', bg: '#0f172a' },
  RESOLVED:   { label: 'Resolved',   color: '#22c55e', bg: '#14532d' },
  REJECTED:   { label: 'Rejected',   color: '#ef4444', bg: '#450a0a' },
};

const DisputesScreen = ({ navigation }) => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDisputes = async () => {
    try {
      const res = await getDisputes();
      setDisputes(res.data.disputes || res.data || []);
    } catch (error) {
      console.error('Failed to fetch disputes:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchDisputes(); }, []);

  const onRefresh = () => { setRefreshing(true); fetchDisputes(); };

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      await createDispute({ subject: subject.trim(), description: description.trim() });
      setModalVisible(false);
      setSubject('');
      setDescription('');
      fetchDisputes();
    } catch (error) {
      console.error('Create dispute failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const renderItem = ({ item }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.OPEN;
    return (
      <View style={styles.card}>
        {/* Top */}
        <View style={styles.cardTop}>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
          <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
        </View>

        {/* Subject */}
        <Text style={styles.cardSubject} numberOfLines={1}>{item.subject}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>

        {/* Campaign */}
        {item.campaignTitle && (
          <View style={styles.campaignTag}>
            <Ionicons name="megaphone-outline" size={12} color="#71717a" />
            <Text style={styles.campaignTagText}>{item.campaignTitle}</Text>
          </View>
        )}

        {/* Resolution */}
        {item.resolution && (
          <View style={styles.resolutionBox}>
            <Text style={styles.resolutionLabel}>Resolution:</Text>
            <Text style={styles.resolutionText}>{item.resolution}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Disputes</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      ) : (
        <FlatList
          data={disputes}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderItem}
          contentContainerStyle={disputes.length === 0 ? styles.emptyList : styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" colors={['#8b5cf6']} />
          }
          ListHeaderComponent={
            disputes.length > 0 ? (
              <View style={styles.statsRow}>
                {Object.entries(STATUS_CONFIG).map(([key, val]) => {
                  const count = disputes.filter(d => d.status === key).length;
                  return (
                    <View key={key} style={styles.statChip}>
                      <Text style={[styles.statChipCount, { color: val.color }]}>{count}</Text>
                      <Text style={styles.statChipLabel}>{val.label}</Text>
                    </View>
                  );
                })}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="warning-outline" size={64} color="#3f3f46" />
              <Text style={styles.emptyTitle}>কোনো dispute নেই</Text>
              <Text style={styles.emptySub}>কোনো সমস্যা হলে নতুন dispute খুলুন</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setModalVisible(true)}>
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.emptyBtnText}>নতুন Dispute</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* FAB */}
      {disputes.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Create Dispute Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>নতুন Dispute</Text>
              <Text style={styles.modalSub}>বিস্তারিত লিখলে দ্রুত সমাধান হবে</Text>

              <Text style={styles.inputLabel}>বিষয় *</Text>
              <TextInput
                style={styles.input}
                value={subject}
                onChangeText={setSubject}
                placeholder="সমস্যার বিষয়..."
                placeholderTextColor="#52525b"
                color="#f4f4f5"
                maxLength={100}
              />

              <Text style={styles.inputLabel}>বিবরণ *</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={description}
                onChangeText={setDescription}
                placeholder="সমস্যাটি বিস্তারিত লিখুন..."
                placeholderTextColor="#52525b"
                color="#f4f4f5"
                multiline
                maxLength={500}
              />
              <Text style={styles.charCount}>{description.length}/500</Text>

              <View style={styles.modalBtnRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => { setModalVisible(false); setSubject(''); setDescription(''); }}
                >
                  <Text style={styles.cancelText}>বাতিল</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitBtn, (!subject.trim() || !description.trim()) && styles.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={submitting || !subject.trim() || !description.trim()}
                >
                  {submitting
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={styles.submitText}>Submit</Text>
                  }
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  addBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  emptyList: { flex: 1 },
  statsRow: {
    flexDirection: 'row', gap: 8, marginBottom: 16,
  },
  statChip: {
    flex: 1, backgroundColor: '#141417', borderRadius: 10,
    padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#1f1f23',
  },
  statChipCount: { fontSize: 18, fontWeight: '700' },
  statChipLabel: { fontSize: 10, color: '#71717a', marginTop: 2 },
  card: {
    backgroundColor: '#141417', borderRadius: 14, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: '#1f1f23',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardDate: { fontSize: 12, color: '#52525b' },
  cardSubject: { fontSize: 15, fontWeight: '600', color: '#f4f4f5', marginBottom: 6 },
  cardDesc: { fontSize: 13, color: '#71717a', lineHeight: 18, marginBottom: 10 },
  campaignTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#1f1f23', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4,
    alignSelf: 'flex-start', marginBottom: 10,
  },
  campaignTagText: { fontSize: 12, color: '#71717a' },
  resolutionBox: {
    backgroundColor: '#0a0a0a', borderRadius: 8, padding: 10,
    borderLeftWidth: 3, borderLeftColor: '#22c55e',
  },
  resolutionLabel: { fontSize: 11, color: '#22c55e', fontWeight: '700', marginBottom: 4 },
  resolutionText: { fontSize: 13, color: '#a1a1aa', lineHeight: 18 },
  emptyContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 32, paddingBottom: 80, gap: 10,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#71717a', marginTop: 12 },
  emptySub: { fontSize: 14, color: '#3f3f46', textAlign: 'center' },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#8b5cf6', borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 12, marginTop: 8,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  fab: {
    position: 'absolute', bottom: 28, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center',
    elevation: 6,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: '#141417', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, borderTopWidth: 1, borderColor: '#1f1f23', maxHeight: '85%',
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: '#2d2d35',
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#f4f4f5', marginBottom: 4 },
  modalSub: { fontSize: 13, color: '#71717a', marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#a1a1aa', marginBottom: 8 },
  input: {
    backgroundColor: '#0a0a0a', borderRadius: 12, padding: 14,
    marginBottom: 16, fontSize: 14, borderWidth: 1, borderColor: '#2d2d35',
  },
  textarea: { height: 120, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: '#52525b', textAlign: 'right', marginTop: -12, marginBottom: 16 },
  modalBtnRow: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 16 },
  cancelBtn: {
    flex: 1, backgroundColor: '#1f1f23', borderRadius: 12, padding: 16, alignItems: 'center',
  },
  cancelText: { color: '#a1a1aa', fontWeight: '700' },
  submitBtn: { flex: 1, backgroundColor: '#8b5cf6', borderRadius: 12, padding: 16, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: '#4c1d95' },
  submitText: { color: '#fff', fontWeight: '700' },
});

export default DisputesScreen;



