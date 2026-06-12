import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert
} from 'react-native';
import { createCampaign } from '../../api/apiService';
import { useTheme } from '../../context/ThemeContext'; // ✅ path ঠিক করো

export default function CreateCampaignScreen({ navigation }) {
  const { theme } = useTheme(); // ✅ theme hook
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [commissionRate, setCommissionRate] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState(['FACEBOOK']);
  const [commissionType, setCommissionType] = useState('PER_POST');
  const [loading, setLoading] = useState(false);

  const platforms = ['FACEBOOK', 'INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'TELEGRAM'];
  const commissionTypes = ['PER_POST', 'PER_CLICK', 'PER_SALE'];

  const togglePlatform = (p) => {
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const handleCreate = async () => {
    if (!title || !description || !budget || !commissionRate) {
      Alert.alert('Error', 'সব তথ্য পূরণ করুন');
      return;
    }
    if (selectedPlatforms.length === 0) {
      Alert.alert('Error', 'অন্তত একটি platform select করুন');
      return;
    }
    try {
      setLoading(true);
      await createCampaign({
        title,
        description,
        budget: Number(budget),
        commissionAmount: Number(commissionRate),
        commissionType,
        platforms: selectedPlatforms,
        category: 'General'
      });
      Alert.alert('Success', 'Campaign তৈরি হয়েছে!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', JSON.stringify(error.response?.data) || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const styles = makeStyles(theme); // ✅ dynamic styles

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>নতুন ক্যাম্পেইন</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Campaign Name */}
        <View style={styles.section}>
          <Text style={styles.label}>ক্যাম্পেইনের নাম *</Text>
          <TextInput
            style={styles.input}
            placeholder="যেমন: Summer Sale 2025"
            placeholderTextColor={theme.subtext}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>বিবরণ *</Text>
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="ক্যাম্পেইন সম্পর্কে বিস্তারিত লিখুন..."
            placeholderTextColor={theme.subtext}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Budget & Commission Row */}
        <View style={styles.row}>
          <View style={[styles.section, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>বাজেট (৳) *</Text>
            <TextInput
              style={styles.input}
              placeholder="5000"
              placeholderTextColor={theme.subtext}
              value={budget}
              onChangeText={setBudget}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.section, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>কমিশন (৳) *</Text>
            <TextInput
              style={styles.input}
              placeholder="200"
              placeholderTextColor={theme.subtext}
              value={commissionRate}
              onChangeText={setCommissionRate}
              keyboardType="numeric"
            />
          </View>
        </View>

        {/* Commission Type */}
        <View style={styles.section}>
          <Text style={styles.label}>কমিশন টাইপ</Text>
          <View style={styles.chipRow}>
            {commissionTypes.map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.chip, commissionType === t && styles.chipActive]}
                onPress={() => setCommissionType(t)}
              >
                <Text style={[styles.chipText, commissionType === t && styles.chipTextActive]}>
                  {t.replace('PER_', 'Per ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Platforms */}
        <View style={styles.section}>
          <Text style={styles.label}>প্ল্যাটফর্ম (একাধিক বেছে নিন)</Text>
          <View style={styles.chipRow}>
            {platforms.map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.chip, selectedPlatforms.includes(p) && styles.chipActive]}
                onPress={() => togglePlatform(p)}
              >
                <Text style={[styles.chipText, selectedPlatforms.includes(p) && styles.chipTextActive]}>
                  {p.charAt(0) + p.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Budget Preview */}
        {budget && commissionRate && (
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>📊 Summary</Text>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>মোট বাজেট</Text>
              <Text style={styles.previewValue}>৳{Number(budget).toLocaleString()}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>প্রতি Promoter</Text>
              <Text style={styles.previewValue}>৳{Number(commissionRate).toLocaleString()}</Text>
            </View>
            <View style={styles.previewRow}>
              <Text style={styles.previewLabel}>সর্বোচ্চ Promoter</Text>
              <Text style={[styles.previewValue, { color: theme.primary }]}>
                {Math.floor(Number(budget) / Number(commissionRate))} জন
              </Text>
            </View>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.button, loading && { opacity: 0.7 }]}
          onPress={handleCreate}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.buttonText}>🚀 Campaign তৈরি করুন</Text>
          }
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

// ✅ Dynamic styles — theme এর সাথে পরিবর্তন হবে
const makeStyles = (theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: theme.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: theme.text,
    fontSize: 20,
  },
  headerTitle: {
    color: theme.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    color: theme.subtext,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: theme.inputBg,
    color: theme.text,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: theme.border,
  },
  textarea: {
    height: 110,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: theme.border,
    backgroundColor: theme.card,
    marginBottom: 4,
  },
  chipActive: {
    borderColor: theme.primary,
    backgroundColor: theme.primaryLight,
  },
  chipText: {
    color: theme.subtext,
    fontWeight: '600',
    fontSize: 13,
  },
  chipTextActive: {
    color: theme.primary,
  },
  previewCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.border,
  },
  previewTitle: {
    color: theme.text,
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 12,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  previewLabel: {
    color: theme.subtext,
    fontSize: 14,
  },
  previewValue: {
    color: theme.text,
    fontWeight: '600',
    fontSize: 14,
  },
  button: {
    backgroundColor: theme.primary,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

