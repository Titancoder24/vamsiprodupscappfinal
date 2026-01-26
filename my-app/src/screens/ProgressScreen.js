import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../features/Reference/theme/ThemeContext';

export default function ProgressScreen({ navigation }) {
  const { theme, isDark } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* Blurry Background Decorations */}
        <View style={[styles.blob, styles.blob1]} />
        <View style={[styles.blob, styles.blob2]} />
        <View style={[styles.blob, styles.blob3]} />

        {/* Back Button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
        >
          <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>

        {/* Main Content */}
        <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '20' }]}>
          <Ionicons name="stats-chart" size={48} color={theme.colors.primary} />
        </View>

        <Text style={[styles.title, { color: theme.colors.text }]}>
          Coming Soon
        </Text>

        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          We're working hard to bring you detailed progress tracking and analytics. Stay tuned!
        </Text>

        {/* Feature Preview Cards */}
        <View style={styles.featuresContainer}>
          {[
            { icon: 'trending-up-outline', title: 'Performance Analytics', desc: 'Track your improvement over time' },
            { icon: 'flame-outline', title: 'Streak Tracking', desc: 'Build consistent study habits' },
            { icon: 'trophy-outline', title: 'Achievements', desc: 'Unlock badges as you progress' },
          ].map((feature, index) => (
            <View key={index} style={[styles.featureCard, {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border
            }]}>
              <View style={[styles.featureIcon, { backgroundColor: theme.colors.primary + '15' }]}>
                <Ionicons name={feature.icon} size={22} color={theme.colors.primary} />
              </View>
              <View style={styles.featureText}>
                <Text style={[styles.featureTitle, { color: theme.colors.text }]}>
                  {feature.title}
                </Text>
                <Text style={[styles.featureDesc, { color: theme.colors.textSecondary }]}>
                  {feature.desc}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Go Back Button */}
        <TouchableOpacity
          style={[styles.goBackButton, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={18} color="#FFF" />
          <Text style={styles.goBackText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  blob: {
    position: 'absolute',
    borderRadius: 100,
  },
  blob1: {
    top: '15%',
    left: '5%',
    width: 200,
    height: 200,
    backgroundColor: '#6366F125',
    transform: [{ scale: 1.5 }],
  },
  blob2: {
    bottom: '20%',
    right: '0%',
    width: 150,
    height: 150,
    backgroundColor: '#10B98120',
    transform: [{ scale: 1.3 }],
  },
  blob3: {
    top: '45%',
    right: '15%',
    width: 100,
    height: 100,
    backgroundColor: '#F59E0B18',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  featuresContainer: {
    width: '100%',
    gap: 12,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
  },
  goBackButton: {
    marginTop: 32,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  goBackText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 8,
  },
});
