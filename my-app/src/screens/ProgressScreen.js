import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getStats, getStreak, getTestHistory } from '../utils/storage';
import { syncProgressToCloud } from '../utils/progressSync';
import { getUserHistory, getStreakFromCloud } from '../utils/activityTracker';
import { useTheme } from '../features/Reference/theme/ThemeContext';
import { useWebStyles } from '../components/WebContainer';
import { useAuth } from '../context/AuthContext';
import Svg, { Circle } from 'react-native-svg';

const screenWidth = Dimensions.get('window').width;

// Animated Progress Ring Component
const ProgressRing = ({ progress, size = 120, strokeWidth = 10, color = '#6366F1' }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 1500,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB20"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
    </View>
  );
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// XP Level Calculator
const calculateLevel = (xp) => {
  const level = Math.floor(xp / 100) + 1;
  const currentLevelXP = (xp % 100);
  const xpForNextLevel = 100;
  return { level, currentLevelXP, xpForNextLevel, progress: (currentLevelXP / xpForNextLevel) * 100 };
};

// Achievement Badge Component
const AchievementBadge = ({ icon, title, unlocked, color, theme }) => (
  <View style={[styles.achievementBadge, !unlocked && styles.achievementLocked]}>
    <View style={[styles.achievementIcon, { backgroundColor: unlocked ? color + '20' : theme.colors.border }]}>
      <Ionicons name={icon} size={24} color={unlocked ? color : theme.colors.textSecondary} />
    </View>
    <Text style={[styles.achievementTitle, { color: unlocked ? theme.colors.text : theme.colors.textSecondary }]}>
      {title}
    </Text>
    {!unlocked && (
      <Ionicons name="lock-closed" size={12} color={theme.colors.textSecondary} style={styles.lockIcon} />
    )}
  </View>
);

// Stat Pill Component
const StatPill = ({ value, label, icon, color, theme }) => (
  <View style={[styles.statPill, { backgroundColor: color + '12' }]}>
    <Ionicons name={icon} size={18} color={color} />
    <Text style={[styles.statPillValue, { color: theme.colors.text }]}>{value}</Text>
    <Text style={[styles.statPillLabel, { color: theme.colors.textSecondary }]}>{label}</Text>
  </View>
);

// Weekly Heatmap Component
const WeeklyHeatmap = ({ data, theme }) => {
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  return (
    <View style={styles.heatmapContainer}>
      {days.map((day, index) => {
        const value = data[index] || 0;
        const intensity = Math.min(value / 100, 1);
        const bgColor = value > 0
          ? `rgba(99, 102, 241, ${0.2 + intensity * 0.8})`
          : theme.colors.border;

        return (
          <View key={index} style={styles.heatmapDay}>
            <View style={[styles.heatmapCell, { backgroundColor: bgColor }]}>
              {value > 0 && (
                <Text style={styles.heatmapValue}>{value}%</Text>
              )}
            </View>
            <Text style={[styles.heatmapLabel, { color: theme.colors.textSecondary }]}>{day}</Text>
          </View>
        );
      })}
    </View>
  );
};

// Streak Display with Icon (no emoji)
const StreakDisplay = ({ streak, theme, isDark }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (streak > 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnim, { toValue: 1.1, duration: 600, useNativeDriver: true }),
          Animated.timing(scaleAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [streak]);

  return (
    <View style={styles.streakContainer}>
      <Animated.View style={[styles.streakIcon, { transform: [{ scale: scaleAnim }], backgroundColor: streak > 0 ? '#F59E0B20' : theme.colors.border }]}>
        <Ionicons
          name={streak > 0 ? "flame" : "moon-outline"}
          size={32}
          color={streak > 0 ? '#F59E0B' : theme.colors.textSecondary}
        />
      </Animated.View>
      <Text style={[styles.streakNumber, { color: streak > 0 ? '#F59E0B' : theme.colors.textSecondary }]}>
        {streak}
      </Text>
      <Text style={[styles.streakLabel, { color: theme.colors.textSecondary }]}>
        {streak === 1 ? 'day' : 'days'}
      </Text>
    </View>
  );
};

