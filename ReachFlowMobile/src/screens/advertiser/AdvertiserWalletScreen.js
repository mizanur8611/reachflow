import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
  RefreshControl, StatusBar, Modal, TextInput, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StripeProvider, useStripe } from '@stripe/stripe-react-native';
import { getWallet, addMoney, createPaymentIntent, confirmStripePayment } from '../../api/apiService';
import { useTheme } from '../../context/ThemeContext';

const PUBLISHABLE_KEY = 'pk_test_placeholder'; // ✅ পরে real key দিয়ে replace করো

const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit / Debit Card', icon: 'card-outline', color: '#3b82f6', currency: 'USD' },
  { id: 'paypal', label: 'PayPal', icon: 'globe-outline', color: '#0070ba', currency: 'USD' },
  { id: 'bkash', label: 'bKash', icon: 'phone-portrait-outline', color: '#e2136e', currency: 'BDT' },
  { id: 'nagad', label: 'Nagad', icon: 'phone-portrait-outline', color: '#f26522', currency: 'BDT' },
  { id: 'usdt', label: 'USDT (TRC20)', icon: 'logo-bitcoin', color: '#26a17b', currency: 'USD' },
];

const PAYMENT_INFO = {
  paypal: {
    title: 'PayPal', icon: 'globe-outline', color: '#0070ba',
    instructions: 'নিচের PayPal email এ payment পাঠান:',
    fields: [
      { label: 'PayPal Email', value: 'pay@reachflow.com' },
      { label: 'Reference Format', value: 'RF-[আপনার নাম]-[amount]' },
    ],
    note: 'Payment note এ reference লিখুন। Transaction ID নিচে দিন।',
  },
  bkash: {
    title: 'bKash', icon: 'phone-portrait-outline', color: '#e2136e',
    instructions: '"Send Money" দিয়ে নিচের নম্বরে পাঠান:',
    fields: [
      { label: 'bKash Number', value: '01XXXXXXXXX' },
      { label: 'Account Type', value: 'Personal' },
      { label: 'Reference Format', value: 'RF-[আপনার নাম]' },
    ],
    note: 'bKash Transaction ID টি নিচে দিন। Admin 24 ঘণ্টার মধ্যে confirm করবে।',
  },
  nagad: {
    title: 'Nagad', icon: 'phone-portrait-outline', color: '#f26522',
    instructions: '"Send Money" দিয়ে নিচের নম্বরে পাঠান:',
    fields: [
      { label: 'Nagad Number', value: '01XXXXXXXXX' },
      { label: 'Account Type', value: 'Personal' },
      { label: 'Reference Format', value: 'RF-[আপনার নাম]' },
    ],
    note: 'Nagad Transaction ID টি নিচে দিন। Admin 24 ঘণ্টার মধ্যে confirm করবে।',
  },
  usdt: {
    title: 'USDT (TRC20)', icon: 'logo-bitcoin', color: '#26a17b',
    instructions: 'নিচের TRC20 wallet address এ USDT পাঠান:',
    fields: [
      { label: 'USDT Address (TRC20)', value: 'TXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX' },
      { label: 'Network', value: 'TRON (TRC20) only' },
    ],
    note: '⚠️ শুধু TRC20 network ব্যবহার করুন। Transaction Hash নিচে দিন।',
  },
};

const TX_ICON = {
  DEPOSIT: { name: 'arrow-down-circle', color: '#22c55e' },
  WITHDRAWAL: { name: 'arrow-up-circle', color: '#ef4444' },
  PAYMENT: { name: 'cash', color: '#f59e0b' },
  COMMISSION_EARNED: { name: 'cash', color: '#f59e0b' },
};

