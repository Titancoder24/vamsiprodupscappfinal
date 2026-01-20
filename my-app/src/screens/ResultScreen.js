import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { saveTestResult } from '../utils/storage';
import { recordTestSession, recordQuestionAttemptsBatch } from '../utils/activityTracker';
import { useTheme } from '../features/Reference/theme/ThemeContext';
import { useWebStyles } from '../components/WebContainer';
import { useAuth } from '../context/AuthContext';

export default function ResultScreen({ navigation, route }) {
  const { theme, isDark } = useTheme();
  const { horizontalPadding, isWeb } = useWebStyles();
  const { user } = useAuth();
  const { questions, answers, timeTaken, topic } = route.params || {};
  const hasSaved = useRef(false);

  // Calculate results first
  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;

  questions?.forEach((q, index) => {
    if (answers[index] === undefined) {
      unanswered++;
    } else if (answers[index] === q.correct) {
      correct++;
    } else {
      incorrect++;
    }
  });

  const total = questions?.length || 0;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  // Save result on mount (only once) - both locally and to cloud
  useEffect(() => {
    if (!hasSaved.current && questions && answers) {
      hasSaved.current = true;

      // Save locally
      saveTestResult({ questions, answers, timeTaken });

      // Record to cloud if user is logged in
      if (user?.email) {
        const sessionId = `session_${Date.now()}`;

        // Record the test session
        recordTestSession({
          userEmail: user.email,
          sessionId,
          topic: topic || 'General',
          totalQuestions: total,
          correctAnswers: correct,
          scorePrecent: percentage,
          timeTakenSeconds: timeTaken,
        });

        // Record each question attempt
        const attempts = questions.map((q, index) => ({
          questionText: q.question,
          questionTopic: q.topic || topic || 'General',
          selectedAnswer: answers[index] !== undefined ? q.options[answers[index]] : null,
          correctAnswer: q.options[q.correct],
          isCorrect: answers[index] === q.correct,
          timeTakenSeconds: Math.floor(timeTaken / total), // Approximate per question
        }));

        recordQuestionAttemptsBatch(user.email, attempts, sessionId);
      }
    }
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getGrade = () => {
    if (percentage >= 80) return { text: 'Excellent!', color: '#34C759', icon: 'star' };
    if (percentage >= 60) return { text: 'Good Job!', color: '#007AFF', icon: 'thumbs-up' };
    if (percentage >= 40) return { text: 'Keep Practicing', color: '#FF9500', icon: 'fitness' };
    return { text: 'Need Improvement', color: '#FF3B30', icon: 'heart' };
  };

  const grade = getGrade();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding || 20 }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Test Complete!</Text>
          <View style={styles.gradeRow}>
            <Ionicons name={grade.icon} size={20} color={grade.color} />
            <Text style={[styles.grade, { color: grade.color }]}>{grade.text}</Text>
          </View>
        </View>

        {/* Score Card */}
        <View style={[styles.scoreCard, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.scoreCircle, { backgroundColor: theme.colors.background }]}>
            <Text style={[styles.scorePercentage, { color: theme.colors.primary }]}>{percentage}%</Text>
            <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary }]}>Score</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: '#34C759' }]}>{correct}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Correct</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: '#FF3B30' }]}>{incorrect}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Incorrect</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: theme.colors.textSecondary }]}>{unanswered}</Text>
              <Text style={[styles.statLabel, { color: theme.colors.textSecondary }]}>Skipped</Text>
            </View>
          </View>

          <View style={[styles.timeBox, { backgroundColor: theme.colors.background }]}>
            <Ionicons name="time-outline" size={18} color={theme.colors.primary} style={{ marginRight: 6 }} />
            <Text style={[styles.timeText, { color: theme.colors.text }]}>Time Taken: {formatTime(timeTaken)}</Text>
          </View>
        </View>

        {/* Answer Breakdown */}
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Detailed Review</Text>

        {questions.map((q, index) => {
          const userAnswer = answers[index];
          const isCorrect = userAnswer === q.correct;
          const isUnanswered = userAnswer === undefined;

          return (
            <View key={index} style={[styles.reviewCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.reviewHeader}>
                <Text style={[styles.reviewQNum, { color: theme.colors.primary }]}>Q{index + 1}</Text>
                <View style={[
                  styles.reviewBadge,
                  isUnanswered ? [styles.badgeSkipped, { backgroundColor: theme.colors.background }] : isCorrect ? [styles.badgeCorrect, { backgroundColor: isDark ? '#1A3A1A' : '#E8F8ED' }] : [styles.badgeWrong, { backgroundColor: isDark ? '#3A1A1A' : '#FFE5E5' }]
                ]}>
                  <Text style={[styles.reviewBadgeText, { color: theme.colors.text }]}>
                    {isUnanswered ? 'Skipped' : isCorrect ? '✓ Correct' : '✗ Wrong'}
                  </Text>
                </View>
              </View>

              <Text style={[styles.reviewQuestion, { color: theme.colors.text }]}>{q.question}</Text>

              <View style={[styles.answerBox, { backgroundColor: theme.colors.background }]}>
                {!isUnanswered && (
                  <View style={styles.answerRow}>
                    <Text style={[styles.answerLabel, { color: theme.colors.textSecondary }]}>Your Answer:</Text>
                    <Text style={[styles.answerText, isCorrect ? styles.answerCorrect : styles.answerWrong]}>
                      {String.fromCharCode(65 + userAnswer)}. {q.options[userAnswer]}
                    </Text>
                  </View>
                )}
                <View style={styles.answerRow}>
                  <Text style={[styles.answerLabel, { color: theme.colors.textSecondary }]}>Correct Answer:</Text>
                  <Text style={[styles.answerText, styles.answerCorrect]}>
                    {String.fromCharCode(65 + q.correct)}. {q.options[q.correct]}
                  </Text>
                </View>
              </View>

              <View style={[styles.explanationBox, { backgroundColor: isDark ? '#3A3000' : '#FFF9E6' }]}>
                <View style={styles.explanationHeader}>
                  <Ionicons name="book-outline" size={16} color={isDark ? '#FFD700' : '#B8860B'} />
                  <Text style={[styles.explanationTitle, { color: isDark ? '#FFD700' : '#B8860B' }]}>Explanation</Text>
                </View>
                <Text style={[styles.explanationText, { color: theme.colors.text }]}>{q.explanation}</Text>
              </View>
            </View>
          );
        })}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary }]}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Config')}
          >
            <Text style={[styles.retryText, { color: theme.colors.primary }]}>Try Another Test</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeButton}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Home')}
          >
            <LinearGradient
              colors={['#007AFF', '#0055D4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.homeGradient}
            >
              <Text style={styles.homeText}>Back to Home</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.6,
  },
  grade: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 6,
    letterSpacing: -0.4,
  },
  gradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  scoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  scorePercentage: {
    fontSize: 36,
    fontWeight: '700',
    color: '#007AFF',
    letterSpacing: -1,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  statBox: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#8E8E93',
    marginTop: 4,
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  timeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  timeText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.4,
    marginBottom: 16,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewQNum: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    letterSpacing: -0.2,
  },
  reviewBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeCorrect: {
    backgroundColor: '#E8F8ED',
  },
  badgeWrong: {
    backgroundColor: '#FFE5E5',
  },
  badgeSkipped: {
    backgroundColor: '#F2F2F7',
  },
  reviewBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  reviewQuestion: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1C1C1E',
    lineHeight: 22,
    letterSpacing: -0.3,
    marginBottom: 14,
  },
  answerBox: {
    backgroundColor: '#F9F9FB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  answerRow: {
    marginBottom: 8,
  },
  answerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  answerText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  answerCorrect: {
    color: '#34C759',
  },
  answerWrong: {
    color: '#FF3B30',
  },
  explanationBox: {
    backgroundColor: '#FFF9E6',
    borderRadius: 10,
    padding: 12,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  explanationTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B8860B',
  },
  explanationText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#1C1C1E',
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  actions: {
    marginTop: 12,
    gap: 12,
  },
  retryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  retryText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
    letterSpacing: -0.4,
  },
  homeButton: {},
  homeGradient: {
    paddingVertical: 18,
    borderRadius: 14,
    alignItems: 'center',
  },
  homeText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
});

