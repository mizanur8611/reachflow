import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
  RefreshControl, StatusBar, Modal, TextInput,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getWallet, addMoney } from '../../api/apiService';
import { useTheme } from '../../context/ThemeContext'; // ✅ path ঠিক করো

const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit / Debit Card', icon: 'card-outline', color: '#3b82f6', currency: 'USD' },
  { id: 'paypal', label: 'PayPal', icon: 'globe-outline', color: '#0070ba', currency: 'USD' },
  { id: 'bkash', label: 'bKash', icon: 'phone-portrait-outline', color: '#e2136e', currency: 'BDT' },
  { id: 'nagad', label: 'Nagad', icon: 'phone-portrait-outline', color: '#f26522', currency: 'BDT' },
  { id: 'usdt', label: 'USDT (TRC20)', icon: 'logo-bitcoin', color: '#26a17b', currency: 'USD' },
];

const TX_ICON = {
  DEPOSIT: { name: 'arrow-down-circle', color: '#22c55e' },
  WITHDRAWAL: { name: 'arrow-up-circle', color: '#ef4444' },
  PAYMENT: { name: 'cash', color: '#f59e0b' },
};

const AdvertiserWalletScreen = ({ navigation }) => {
  const { theme, themeName } = useTheme(); // ✅
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [submitting, setSubmitting] = useState(false);

  const fetchWallet = async () => {
    try {
      const res = await getWallet();
      setWallet(res.data.wallet || res.data);
    } catch (error) {
      console.error('Wallet fetch failed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchWallet(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchWallet(); };

  const handleAddMoney = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setSubmitting(true);
    try {
      await addMoney({ amount: parseFloat(amount), method: selectedMethod });
      setModalVisible(false);
      setAmount('');
      fetchWallet();
    } catch (error) {
      console.error('Add money failed:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedMethodData = PAYMENT_METHODS.find(m => m.id === selectedMethod);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const styles = makeStyles(theme); // ✅

  return (
    <View style={styles.container}>
      {/* ✅ StatusBar theme অনুযায়ী */}
      <StatusBar
        barStyle={themeName === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={theme.headerBg}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Wallet</Text>
          <Text style={styles.headerSub}>Manage your balance and transactions</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.addBtnText}>Add Money</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
              colors={[theme.primary]}
            />
          }
          contentContainerStyle={styles.content}
        >
          {/* Balance Cards */}
          <View style={styles.balanceRow}>
            <View style={styles.balanceCard}>
              <View style={[styles.balanceIcon, { backgroundColor: theme.primary + '22' }]}>
                <Ionicons name="wallet-outline" size={22} color={theme.primary} />
              </View>
              <Text style={styles.balanceValue}>${wallet?.balance?.toFixed(2) || '0.00'}</Text>
              <Text style={styles.balanceLabel}>Available Balance</Text>
            </View>
            <View style={styles.balanceCard}>
              <View style={[styles.balanceIcon, { backgroundColor: '#f59e0b22' }]}>
                <Ionicons name="time-outline" size={22} color="#f59e0b" />
              </View>
              <Text style={styles.balanceValue}>${wallet?.pendingBalance?.toFixed(2) || '0.00'}</Text>
              <Text style={styles.balanceLabel}>Pending</Text>
            </View>
            <View style={styles.balanceCard}>
              <View style={[styles.balanceIcon, { backgroundColor: '#22c55e22' }]}>
                <Ionicons name="arrow-down-circle-outline" size={22} color="#22c55e" />
              </View>
              <Text style={styles.balanceValue}>${wallet?.totalDeposited?.toFixed(2) || '0.00'}</Text>
              <Text style={styles.balanceLabel}>Total Deposited</Text>
            </View>
          </View>

          {/* Transaction History */}
          <Text style={styles.sectionTitle}>Transaction History</Text>
          {wallet?.transactions?.length > 0 ? (
            wallet.transactions.map((tx, i) => {
              const icon = TX_ICON[tx.type] || TX_ICON.PAYMENT;
              return (
                <View key={i} style={styles.txRow}>
                  <View style={[styles.txIcon, { backgroundColor: icon.color + '22' }]}>
                    <Ionicons name={icon.name} size={20} color={icon.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txTitle}>{tx.description || tx.type}</Text>
                    <Text style={styles.txDate}>{formatDate(tx.createdAt)}</Text>
                  </View>
                  <Text style={[styles.txAmount, { color: tx.type === 'DEPOSIT' ? '#22c55e' : '#ef4444' }]}>
                    {tx.type === 'DEPOSIT' ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                  </Text>
                </View>
              );
            })
          ) : (
            <View style={styles.emptyTx}>
              <Ionicons name="receipt-outline" size={48} color={theme.border} />
              <Text style={styles.emptyTxText}>No transactions yet</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Add Money Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Money</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color={theme.subtext} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Amount (USD)</Text>
            <View style={styles.amountWrapper}>
              <Text style={styles.currencySign}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={amount}
                onChangeText={setAmount}
                placeholder="0.00"
                placeholderTextColor={theme.subtext}
                color={theme.text}
                keyboardType="numeric"
              />
            </View>

            {/* Quick amounts */}
            <View style={styles.quickAmounts}>
              {['10', '25', '50', '100'].map((v) => (
                <TouchableOpacity
                  key={v}
                  style={[styles.quickBtn, amount === v && styles.quickBtnActive]}
                  onPress={() => setAmount(v)}
                >
                  <Text style={[styles.quickBtnText, amount === v && styles.quickBtnTextActive]}>${v}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Payment methods */}
            {PAYMENT_METHODS.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[styles.methodRow, selectedMethod === m.id && styles.methodRowActive]}
                onPress={() => setSelectedMethod(m.id)}
              >
                <View style={[styles.methodIcon, { backgroundColor: m.color + '22' }]}>
                  <Ionicons name={m.icon} size={18} color={m.color} />
                </View>
                <Text style={styles.methodLabel}>{m.label}</Text>
                <Text style={styles.methodCurrency}>{m.currency}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.payBtn, (!amount || parseFloat(amount) <= 0) && styles.payBtnDisabled]}
              onPress={handleAddMoney}
              disabled={submitting || !amount || parseFloat(amount) <= 0}
            >
              {submitting
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.payBtnText}>
                    Pay ${amount || '0'} via {selectedMethodData?.label}
                  </Text>
              }
            </TouchableOpacity>
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
  headerSub: { fontSize: 12, color: theme.subtext, marginTop: 2 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: theme.primary, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16 },
  balanceRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  balanceCard: {
    flex: 1, backgroundColor: theme.card, borderRadius: 14, padding: 14,
    alignItems: 'center', borderWidth: 1, borderColor: theme.border, gap: 6,
  },
  balanceIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  balanceValue: { fontSize: 18, fontWeight: '700', color: theme.text },
  balanceLabel: { fontSize: 10, color: theme.subtext, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginBottom: 12 },
  txRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: theme.card, borderRadius: 12, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: theme.border,
  },
  txIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  txTitle: { fontSize: 14, fontWeight: '500', color: theme.text },
  txDate: { fontSize: 12, color: theme.subtext, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700' },
  emptyTx: {
    alignItems: 'center', padding: 40,
    backgroundColor: theme.card, borderRadius: 14,
    borderWidth: 1, borderColor: theme.border, gap: 10,
  },
  emptyTxText: { color: theme.subtext, fontSize: 15 },
  // Modal — সবসময় dark থাকে (bottom sheet style)
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalBox: {
    backgroundColor: theme.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, borderTopWidth: 1, borderColor: theme.border,
  },
  modalHandle: {
    width: 40, height: 4, backgroundColor: theme.border,
    borderRadius: 2, alignSelf: 'center', marginBottom: 20,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '700', color: theme.text },
  inputLabel: { fontSize: 13, fontWeight: '600', color: theme.subtext, marginBottom: 8 },
  amountWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: theme.background, borderRadius: 12,
    borderWidth: 1, borderColor: theme.border,
    paddingHorizontal: 14, marginBottom: 12,
  },
  currencySign: { fontSize: 18, color: theme.subtext, marginRight: 4 },
  amountInput: { flex: 1, fontSize: 24, fontWeight: '700', paddingVertical: 14, color: theme.text },
  quickAmounts: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  quickBtn: {
    flex: 1, backgroundColor: theme.background, borderRadius: 8, padding: 10,
    alignItems: 'center', borderWidth: 1, borderColor: theme.border,
  },
  quickBtnActive: { backgroundColor: theme.primaryLight, borderColor: theme.primary },
  quickBtnText: { color: theme.subtext, fontWeight: '600', fontSize: 13 },
  quickBtnTextActive: { color: theme.primary },
  methodRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: theme.background, borderRadius: 12, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: theme.border,
  },
  methodRowActive: { borderColor: theme.primary, backgroundColor: theme.primaryLight },
  methodIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  methodLabel: { flex: 1, fontSize: 14, color: theme.text, fontWeight: '500' },
  methodCurrency: { fontSize: 12, color: theme.subtext, fontWeight: '600' },
  payBtn: {
    backgroundColor: theme.primary, borderRadius: 14, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  payBtnDisabled: { opacity: 0.5 },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default AdvertiserWalletScreen;


