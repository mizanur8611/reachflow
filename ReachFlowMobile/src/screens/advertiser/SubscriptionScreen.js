import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator,
  RefreshControl, StatusBar, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSubscription, subscribePlan } from '../../api/apiService';
import { useTheme } from '../../context/ThemeContext'; // ✅

const PLANS = {
  advertiser: [
    {
      id: 'basic_advertiser', name: 'Basic', price: 0, period: 'Free',
      icon: 'star-outline', gradient: '#2d2d35',
      features: [
        { text: '3 Campaigns', available: true },
        { text: '10 Promoters/Campaign', available: true },
        { text: 'Analytics Export', available: false },
        { text: 'Priority Support', available: false },
        { text: '15% Platform Fee', available: true },
      ],
      btnLabel: 'Get Started Free', btnColor: '#2d2d35', textColor: '#f4f4f5',
    },
    {
      id: 'pro_advertiser', name: 'Pro', price: 20, period: '/month',
      icon: 'flash-outline', gradient: '#8b5cf6', popular: true,
      features: [
        { text: '20 Campaigns', available: true },
        { text: '50 Promoters/Campaign', available: true },
        { text: 'Analytics Export', available: true },
        { text: 'Priority Support', available: false },
        { text: '10% Platform Fee', available: true },
      ],
      btnLabel: 'Subscribe — $20/mo', btnColor: '#8b5cf6', textColor: '#fff',
    },
    {
      id: 'enterprise_advertiser', name: 'Enterprise', price: 70, period: '/month',
      icon: 'trophy-outline', gradient: '#f59e0b',
      features: [
        { text: 'Unlimited Campaigns', available: true },
        { text: 'Unlimited Promoters/Campaign', available: true },
        { text: 'Analytics Export', available: true },
        { text: 'Priority Support', available: true },
        { text: '5% Platform Fee', available: true },
      ],
      btnLabel: 'Subscribe — $70/mo', btnColor: '#f59e0b', textColor: '#000',
    },
  ],
  promoter: [
    {
      id: 'basic_promoter', name: 'Basic', price: 0, period: 'Free',
      icon: 'star-outline', gradient: '#2d2d35',
      features: [
        { text: 'Apply to 5 Campaigns', available: true },
        { text: 'Basic Analytics', available: true },
        { text: 'Priority Applications', available: false },
        { text: 'Dedicated Support', available: false },
      ],
      btnLabel: 'Get Started Free', btnColor: '#2d2d35', textColor: '#f4f4f5',
    },
    {
      id: 'pro_promoter', name: 'Pro', price: 10, period: '/month',
      icon: 'flash-outline', gradient: '#8b5cf6', popular: true,
      features: [
        { text: 'Apply to 20 Campaigns', available: true },
        { text: 'Advanced Analytics', available: true },
        { text: 'Priority Applications', available: true },
        { text: 'Dedicated Support', available: false },
      ],
      btnLabel: 'Subscribe — $10/mo', btnColor: '#8b5cf6', textColor: '#fff',
    },
  ],
};

