import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Clipboard,
  StatusBar,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTrackingLink } from '../../api/apiService';

const TrackingLinkScreen = ({ route, navigation }) => {
  const { applicationId, campaignId, campaignTitle } = route.params || {};
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchTrackingLink();
  }, []);

  const fetchTrackingLink = async () => {
    try {
      const res = await getTrackingLink(campaignId || applicationId);
      const link = res.data.link;
      setTrackingData({
        trackingUrl: `https://reachflow-j34o.onrender.com/c/${link?.shortCode}`,
        clicks: link?.clicks || 0,
      });
    } catch (error) {
      console.error('Failed to fetch tracking link:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    Clipboard.setString(trackingData?.trackingUrl || trackingData?.link || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `আমার রেফারেল লিংক দিয়ে দেখো: ${trackingData?.trackingUrl || trackingData?.link}`,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  const trackingUrl = trackingData?.trackingUrl || trackingData?.link || '';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tracking Link</Text>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8b5cf6" />
          <Text style={styles.loadingText}>লিংক লোড হচ্ছে...</Text>
        </View>
      ) : !trackingData ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text style={styles.errorTitle}>লিংক পাওয়া যায়নি</Text>
          <Text style={styles.errorSubtitle}>একটু পরে আবার চেষ্টা করো</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchTrackingLink}>
            <Text style={styles.retryText}>আবার চেষ্টা করো</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Campaign badge */}
          {campaignTitle && (
            <View style={styles.campaignBadge}>
              <Ionicons name="megaphone-outline" size={14} color="#8b5cf6" />
              <Text style={styles.campaignBadgeText} numberOfLines={1}>
                {campaignTitle}
              </Text>
            </View>
          )}

          {/* Success icon */}
          <View style={styles.successIcon}>
            <Ionicons name="link" size={32} color="#8b5cf6" />
          </View>
          <Text style={styles.mainTitle}>তোমার Tracking Link</Text>
          <Text style={styles.mainSubtitle}>
            এই লিংকটি শেয়ার করো। প্রতিটি ক্লিক ও সাইনআপ ট্র্যাক হবে।
          </Text>

          {/* Link box */}
          <View style={styles.linkBox}>
            <Text style={styles.linkText} numberOfLines={2} selectable>
              {trackingUrl}
            </Text>
          </View>

          {/* Action buttons */}
          <TouchableOpacity
            style={[styles.copyBtn, copied && styles.copiedBtn]}
            onPress={handleCopy}
            activeOpacity={0.8}
          >
            <Ionicons
              name={copied ? 'checkmark-circle' : 'copy-outline'}
              size={20}
              color="#fff"
            />
            <Text style={styles.copyBtnText}>
              {copied ? 'কপি হয়েছে!' : 'লিংক কপি করো'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.shareBtn} onPress={handleShare} activeOpacity={0.8}>
            <Ionicons name="share-social-outline" size={20} color="#8b5cf6" />
            <Text style={styles.shareBtnText}>শেয়ার করো</Text>
          </TouchableOpacity>

          {/* Stats */}
          {(trackingData.clicks !== undefined || trackingData.conversions !== undefined) && (
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{trackingData.clicks ?? 0}</Text>
                <Text style={styles.statLabel}>মোট ক্লিক</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{trackingData.conversions ?? 0}</Text>
                <Text style={styles.statLabel}>Conversions</Text>
              </View>
            </View>
          )}

          {/* Info */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={16} color="#52525b" />
            <Text style={styles.infoText}>
              লিংকটি শুধুমাত্র তোমার জন্য unique। অন্যকে দিলে তাদের activity তোমার account এ track হবে।
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1f1f23',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#1f1f23',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#71717a',
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 10,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f4f4f5',
    marginTop: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#71717a',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#8b5cf6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  campaignBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1025',
    borderWidth: 1,
    borderColor: '#8b5cf633',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 6,
    marginBottom: 24,
  },
  campaignBadgeText: {
    color: '#8b5cf6',
    fontSize: 13,
    fontWeight: '500',
    maxWidth: 220,
  },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#1a1025',
    borderWidth: 1,
    borderColor: '#8b5cf633',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f4f4f5',
    marginBottom: 8,
    textAlign: 'center',
  },
  mainSubtitle: {
    fontSize: 14,
    color: '#71717a',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
    paddingHorizontal: 8,
  },
  linkBox: {
    width: '100%',
    backgroundColor: '#141417',
    borderWidth: 1,
    borderColor: '#2d2d35',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
  },
  linkText: {
    color: '#a78bfa',
    fontSize: 13,
    lineHeight: 20,
    fontFamily: 'monospace',
  },
  copyBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8b5cf6',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 10,
  },
  copiedBtn: {
    backgroundColor: '#22c55e',
  },
  copyBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  shareBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1a1025',
    borderWidth: 1,
    borderColor: '#8b5cf633',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    marginBottom: 28,
  },
  shareBtnText: {
    color: '#8b5cf6',
    fontWeight: '600',
    fontSize: 15,
  },
  statsRow: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: '#141417',
    borderWidth: 1,
    borderColor: '#1f1f23',
    borderRadius: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#1f1f23',
    marginVertical: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#f4f4f5',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#71717a',
  },
  infoBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#141417',
    borderRadius: 10,
    padding: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#52525b',
    lineHeight: 18,
  },
});

export default TrackingLinkScreen;