// ✅ Card Payment Component — Stripe hooks এখানে
function CardPaymentModal({ visible, amount, onClose, onSuccess, theme }) {
  const { confirmPayment } = useStripe();
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const styles = makeStyles(theme);

  const formatCardNumber = (text) => {
    const cleaned = text.replace(/\s/g, '').replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  const formatExpiry = (text) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.substring(0, 2) + '/' + cleaned.substring(2, 4);
    }
    return cleaned;
  };

  const handleCardPayment = async () => {
    if (!cardNumber || !expiry || !cvc || !name) {
      Alert.alert('Error', 'সব তথ্য পূরণ করুন');
      return;
    }
    setLoading(true);
    try {
      // Step 1: Payment Intent তৈরি করো
      const intentRes = await createPaymentIntent({ amount: parseFloat(amount) });
      const { clientSecret } = intentRes.data;

      // Step 2: Stripe দিয়ে card confirm করো
      const expiryParts = expiry.split('/');
      const { paymentIntent, error } = await confirmPayment(clientSecret, {
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: { name },
        },
      });

      if (error) {
        Alert.alert('Payment Failed', error.message);
        return;
      }

      if (paymentIntent.status === 'Succeeded') {
        // Step 3: Backend এ confirm করো
        await confirmStripePayment({
          paymentIntentId: paymentIntent.id,
          amount: parseFloat(amount),
        });
        onSuccess();
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="arrow-back" size={22} color={theme.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Card Payment</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={theme.subtext} />
            </TouchableOpacity>
          </View>

          {/* Amount summary */}
          <View style={styles.summaryBox}>
            <View style={[styles.methodIcon, { backgroundColor: '#3b82f622', width: 48, height: 48, borderRadius: 24 }]}>
              <Ionicons name="card-outline" size={24} color="#3b82f6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryMethod}>Credit / Debit Card</Text>
              <Text style={styles.summaryAmount}>${parseFloat(amount || 0).toFixed(2)} charge হবে</Text>
            </View>
          </View>

          {/* Card holder name */}
          <Text style={styles.inputLabel}>Card Holder Name</Text>
          <TextInput
            style={styles.referenceInput}
            value={name}
            onChangeText={setName}
            placeholder="John Doe"
            placeholderTextColor={theme.subtext}
          />

          {/* Card Number */}
          <Text style={styles.inputLabel}>Card Number</Text>
          <TextInput
            style={styles.referenceInput}
            value={cardNumber}
            onChangeText={(t) => setCardNumber(formatCardNumber(t))}
            placeholder="1234 5678 9012 3456"
            placeholderTextColor={theme.subtext}
            keyboardType="numeric"
            maxLength={19}
          />

          {/* Expiry + CVC */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>Expiry Date</Text>
              <TextInput
                style={styles.referenceInput}
                value={expiry}
                onChangeText={(t) => setExpiry(formatExpiry(t))}
                placeholder="MM/YY"
                placeholderTextColor={theme.subtext}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>CVC</Text>
              <TextInput
                style={styles.referenceInput}
                value={cvc}
                onChangeText={setCvc}
                placeholder="123"
                placeholderTextColor={theme.subtext}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.noteBox}>
            <Ionicons name="lock-closed-outline" size={16} color="#22c55e" />
            <Text style={[styles.noteText, { color: '#22c55e' }]}>
              আপনার card তথ্য Stripe দ্বারা সুরক্ষিত। আমরা কোনো card data store করি না।
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.payBtn, loading && { opacity: 0.7 }]}
            onPress={handleCardPayment}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.payBtnText}>💳 Pay ${parseFloat(amount || 0).toFixed(2)}</Text>
            }
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ✅ Main Screen
function AdvertiserWalletContent({ navigation }) {
  const { theme, themeName } = useTheme();
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [step1Visible, setStep1Visible] = useState(false);
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('bkash');
  const [step2Visible, setStep2Visible] = useState(false);
  const [cardModalVisible, setCardModalVisible] = useState(false);
  const [reference, setReference] = useState('');
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

  const handleProceed = () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Valid amount দিন');
      return;
    }
    setStep1Visible(false);
    // ✅ Card হলে Stripe modal, অন্যথায় payment info modal
    setTimeout(() => {
      if (selectedMethod === 'card') {
        setCardModalVisible(true);
      } else {
        setStep2Visible(true);
      }
    }, 300);
  };

  const handleSubmit = async () => {
    if (!reference.trim()) {
      Alert.alert('Error', 'Transaction ID / Reference দিন');
      return;
    }
    setSubmitting(true);
    try {
      await addMoney({
        amount: parseFloat(amount),
        method: selectedMethod,
        reference: reference.trim(),
      });
      setStep2Visible(false);
      setAmount('');
      setReference('');
      Alert.alert(
        '✅ Request Submitted!',
        'Admin 24 ঘণ্টার মধ্যে verify করবে।',
        [{ text: 'OK', onPress: fetchWallet }]
      );
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCardSuccess = () => {
    setCardModalVisible(false);
    setAmount('');
    Alert.alert('✅ Payment Successful!', 'Balance আপনার wallet এ add হয়েছে!',
      [{ text: 'OK', onPress: fetchWallet }]
    );
  };

  const paymentInfo = PAYMENT_INFO[selectedMethod];
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  const styles = makeStyles(theme);

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
        <View>
          <Text style={styles.headerTitle}>Wallet</Text>
          <Text style={styles.headerSub}>Manage your balance and transactions</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setStep1Visible(true)}>
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh}
              tintColor={theme.primary} colors={[theme.primary]} />
          }
          contentContainerStyle={styles.content}
        >
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
              <Text style={styles.balanceValue}>${wallet?.totalEarned?.toFixed(2) || '0.00'}</Text>
              <Text style={styles.balanceLabel}>Total Earned</Text>
            </View>
          </View>

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
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.txAmount, {
                      color: ['DEPOSIT', 'COMMISSION_EARNED'].includes(tx.type) ? '#22c55e' : '#ef4444'
                    }]}>
                      {['DEPOSIT', 'COMMISSION_EARNED'].includes(tx.type) ? '+' : '-'}
                      ${Math.abs(tx.amount).toFixed(2)}
                    </Text>
                    {tx.status === 'PENDING' && (
                      <Text style={styles.pendingBadge}>⏳ Pending</Text>
                    )}
                  </View>
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

      {/* Step 1: Amount + Method */}
      <Modal visible={step1Visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Money</Text>
              <TouchableOpacity onPress={() => setStep1Visible(false)}>
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
                keyboardType="numeric"
              />
            </View>

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

            <Text style={styles.inputLabel}>Payment Method</Text>
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
                {selectedMethod === m.id && (
                  <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
                )}
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={[styles.payBtn, (!amount || parseFloat(amount) <= 0) && styles.payBtnDisabled]}
              onPress={handleProceed}
              disabled={!amount || parseFloat(amount) <= 0}
            >
              <Text style={styles.payBtnText}>
                {selectedMethod === 'card' ? '💳 Card তথ্য দিন →' : 'পরবর্তী → Payment Info দেখুন'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Step 2: Payment Info (non-card) */}
      <Modal visible={step2Visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView>
            <View style={[styles.modalBox, { marginTop: 60 }]}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => {
                  setStep2Visible(false);
                  setTimeout(() => setStep1Visible(true), 300);
                }}>
                  <Ionicons name="arrow-back" size={22} color={theme.text} />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Payment Details</Text>
                <TouchableOpacity onPress={() => setStep2Visible(false)}>
                  <Ionicons name="close" size={22} color={theme.subtext} />
                </TouchableOpacity>
              </View>

              <View style={styles.summaryBox}>
                <View style={[styles.methodIcon, { backgroundColor: paymentInfo?.color + '22', width: 48, height: 48, borderRadius: 24 }]}>
                  <Ionicons name={paymentInfo?.icon} size={24} color={paymentInfo?.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.summaryMethod}>{paymentInfo?.title}</Text>
                  <Text style={styles.summaryAmount}>${parseFloat(amount || 0).toFixed(2)} পাঠাতে হবে</Text>
                </View>
              </View>

              <Text style={styles.instructionText}>{paymentInfo?.instructions}</Text>

              {paymentInfo?.fields.map((field, i) => (
                <View key={i} style={styles.infoField}>
                  <Text style={styles.infoLabel}>{field.label}</Text>
                  <View style={styles.infoValueRow}>
                    <Text style={styles.infoValue} selectable>{field.value}</Text>
                    <TouchableOpacity onPress={() => Alert.alert('Copied!', `${field.label} copied`)}>
                      <Ionicons name="copy-outline" size={16} color={theme.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              <View style={styles.noteBox}>
                <Ionicons name="information-circle-outline" size={16} color="#f59e0b" />
                <Text style={styles.noteText}>{paymentInfo?.note}</Text>
              </View>

              <Text style={[styles.inputLabel, { marginTop: 16 }]}>Transaction ID / Reference *</Text>
              <TextInput
                style={styles.referenceInput}
                value={reference}
                onChangeText={setReference}
                placeholder="যেমন: TXN123456789"
                placeholderTextColor={theme.subtext}
              />

              <TouchableOpacity
                style={[styles.payBtn, submitting && { opacity: 0.7 }]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.payBtnText}>✅ Submit Payment Request</Text>
                }
              </TouchableOpacity>

              <Text style={styles.confirmNote}>
                Admin 24 ঘণ্টার মধ্যে আপনার payment verify করবে এবং balance add করবে।
              </Text>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Card Payment Modal */}
      <CardPaymentModal
        visible={cardModalVisible}
        amount={amount}
        onClose={() => {
          setCardModalVisible(false);
          setTimeout(() => setStep1Visible(true), 300);
        }}
        onSuccess={handleCardSuccess}
        theme={theme}
      />
    </View>
  );
}

// ✅ StripeProvider wrap করো
export default function AdvertiserWalletScreen({ navigation }) {
  return (
    <StripeProvider publishableKey={PUBLISHABLE_KEY}>
      <AdvertiserWalletContent navigation={navigation} />
    </StripeProvider>
  );
}

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
  pendingBadge: { fontSize: 11, color: '#f59e0b', marginTop: 2 },
  emptyTx: {
    alignItems: 'center', padding: 40,
    backgroundColor: theme.card, borderRadius: 14,
    borderWidth: 1, borderColor: theme.border, gap: 10,
  },
  emptyTxText: { color: theme.subtext, fontSize: 15 },
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
  methodCurrency: { fontSize: 12, color: theme.subtext, fontWeight: '600', marginRight: 4 },
  payBtn: {
    backgroundColor: theme.primary, borderRadius: 14, padding: 16,
    alignItems: 'center', marginTop: 8,
  },
  payBtnDisabled: { opacity: 0.5 },
  payBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  summaryBox: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: theme.background, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: theme.border, marginBottom: 16,
  },
  summaryMethod: { fontSize: 15, fontWeight: '700', color: theme.text },
  summaryAmount: { fontSize: 13, color: theme.subtext, marginTop: 2 },
  instructionText: { fontSize: 14, color: theme.subtext, marginBottom: 12 },
  infoField: {
    backgroundColor: theme.background, borderRadius: 10, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: theme.border,
  },
  infoLabel: { fontSize: 11, color: theme.subtext, fontWeight: '600', marginBottom: 4 },
  infoValueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoValue: { fontSize: 15, fontWeight: '700', color: theme.text, flex: 1 },
  noteBox: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: '#f59e0b11', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#f59e0b33', marginBottom: 8,
  },
  noteText: { fontSize: 13, color: '#f59e0b', flex: 1, lineHeight: 18 },
  referenceInput: {
    backgroundColor: theme.background, color: theme.text,
    borderRadius: 12, padding: 14, fontSize: 15,
    borderWidth: 1, borderColor: theme.border, marginBottom: 12,
  },
  confirmNote: {
    fontSize: 12, color: theme.subtext, textAlign: 'center',
    marginTop: 12, lineHeight: 18,
  },
});