const SubscriptionScreen = ({ navigation }) => {
  const { theme, themeName } = useTheme(); // ✅
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState('advertiser');
  const [subscribing, setSubscribing] = useState(null);

  const fetchSubscription = async () => {
    try {
      const res = await getSubscription();
      setCurrentPlan(res.data);
    } catch (error) {
      console.error('Subscription fetch failed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchSubscription(); }, []);
  const onRefresh = () => { setRefreshing(true); fetchSubscription(); };

  const handleSubscribe = async (plan) => {
    if (plan.price === 0) return;
    Alert.alert(
      'Subscribe করুন',
      `${plan.name} plan এ $${plan.price}/month subscribe করবেন?`,
      [
        { text: 'বাতিল', style: 'cancel' },
        {
          text: 'Subscribe', onPress: async () => {
            setSubscribing(plan.id);
            try {
              await subscribePlan({ planId: plan.id });
              fetchSubscription();
            } catch (error) {
              Alert.alert('Error', error.response?.data?.message || 'Subscribe ব্যর্থ হয়েছে');
            } finally {
              setSubscribing(null);
            }
          }
        }
      ]
    );
  };

  const plans = PLANS[tab];
  const styles = makeStyles(theme); // ✅

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
          <Text style={styles.headerTitle}>Subscription Plans</Text>
          <Text style={styles.headerSub}>Choose the plan that fits your needs</Text>
        </View>
        <View style={{ width: 38 }} />
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
          {/* Current Plan */}
          {currentPlan && (
            <View style={styles.currentPlanBox}>
              <Ionicons name="trophy-outline" size={18} color={theme.primary} />
              <View>
                <Text style={styles.currentPlanLabel}>Current Plan</Text>
                <Text style={styles.currentPlanName}>
                  {currentPlan.planName || 'Basic'} — {currentPlan.role || 'ADVERTISER'}
                </Text>
              </View>
            </View>
          )}

          {/* Tab */}
          <View style={styles.tabRow}>
            {['advertiser', 'promoter'].map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
                onPress={() => setTab(t)}
              >
                <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>
                  {t === 'advertiser' ? 'Advertiser' : 'Promoter'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Plans */}
          {plans.map((plan) => {
            const isCurrent = currentPlan?.planId === plan.id;
            const isLoading = subscribing === plan.id;
            return (
              <View key={plan.id} style={[styles.planCard, isCurrent && styles.planCardCurrent]}>
                {plan.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>Popular</Text>
                  </View>
                )}
                <View style={styles.planHeader}>
                  <View style={[styles.planIcon, { backgroundColor: plan.gradient + '33' }]}>
                    <Ionicons name={plan.icon} size={22} color={plan.gradient} />
                  </View>
                  <View>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <View style={styles.planPriceRow}>
                      <Text style={styles.planPrice}>${plan.price}</Text>
                      <Text style={styles.planPeriod}>{plan.period}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.featureList}>
                  {plan.features.map((f, i) => (
                    <View key={i} style={styles.featureRow}>
                      <Ionicons
                        name={f.available ? 'checkmark-circle' : 'close-circle'}
                        size={16}
                        color={f.available ? '#22c55e' : theme.border}
                      />
                      <Text style={[styles.featureText, !f.available && styles.featureTextDisabled]}>
                        {f.text}
                      </Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.planBtn,
                    { backgroundColor: isCurrent ? '#14532d' : plan.btnColor },
                    // ✅ Basic plan এ theme.card ব্যবহার করি
                    plan.price === 0 && !isCurrent && { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border },
                  ]}
                  onPress={() => !isCurrent && handleSubscribe(plan)}
                  disabled={isCurrent || isLoading}
                >
                  {isLoading
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={[
                        styles.planBtnText,
                        { color: isCurrent ? '#22c55e' : plan.price === 0 ? theme.text : plan.textColor }
                      ]}>
                        {isCurrent ? '✓ Current Plan' : plan.btnLabel}
                      </Text>
                  }
                </TouchableOpacity>
              </View>
            );
          })}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
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
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16 },
  currentPlanBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: theme.primaryLight, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: theme.primary + '33', marginBottom: 16,
  },
  currentPlanLabel: { fontSize: 11, color: theme.subtext },
  currentPlanName: { fontSize: 15, fontWeight: '700', color: theme.text },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  tabBtn: {
    flex: 1, backgroundColor: theme.card, borderRadius: 10, padding: 12,
    alignItems: 'center', borderWidth: 1, borderColor: theme.border,
  },
  tabBtnActive: { backgroundColor: theme.primaryLight, borderColor: theme.primary },
  tabBtnText: { color: theme.subtext, fontWeight: '600' },
  tabBtnTextActive: { color: theme.primary },
  planCard: {
    backgroundColor: theme.card, borderRadius: 16, padding: 20,
    marginBottom: 14, borderWidth: 1, borderColor: theme.border, position: 'relative',
  },
  planCardCurrent: { borderColor: '#22c55e33', backgroundColor: theme.background },
  popularBadge: {
    position: 'absolute', top: 14, right: 14,
    backgroundColor: theme.primary, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  popularText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  planIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  planName: { fontSize: 20, fontWeight: '700', color: theme.text },
  planPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  planPrice: { fontSize: 28, fontWeight: '800', color: theme.text },
  planPeriod: { fontSize: 14, color: theme.subtext },
  featureList: { gap: 10, marginBottom: 20 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 14, color: theme.subtext },
  featureTextDisabled: { opacity: 0.4 },
  planBtn: { borderRadius: 12, padding: 16, alignItems: 'center' },
  planBtnText: { fontWeight: '700', fontSize: 15 },
});

export default SubscriptionScreen;


