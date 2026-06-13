import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, StatusBar } from 'react-native';
import { getMyEarnings, getWallet, requestWithdrawal } from '../../api/apiService';
import { useTheme } from '../../context/ThemeContext'; // ✅

export default function EarningsScreen() {
  const { theme, themeName } = useTheme(); // ✅
  const [earnings, setEarnings] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [earningsRes, walletRes] = await Promise.all([getMyEarnings(), getWallet()]);
      setEarnings(earningsRes.data);
      setWallet(walletRes.data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = () => {
    Alert.alert('Withdrawal', 'Withdrawal request পাঠাতে চান?', [
      { text: 'না', style: 'cancel' },
      {
        text: 'হ্যাঁ', onPress: async () => {
          try {
            await requestWithdrawal({ amount: wallet?.balance });
            Alert.alert('Success', 'Withdrawal request পাঠানো হয়েছে!');
          } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed');
          }
        }
      }
    ]);
  };

  const styles = makeStyles(theme); // ✅

  if (loading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
      <ActivityIndicator size="large" color={theme.primary} />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={themeName === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={theme.headerBg}
      />

      <Text style={styles.header}>আমার আয়</Text>

      <View style={styles.walletCard}>
        <Text style={styles.walletLabel}>মোট ব্যালেন্স</Text>
        <Text style={styles.walletAmount}>৳{wallet?.balance || 0}</Text>
        <View style={styles.walletRow}>
          <View>
            <Text style={styles.walletSub}>Pending: ৳{wallet?.pending || 0}</Text>
            <Text style={styles.walletSub}>Withdrawn: ৳{wallet?.withdrawn || 0}</Text>
          </View>
          <TouchableOpacity style={styles.withdrawBtn} onPress={handleWithdraw}>
            <Text style={styles.withdrawText}>Withdraw</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionTitle}>আয়ের বিবরণ</Text>
      <FlatList
        data={earnings}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingHorizontal: 16 }}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>এখনো কোনো আয় নেই</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.earningCard}>
            <View>
              <Text style={styles.earningTitle}>{item.campaignName}</Text>
              <Text style={styles.earningDate}>{new Date(item.createdAt).toLocaleDateString('bn-BD')}</Text>
            </View>
            <View style={styles.earningRight}>
              <Text style={styles.earningAmount}>৳{item.amount}</Text>
              <View style={[styles.statusBadge, {
                backgroundColor: item.status === 'paid' ? theme.primaryLight : '#fff3e0'
              }]}>
                <Text style={[styles.statusText, {
                  color: item.status === 'paid' ? theme.primary : '#e65100'
                }]}>
                  {item.status}
                </Text>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const makeStyles = (theme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  header: {
    fontSize: 22, fontWeight: 'bold', color: '#fff',
    backgroundColor: theme.headerBg === '#ffffff' || theme.headerBg === '#f5f3ff'
      ? theme.primary
      : theme.headerBg,
    padding: 24, paddingTop: 60,
  },
  walletCard: {
    backgroundColor: theme.primary,
    margin: 16, borderRadius: 20, padding: 24,
  },
  walletLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  walletAmount: { fontSize: 40, fontWeight: 'bold', color: '#fff', marginVertical: 8 },
  walletRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  walletSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)' },
  withdrawBtn: {
    backgroundColor: theme.card,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10,
  },
  withdrawText: { color: theme.primary, fontWeight: 'bold' },
  sectionTitle: {
    fontSize: 18, fontWeight: 'bold', color: theme.text,
    paddingHorizontal: 16, marginBottom: 12,
  },
  earningCard: {
    backgroundColor: theme.card, borderRadius: 12, padding: 16,
    marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', borderWidth: 1, borderColor: theme.border,
  },
  earningTitle: { fontSize: 15, color: theme.text, fontWeight: 'bold' },
  earningDate: { fontSize: 12, color: theme.subtext, marginTop: 4 },
  earningRight: { alignItems: 'flex-end' },
  earningAmount: { fontSize: 18, fontWeight: 'bold', color: theme.primary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 4 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  emptyCard: { alignItems: 'center', padding: 40 },
  emptyText: { fontSize: 16, color: theme.subtext },
});