export default function ProgressScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { horizontalPadding } = useWebStyles();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [streak, setStreak] = useState(null);
  const [history, setHistory] = useState([]);
  const [cloudData, setCloudData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

  const loadData = async () => {
    setLoading(true);

    // Load local data
    const [statsData, streakData, historyData] = await Promise.all([
      getStats(),
      getStreak(),
      getTestHistory(),
    ]);

    setStats(statsData);
    setStreak(streakData);
    setHistory(historyData);

    // Load cloud data if user is logged in
    if (user?.email) {
      const [cloudHistory, cloudStreak] = await Promise.all([
        getUserHistory(user.email, 30),
        getStreakFromCloud(user.email),
      ]);

      if (cloudHistory.success) {
        setCloudData(cloudHistory.data);
      }

      // Use cloud streak if available and higher
      if (cloudStreak.currentStreak > (streakData?.currentStreak || 0)) {
        setStreak(cloudStreak);
      }

      // Sync local to cloud
      handleSync();
    }

    setLoading(false);
  };

  const handleSync = async () => {
    if (!user?.email) return;
    setSyncing(true);
    await syncProgressToCloud(user.email);
    setSyncing(false);
  };

  // Calculate XP (1 correct answer = 10 XP)
  const totalXP = (stats?.correctAnswers || 0) * 10;
  const levelInfo = calculateLevel(totalXP);

  // Average accuracy
  const avgScore = stats?.totalQuestions > 0
    ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100)
    : 0;

  // Weekly data for heatmap
  const getWeeklyData = () => {
    const data = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = stats?.weeklyData?.find(d => d.date === dateStr);
      data.push(dayData?.avgScore || 0);
    }
    return data;
  };

  // Achievements
  const achievements = [
    { id: 'first', icon: 'rocket-outline', title: 'First Steps', unlocked: (stats?.totalTests || 0) >= 1, color: '#6366F1' },
    { id: 'streak3', icon: 'flame-outline', title: '3 Day Streak', unlocked: (streak?.currentStreak || 0) >= 3, color: '#F59E0B' },
    { id: 'streak7', icon: 'bonfire-outline', title: 'Week Warrior', unlocked: (streak?.longestStreak || 0) >= 7, color: '#EF4444' },
    { id: 'perfect', icon: 'star-outline', title: 'Perfect Score', unlocked: history.some(h => h.score === 100), color: '#10B981' },
    { id: 'century', icon: 'medal-outline', title: 'Century', unlocked: (stats?.totalQuestions || 0) >= 100, color: '#8B5CF6' },
    { id: 'master', icon: 'trophy-outline', title: 'Master', unlocked: avgScore >= 80 && (stats?.totalQuestions || 0) >= 50, color: '#F59E0B' },
  ];

  const unlockedCount = achievements.filter(a => a.unlocked).length;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Loading your stats...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding || 20 }]}
      >
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
          >
            <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Your Stats</Text>
          </View>
          <TouchableOpacity
            onPress={handleSync}
            style={[styles.syncButton, { backgroundColor: theme.colors.surface }]}
            disabled={syncing}
          >
            {syncing ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Ionicons name="cloud-done-outline" size={20} color="#10B981" />
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Level Card */}
        <Animated.View
          style={[
            styles.levelCard,
            { backgroundColor: theme.colors.surface, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }
          ]}
        >
          <View style={styles.levelLeft}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelNumber}>LV</Text>
              <Text style={styles.levelValue}>{levelInfo.level}</Text>
            </View>
            <View style={styles.levelInfo}>
              <Text style={[styles.levelTitle, { color: theme.colors.text }]}>
                {levelInfo.level < 5 ? 'Beginner' : levelInfo.level < 10 ? 'Intermediate' : levelInfo.level < 20 ? 'Advanced' : 'Expert'}
              </Text>
              <View style={styles.xpBar}>
                <View style={[styles.xpFill, { width: `${levelInfo.progress}%` }]} />
              </View>
              <Text style={[styles.xpText, { color: theme.colors.textSecondary }]}>
                {levelInfo.currentLevelXP} / {levelInfo.xpForNextLevel} XP
              </Text>
            </View>
          </View>
          <View style={styles.levelRight}>
            <Text style={[styles.totalXP, { color: theme.colors.primary }]}>{totalXP}</Text>
            <Text style={[styles.totalXPLabel, { color: theme.colors.textSecondary }]}>Total XP</Text>
          </View>
        </Animated.View>

        {/* Main Stats Row */}
        <Animated.View style={[styles.mainStatsRow, { opacity: fadeAnim }]}>
          {/* Streak */}
          <View style={[styles.mainStatCard, { backgroundColor: theme.colors.surface }]}>
            <StreakDisplay streak={streak?.currentStreak || 0} theme={theme} isDark={isDark} />
          </View>

          {/* Accuracy Ring */}
          <View style={[styles.mainStatCard, styles.accuracyCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.ringContainer}>
              <ProgressRing
                progress={avgScore}
                size={100}
                strokeWidth={8}
                color={avgScore >= 70 ? '#10B981' : avgScore >= 40 ? '#F59E0B' : '#EF4444'}
              />
              <View style={styles.ringCenter}>
                <Text style={[styles.ringValue, { color: theme.colors.text }]}>{avgScore}%</Text>
                <Text style={[styles.ringLabel, { color: theme.colors.textSecondary }]}>accuracy</Text>
              </View>
            </View>
          </View>

          {/* Questions */}
          <View style={[styles.mainStatCard, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.questionsIcon, { backgroundColor: '#6366F115' }]}>
              <Ionicons name="help-circle" size={28} color="#6366F1" />
            </View>
            <Text style={[styles.questionsValue, { color: theme.colors.text }]}>
              {stats?.totalQuestions || 0}
            </Text>
            <Text style={[styles.questionsLabel, { color: theme.colors.textSecondary }]}>questions</Text>
          </View>
        </Animated.View>

        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <StatPill value={stats?.totalTests || 0} label="tests" icon="document-text" color="#6366F1" theme={theme} />
          <StatPill value={stats?.correctAnswers || 0} label="correct" icon="checkmark-circle" color="#10B981" theme={theme} />
          <StatPill value={streak?.longestStreak || 0} label="best" icon="trophy" color="#F59E0B" theme={theme} />
        </View>

        {/* Weekly Activity */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>This Week</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>Your daily scores</Text>
            </View>
            <View style={[styles.sectionBadge, { backgroundColor: '#6366F115' }]}>
              <Ionicons name="calendar" size={18} color="#6366F1" />
            </View>
          </View>
          <WeeklyHeatmap data={getWeeklyData()} theme={theme} />
        </View>

        {/* Achievements */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Achievements</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
                {unlockedCount}/{achievements.length} unlocked
              </Text>
            </View>
            <View style={[styles.sectionBadge, { backgroundColor: '#F59E0B15' }]}>
              <Ionicons name="medal" size={18} color="#F59E0B" />
            </View>
          </View>
          <View style={styles.achievementsGrid}>
            {achievements.map((achievement) => (
              <AchievementBadge
                key={achievement.id}
                icon={achievement.icon}
                title={achievement.title}
                unlocked={achievement.unlocked}
                color={achievement.color}
                theme={theme}
              />
            ))}
          </View>
        </View>

        {/* Recent Activity */}
        <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Recent Tests</Text>
              <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>Your latest attempts</Text>
            </View>
            <View style={[styles.sectionBadge, { backgroundColor: '#10B98115' }]}>
              <Ionicons name="time" size={18} color="#10B981" />
            </View>
          </View>

          {history.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={[styles.emptyIcon, { backgroundColor: isDark ? '#333' : '#F3F4F6' }]}>
                <Ionicons name="library-outline" size={32} color={theme.colors.textSecondary} />
              </View>
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No tests yet</Text>
              <Text style={[styles.emptyDesc, { color: theme.colors.textSecondary }]}>
                Complete a test to see your history
              </Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {history.slice(0, 5).map((test, index) => (
                <View key={test.id || index} style={[styles.historyItem, { borderBottomColor: theme.colors.border }]}>
                  <View style={styles.historyLeft}>
                    <View style={[
                      styles.historyDot,
                      { backgroundColor: test.score >= 70 ? '#10B981' : test.score >= 40 ? '#F59E0B' : '#EF4444' }
                    ]} />
                    <View>
                      <Text style={[styles.historyScore, { color: theme.colors.text }]}>
                        {test.correctCount}/{test.questionsCount}
                      </Text>
                      <Text style={[styles.historyDate, { color: theme.colors.textSecondary }]}>
                        {new Date(test.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.historyPercent,
                    { backgroundColor: test.score >= 70 ? '#10B98115' : test.score >= 40 ? '#F59E0B15' : '#EF444415' }
                  ]}>
                    <Text style={[
                      styles.historyPercentText,
                      { color: test.score >= 70 ? '#10B981' : test.score >= 40 ? '#F59E0B' : '#EF4444' }
                    ]}>
                      {test.score}%
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Motivation Card - No emojis, using icons */}
        <View style={[styles.motivationCard, { backgroundColor: isDark ? '#1E1B4B' : '#EEF2FF' }]}>
          <View style={[styles.motivationIcon, { backgroundColor: isDark ? '#312E81' : '#C7D2FE' }]}>
            <Ionicons
              name={avgScore >= 80 ? "rocket" : avgScore >= 50 ? "fitness" : "heart"}
              size={24}
              color={isDark ? '#A5B4FC' : '#4F46E5'}
            />
          </View>
          <View style={styles.motivationContent}>
            <Text style={[styles.motivationTitle, { color: isDark ? '#E0E7FF' : '#312E81' }]}>
              {avgScore >= 80 ? "You're crushing it!" :
                avgScore >= 50 ? "Keep pushing!" :
                  "Every question counts!"}
            </Text>
            <Text style={[styles.motivationText, { color: isDark ? '#A5B4FC' : '#6366F1' }]}>
              {streak?.currentStreak > 0
                ? `${streak.currentStreak} day streak! Don't break it!`
                : "Start a streak today!"}
            </Text>
          </View>
        </View>

        {/* Study Time */}
        <View style={[styles.timeCard, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.timeIcon, { backgroundColor: '#8B5CF615' }]}>
            <Ionicons name="hourglass-outline" size={28} color="#8B5CF6" />
          </View>
          <View style={styles.timeInfo}>
            <Text style={[styles.timeValue, { color: theme.colors.text }]}>
              {Math.floor((stats?.totalTimeSpent || 0) / 3600)}h {Math.floor(((stats?.totalTimeSpent || 0) % 3600) / 60)}m
            </Text>
            <Text style={[styles.timeLabel, { color: theme.colors.textSecondary }]}>Total study time</Text>
          </View>
        </View>

        {/* Cloud Sync Info */}
        {user?.email && (
          <View style={styles.syncInfo}>
            <Ionicons name="shield-checkmark" size={16} color="#10B981" />
            <Text style={[styles.syncInfoText, { color: theme.colors.textSecondary }]}>
              All data synced to cloud
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
  },
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  syncButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Level Card
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
  },
  levelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  levelBadge: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  levelNumber: {
    fontSize: 10,
    fontWeight: '800',
    color: '#A5B4FC',
    letterSpacing: 1,
  },
  levelValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginTop: -4,
  },
  levelInfo: {
    flex: 1,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  xpBar: {
    height: 6,
    backgroundColor: '#E5E7EB30',
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#6366F1',
    borderRadius: 3,
  },
  xpText: {
    fontSize: 12,
    marginTop: 4,
  },
  levelRight: {
    alignItems: 'flex-end',
  },
  totalXP: {
    fontSize: 28,
    fontWeight: '800',
  },
  totalXPLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Main Stats Row
  mainStatsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  mainStatCard: {
    flex: 1,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  accuracyCard: {
    flex: 1.5,
  },
  // Streak Display
  streakContainer: {
    alignItems: 'center',
  },
  streakIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  streakNumber: {
    fontSize: 32,
    fontWeight: '800',
  },
  streakLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Accuracy Ring
  ringContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  ringValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  ringLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  // Questions
  questionsIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  questionsValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  questionsLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  statPillValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statPillLabel: {
    fontSize: 12,
  },
  // Section
  section: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  sectionSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  sectionBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Heatmap
  heatmapContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heatmapDay: {
    alignItems: 'center',
    flex: 1,
  },
  heatmapCell: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  heatmapValue: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  heatmapLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  // Achievements
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementBadge: {
    width: '30%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    position: 'relative',
  },
  achievementLocked: {
    opacity: 0.5,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  lockIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  emptyDesc: {
    fontSize: 14,
    textAlign: 'center',
  },
  // History
  historyList: {
    gap: 0,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  historyScore: {
    fontSize: 15,
    fontWeight: '600',
  },
  historyDate: {
    fontSize: 12,
    marginTop: 2,
  },
  historyPercent: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  historyPercentText: {
    fontSize: 14,
    fontWeight: '700',
  },
  // Motivation
  motivationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
  },
  motivationIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  motivationContent: {
    flex: 1,
  },
  motivationTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  motivationText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Time Card
  timeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
  },
  timeIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  timeInfo: {},
  timeValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  timeLabel: {
    fontSize: 13,
    marginTop: 2,
  },
  // Sync Info
  syncInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  syncInfoText: {
    fontSize: 13,
  },
});
