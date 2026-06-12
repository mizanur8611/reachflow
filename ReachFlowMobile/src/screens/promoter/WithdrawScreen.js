import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, StatusBar,
  ScrollView, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getWallet, requestWithdrawal } from '../../api/apiService';

const METHODS = [
  { id: 'bkash', label: 'bKash', icon: 'phone-portrait-outline', color: '#e2136e' },
  { id: 'nagad', label: 'Nagad', icon: 'phone-portrait-outline', color: '#f26522' },
  { id: 'bank', label: 'Bank Transfer', icon: 'business-outline', color: '#3b82f6' },
];

const WithdrawScreen = ({ navigation }) => {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bkash');
  const [accountNumber, setAccountNumber] = useState('');
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

  const balance = wallet?.balance || 0;
  const minWithdraw = 100;
  const parsedAmount = parseFloat(amount) || 0;
  const canSubmit = parsedAmount >= minWithdraw && parsedAmount <= balance && accountNumber.trim();

  const handleWithdraw = async () => {
    if (!canSubmit) return;
    Alert.alert(
      'নিশ্চিত করুন',
      `৳${amount} ${METHODS.find(m => m.id === method)?.label} এ পাঠানো হবে।`,
      [
        { text: 'বাতিল', style: 'cancel' },
        {
          text: 'হ্যাঁ, পাঠাও',
          onPress: async () => {
            setSubmitting(true);
            try {
              await requestWithdrawal({
                amount: parsedAmount,
                method,
                accountNumber: accountNumber.trim(),
              });
              Alert.alert('আবেদন জমা হয়েছে!', 'Withdrawal request প্রক্রিয়া করা হচ্ছে।', [
                { text: 'OK', onPress: () => { setAmount(''); setAccountNumber(''); fetchWallet(); } }
              ]);
            } catch (error) {
              const msg = error.response?.data?.message || 'Withdrawal ব্যর্থ হয়েছে';
              Alert.alert('Error', msg);
            } finally {
              setSubmitting(false);
            }
          }
        }
      ]
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
        <Text style={styles.headerTitle}>Withdraw</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b5cf6" colors={['#8b5cf6']} />
          }
        >
          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>উপলব্ধ ব্যালেন্স</Text>
            <Text style={styles.balanceValue}>৳{balance.toLocaleString()}</Text>
            <Text style={styles.balanceHint}>সর্বনিম্ন উত্তোলন ৳{minWithdraw}</Text>
          </View>

          {/* History summary */}
          {wallet?.totalWithdrawn !== undefined && (
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>৳{wallet.totalWithdrawn?.toLocaleString() || 0}</Text>
                <Text style={styles.summaryLabel}>মোট উত্তোলন</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{wallet.pendingWithdrawals || 0}</Text>
                <Text style={styles.summaryLabel}>Pending</Text>
              </View>
            </View>
          )}

          {/* Amount */}
          <Text style={styles.sectionLabel}>পরিমাণ</Text>
          <View style={styles.amountWrapper}>
            <Text style={styles.currencySymbol}>৳</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0"
              placeholderTextColor="#3f3f46"
              color="#f4f4f5"
              keyboardType="numeric"
              maxLength={8}
            />
          </View>

          {/* Quick amount buttons */}
          <View style={styles.quickAmounts}>
            {[500, 1000, 2000, 5000].map((val) => (
              <TouchableOpacity
                key={val}
                style={[styles.quickBtn, parsedAmount === val && styles.quickBtnActive]}
                onPress={() => setAmount(String(val))}
                disabled={val > balance}
              >
                <Text style={[styles.quickBtnText, parsedAmount === val && styles.quickBtnTextActive, val > balance && { color: '#3f3f46' }]}>
                  ৳{val}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Validation hint */}
          {amount.length > 0 && (
            <Text style={[styles.validHint, { color: canSubmit || !accountNumber ? '#52525b' : parsedAmount < minWithdraw ? '#ef4444' : parsedAmount > balance ? '#ef4444' : '#22c55e' }]}>
              {parsedAmount < minWithdraw
                ? `সর্বনিম্ন ৳${minWithdraw} উত্তোলন করতে হবে`
                : parsedAmount > balance
                ? 'ব্যালেন্স অপর্যাপ্ত'
                : '✓ পরিমাণ সঠিক'}
            </Text>
          )}

          {/* Method */}
          <Text style={styles.sectionLabel}>উত্তোলনের মাধ্যম</Text>
          <View style={styles.methodRow}>
            {METHODS.map((m) => (
              <TouchableOpacity
                key={m.id}
                style={[styles.methodCard, method === m.id && styles.methodCardActive]}
                onPress={() => setMethod(m.id)}
              >
                <Ionicons name={m.icon} size={20} color={method === m.id ? m.color : '#71717a'} />
                <Text style={[styles.methodLabel, method === m.id && { color: '#f4f4f5' }]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Account number */}
          <Text style={styles.sectionLabel}>
            {method === 'bank' ? 'Account Number' : `${METHODS.find(m => m.id === method)?.label} নম্বর`}
          </Text>
          <TextInput
            style={styles.input}
            value={accountNumber}
            onChangeText={setAccountNumber}
            placeholder={method === 'bank' ? 'Bank account number' : '01XXXXXXXXX'}
            placeholderTextColor="#52525b"
            color="#f4f4f5"
            keyboardType="phone-pad"
          />

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            onPress={handleWithdraw}
            disabled={!canSubmit || submitting}
          >
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Ionicons name="arrow-up-circle-outline" size={20} color="#fff" />
                  <Text style={styles.submitText}>৳{amount || '0'} উত্তোলন করুন</Text>
                </>
            }
          </TouchableOpacity>

          {/* Info */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color="#52525b" />
            <Text style={styles.infoText}>
              Withdrawal request সাধারণত ১-৩ কার্যদিবসের মধ্যে প্রক্রিয়া করা হয়।
            </Text>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  balanceCard: {
    backgroundColor: '#1a1425', borderRadius: 16, padding: 24,
    alignItems: 'center', borderWidth: 1, borderColor: '#8b5cf633', marginBottom: 16,
  },
  balanceLabel: { fontSize: 14, color: '#a1a1aa', marginBottom: 8 },
  balanceValue: { fontSize: 36, fontWeight: '800', color: '#f4f4f5', marginBottom: 4 },
  balanceHint: { fontSize: 12, color: '#52525b' },
  summaryRow: {
    flexDirection: 'row', backgroundColor: '#141417', borderRadius: 12,
    borderWidth: 1, borderColor: '#1f1f23', marginBottom: 24,
  },
  summaryCard: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  summaryDivider: { width: 1, backgroundColor: '#1f1f23', marginVertical: 10 },
  summaryValue: { fontSize: 18, fontWeight: '700', color: '#f4f4f5' },
  summaryLabel: { fontSize: 12, color: '#71717a', marginTop: 4 },
  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#52525b', marginBottom: 10 },
  amountWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#141417', borderRadius: 14, borderWidth: 1, borderColor: '#2d2d35',
    paddingHorizontal: 16, marginBottom: 12,
  },
  currencySymbol: { fontSize: 22, color: '#71717a', marginRight: 4 },
  amountInput: { flex: 1, fontSize: 28, fontWeight: '700', paddingVertical: 16 },
  quickAmounts: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  quickBtn: {
    flex: 1, backgroundColor: '#141417', borderRadius: 10, padding: 10,
    alignItems: 'center', borderWidth: 1, borderColor: '#2d2d35',
  },
  quickBtnActive: { backgroundColor: '#1a1425', borderColor: '#8b5cf6' },
  quickBtnText: { color: '#71717a', fontSize: 13, fontWeight: '600' },
  quickBtnTextActive: { color: '#8b5cf6' },
  validHint: { fontSize: 12, marginBottom: 16 },
  methodRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  methodCard: {
    flex: 1, backgroundColor: '#141417', borderRadius: 12, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: '#2d2d35', gap: 6,
  },
  methodCardActive: { borderColor: '#8b5cf6', backgroundColor: '#1a1425' },
  methodLabel: { fontSize: 11, color: '#71717a', fontWeight: '600', textAlign: 'center' },
  input: {
    backgroundColor: '#141417', borderRadius: 12, padding: 14,
    fontSize: 14, borderWidth: 1, borderColor: '#2d2d35',
    color: '#f4f4f5', marginBottom: 20,
  },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#8b5cf6', borderRadius: 14, padding: 16, gap: 8,
  },
  submitBtnDisabled: { backgroundColor: '#4c1d95' },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: '#141417', borderRadius: 10, padding: 12, marginTop: 16,
  },
  infoText: { flex: 1, fontSize: 12, color: '#52525b', lineHeight: 18 },
});

export default WithdrawScreen;


