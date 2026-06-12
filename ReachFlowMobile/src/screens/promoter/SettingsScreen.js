import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, themes } from '../../context/ThemeContext';

export default function SettingsScreen({ navigation }) {
  const { theme, themeName, setTheme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={themeName === 'dark' ? 'light-content' : 'dark-content'} />
      
      <View style={[styles.header, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backBtn, { backgroundColor: theme.card }]}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <Text style={[styles.sectionLabel, { color: theme.subtext }]}>থিম বেছে নিন</Text>

        {Object.entries(themes).map(([key, t]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.themeCard,
              { backgroundColor: theme.card, borderColor: themeName === key ? theme.primary : theme.border }
            ]}
            onPress={() => setTheme(key)}
            activeOpacity={0.7}
          >
            <Text style={styles.themeIcon}>{t.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.themeName, { color: theme.text }]}>{t.name}</Text>
              <View style={styles.colorRow}>
                <View style={[styles.colorDot, { backgroundColor: t.background, borderWidth: 1, borderColor: '#ccc' }]} />
                <View style={[styles.colorDot, { backgroundColor: t.card }]} />
                <View style={[styles.colorDot, { backgroundColor: t.primary }]} />
                <View style={[styles.colorDot, { backgroundColor: t.text }]} />
              </View>
            </View>
            {themeName === key && (
              <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  sectionLabel: { fontSize: 13, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  themeCard: {
    flexDirection: 'row', alignItems: 'center',
    padding: 16, borderRadius: 16, marginBottom: 12,
    borderWidth: 2, gap: 14,
  },
  themeIcon: { fontSize: 28 },
  themeName: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  colorRow: { flexDirection: 'row', gap: 6 },
  colorDot: { width: 16, height: 16, borderRadius: 8 },
});



