import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator,
  RefreshControl, StatusBar, Modal,
  TextInput, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDisputes, createDispute } from '../../api/apiService';
import { useTheme } from '../../context/ThemeContext'; // ✅

const STATUS_CONFIG = {
  OPEN:      { label: 'Open',      color: '#f59e0b', bg: '#1c1a0f' },
  IN_REVIEW: { label: 'In Review', color: '#3b82f6', bg: '#0f172a' },
  RESOLVED:  { label: 'Resolved',  color: '#22c55e', bg: '#14532d' },
  REJECTED:  { label: 'Rejected',  color: '#ef4444', bg: '#450a0a' },
};

const DisputesScreen = ({ navigation }) => {
  const { theme, themeName } = useTheme(); // ✅
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
    return new Date(dateStr).toLocaleDateString('bn-BD', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const styles = makeStyles(theme); // ✅

  const renderItem = ({ item }) => {
    const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.OPEN;
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
          <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
        </View>
        <Text style={styles.cardSubject} numberOfLines={1}>{item.subject}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
        {item.campaignTitle && (
          <View style={styles.campaignTag}>
            <Ionicons name="megaphone-outline" size={12} color={theme.subtext} />
            <Text style={styles.campaignTagText}>{item.campaignTitle}</Text>
          </View>
        )}
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
      <StatusBar
        barStyle={themeName === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={theme.headerBg}
      />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Disputes</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={disputes}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={renderItem}
          contentContainerStyle={disputes.length === 0 ? styles.emptyList : styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing} onRefresh={onRefresh}
              tintColor={theme.primary} colors={[theme.primary]}
            />
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
              <Ionicons name="warning-outline" size={64} color={theme.border} />
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

      {disputes.length > 0 && (
        <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Modal */}
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
                placeholderTextColor={theme.subtext}
                color={theme.text}
                maxLength={100}
              />

              <Text style={styles.inputLabel}>বিবরণ *</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={description}
                onChangeText={setDescription}
                placeholder="সমস্যাটি বিস্তারিত লিখুন..."
                placeholderTextColor={theme.subtext}
                color={theme.text}
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

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: theme.border,
    backgroundColor: theme.headerBg,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: theme.card, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: theme.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: theme.text },
  addBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center',
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  emptyList: { flex: 1 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statChip: {
    flex: 1, backgroundColor: theme.card, borderRadius: 10,
    padding: 10, alignItems: 'center', borderWidth: 1, borderColor: theme.border,
  },
  statChipCount: { fontSize: 18, fontWeight: '700' },
  statChipLabel: { fontSize: 10, color: theme.subtext, marginTop: 2 },
  card: {
    backgroundColor: theme.card, borderRadius: 14, padding: 16,
    marginBottom: 10, borderWidth: 1, borderColor: theme.border,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardDate: { fontSize: 12, color: theme.subtext },
  cardSubject: { fontSize: 15, fontWeight: '600', color: theme.text, marginBottom: 6 },
  cardDesc: { fontSize: 13, color: theme.subtext, lineHeight: 18, marginBottom: 10 },
  campaignTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: theme.background, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 4,
    alignSelf: 'flex-start', marginBottom: 10,
    borderWidth: 1, borderColor: theme.border,
  },
  campaignTagText: { fontSize: 12, color: theme.subtext },
  resolutionBox: {
    backgroundColor: theme.background, borderRadius: 8, padding: 10,
    borderLeftWidth: 3, borderLeftColor: '#22c55e',
  },
  resolutionLabel: { fontSize: 11, color: '#22c55e', fontWeight: '700', marginBottom: 4 },
  resolutionText: { fontSize: 13, color: theme.subtext, lineHeight: 18 },
  emptyContainer: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 32, paddingBottom: 80, gap: 10,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: theme.subtext, marginTop: 12 },
  emptySub: { fontSize: 14, color: theme.subtext, textAlign: 'center', opacity: 0.6 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: theme.primary, borderRadius: 12,
    paddingHorizontal: 20, paddingVertical: 12, marginTop: 8,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  fab: {
    position: 'absolute', bottom: 28, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: theme.primary, justifyContent: 'center', alignItems: 'center',
    elevation: 6,
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, borderTopWidth: 1, borderColor: theme.border, maxHeight: '85%',
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: theme.border,
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: theme.text, marginBottom: 4 },
  modalSub: { fontSize: 13, color: theme.subtext, marginBottom: 20 },
  inputLabel: { fontSize: 13, fontWeight: '600', color: theme.subtext, marginBottom: 8 },
  input: {
    backgroundColor: theme.background, borderRadius: 12, padding: 14,
    marginBottom: 16, fontSize: 14, borderWidth: 1, borderColor: theme.border,
    color: theme.text,
  },
  textarea: { height: 120, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: theme.subtext, textAlign: 'right', marginTop: -12, marginBottom: 16 },
  modalBtnRow: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 16 },
  cancelBtn: {
    flex: 1, backgroundColor: theme.background, borderRadius: 12,
    padding: 16, alignItems: 'center', borderWidth: 1, borderColor: theme.border,
  },
  cancelText: { color: theme.subtext, fontWeight: '700' },
  submitBtn: { flex: 1, backgroundColor: theme.primary, borderRadius: 12, padding: 16, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontWeight: '700' },
});

export default DisputesScreen;

