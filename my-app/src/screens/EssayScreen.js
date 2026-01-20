import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../features/Reference/theme/ThemeContext';
import { useWebStyles } from '../components/WebContainer';
import { saveEssayAttempt, getEssayAttempts } from '../utils/storage';
import { OPENROUTER_API_KEY } from '../utils/secureKey';
import { SmartTextInput } from '../components/SmartTextInput';

// OpenRouter Configuration
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'google/gemini-3-flash-preview';

export default function EssayScreen({ navigation }) {
  const { theme, isDark } = useTheme();
  const { horizontalPadding, isWeb } = useWebStyles();

  // State management
  const [topic, setTopic] = useState('');
  const [answerText, setAnswerText] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [wordLimit, setWordLimit] = useState('1000');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [essayHistory, setEssayHistory] = useState([]);

  // Auto-dismiss keyboard hook handled by SmartTextInput

  // Load essay history on mount
  useEffect(() => {
    loadEssayHistory();
  }, []);

  // ... (existing helper functions: saveEssayToHistory, loadEssayHistory, handleUploadDocument) ...
  // Need to retain these if they are within the start-end range, but replace_file doesn't show them here unless I include them.
  // Wait, I am replacing the top part ONLY. But replace_file_content must match EXACTLY.
  // I must be careful. I will view the file first to be safe about line numbers.


  const loadEssayHistory = async () => {
    const history = await getEssayAttempts();
    setEssayHistory(history);
  };

  // Calculate word count
  const wordCount = answerText.trim().split(/\s+/).filter(w => w.length > 0).length;

  // Handle essay evaluation - Direct OpenRouter call
  const handleEvaluate = async () => {
    if (!topic.trim()) {
      Alert.alert('Missing Topic', 'Please enter an essay topic');
      return;
    }

    if (!answerText.trim() && !selectedImage) {
      Alert.alert('Missing Essay', 'Please write your essay or upload an image');
      return;
    }

    // Word count check only if text is provided
    if (answerText.trim() && wordCount < 50 && !selectedImage) {
      Alert.alert('Essay Too Short', 'Please write at least 50 words');
      return;
    }

    setIsEvaluating(true);
    setEvaluation(null);

    try {
      console.log('[Essay] Starting evaluation...');
      console.log('[Essay] API Key present:', !!OPENROUTER_API_KEY);

      // Build the prompt for essay evaluation - World-class UPSC standard
      const essayPrompt = `You are India's most elite UPSC Mains Essay Examiner with 25+ years of experience evaluating essays for the Civil Services Examination. You have trained IAS toppers and know exactly what distinguishes a 150+ scoring essay from an average one.

ESSAY TOPIC: "${topic.trim()}"

${selectedImage ? 'The essay is provided as a handwritten image. Please transcribe it completely, then provide detailed evaluation.' : `ESSAY SUBMITTED BY CANDIDATE:
---
${answerText.trim()}
---`}

WORD COUNT: ${selectedImage ? 'Determine from image' : wordCount} words
TARGET WORD LIMIT: ${wordLimit || 1000} words

YOUR TASK: Provide an extremely detailed, world-class evaluation that helps this aspirant improve their essay writing to UPSC topper level.

Return your evaluation in this JSON format (be VERY detailed in each section):

{
  "score": <number 0-100 based on UPSC marking scheme>,
  "transcribedText": "<if image provided, include complete transcribed text, otherwise null>",
  "overallVerdict": "<One powerful sentence summarizing the essay's fate in actual UPSC exam>",
  
  "executiveSummary": "<3-4 sentences covering: What works, what doesn't, and the single most important fix needed>",
  
  "structure": {
    "score": <0-25>,
    "introductionAnalysis": "<Detailed feedback on hook, thesis statement, roadmap - what's good, what's missing>",
    "bodyAnalysis": "<Feedback on paragraph flow, logical progression, coherence between sections>",
    "conclusionAnalysis": "<Feedback on summary, call to action, memorable ending>",
    "improvements": "<Specific structural improvements with examples>"
  },
  
  "content": {
    "score": <0-25>,
    "depthAnalysis": "<Is the analysis superficial or deep? Examples of where depth is lacking>",
    "factualAccuracy": "<Are facts/data/examples accurate and relevant?>",
    "balancedPerspective": "<Does it present multiple viewpoints fairly?>",
    "currentAffairs": "<Integration of recent developments, government schemes, international examples>",
    "missingDimensions": ["<Critical dimension 1 not covered>", "<Dimension 2>", "<Dimension 3>"]
  },
  
  "language": {
    "score": <0-25>,
    "vocabularyAssessment": "<Sophistication of vocabulary, use of technical terms>",
    "grammarIssues": ["<Specific grammar error 1 with correction>", "<Error 2>"],
    "sentenceConstruction": "<Variety, complexity, readability>",
    "toneAndStyle": "<Formal/informal, persuasive quality, examiner engagement>"
  },
  
  "relevance": {
    "score": <0-25>,
    "topicAdherence": "<How well does the essay stick to the topic?>",
    "keywordUsage": "<Are important keywords from the topic addressed?>",
    "tangentialContent": "<Any irrelevant sections that should be removed?>"
  },
  
  "strengths": [
    "<Specific strength 1 with example from essay>",
    "<Specific strength 2 with example>",
    "<Specific strength 3 with example>"
  ],
  
  "criticalWeaknesses": [
    "<Major weakness 1 with specific fix>",
    "<Major weakness 2 with specific fix>",
    "<Major weakness 3 with specific fix>"
  ],
  
  "actionPlan": {
    "immediate": [
      "<Action 1: What to fix right now in this essay>",
      "<Action 2: Another immediate fix>",
      "<Action 3: Quick win>"
    ],
    "shortTerm": [
      "<Practice focus 1 for next 30 days>",
      "<Practice focus 2>",
      "<Resources to study>"
    ],
    "longTerm": [
      "<Skill to develop over 3-6 months>",
      "<Reading habit to build>",
      "<Writing practice routine>"
    ]
  },
  
  "modelAnswerOutline": {
    "suggestedIntro": "<How a topper would start this essay - 2-3 sentences>",
    "keyPointsToInclude": [
      "<Point 1 that must be in a good answer>",
      "<Point 2>",
      "<Point 3>",
      "<Point 4>",
      "<Point 5>"
    ],
    "recommendedExamples": [
      "<Example/case study 1 to include>",
      "<Example 2>",
      "<Example 3>"
    ],
    "suggestedConclusion": "<How to end powerfully - 2-3 sentences>",
    "quotesToUse": ["<Relevant quote 1>", "<Quote 2>"]
  },
  
  "upscInsights": {
    "whatExaminersLookFor": "<Specific insights about UPSC essay marking>",
    "commonMistakes": "<Mistakes this essay makes that cost marks in UPSC>",
    "scoringTips": "<How to convert this essay from current score to 140+>",
    "timeManagement": "<Advice on structuring 3-hour essay writing>"
  },
  
  "finalRecommendation": "<A motivating 2-3 sentence message for the aspirant with clear next steps>"
}

IMPORTANT: Be extremely detailed and specific. Generic feedback like "improve vocabulary" is NOT acceptable. Give exact examples, specific suggestions, and actionable advice. This evaluation should feel like a personal coaching session from a UPSC topper.

Return ONLY valid JSON, no markdown blocks or explanation.`;

      // Build messages array - with vision support if image
      let messages;
      if (selectedImage) {
        messages = [{
          role: 'user',
          content: [
            { type: 'text', text: essayPrompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${selectedImage}`
              }
            }
          ]
        }];
      } else {
        messages = [{ role: 'user', content: essayPrompt }];
      }

      console.log('[Essay] Sending request to OpenRouter...');

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://upsc-prep.app',
          'X-Title': 'UPSC Essay Evaluator',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: messages,
          temperature: 0.7,
          max_tokens: 4096,
        })
      });

      console.log('[Essay] Response status:', response.status);

      if (!response.ok) {
        const errText = await response.text();
        console.error('[Essay] API Error:', errText);
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Essay] Response received');

      if (!data.choices?.[0]?.message?.content) {
        throw new Error('No content in response');
      }

      const content = data.choices[0].message.content;
      console.log('[Essay] Content length:', content.length);

      // Parse JSON from response
      let evalResult;
      try {
        evalResult = JSON.parse(content);
      } catch {
        // Try extracting from code block
        const match = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (match) {
          evalResult = JSON.parse(match[1].trim());
        } else {
          const objMatch = content.match(/\{[\s\S]*"score"[\s\S]*\}/);
          if (objMatch) {
            evalResult = JSON.parse(objMatch[0]);
          } else {
            throw new Error('Could not parse evaluation');
          }
        }
      }

      console.log('[Essay] Evaluation parsed, score:', evalResult.score);

      setEvaluation(evalResult);

      // If OCR returned text, update the text input
      if (evalResult.transcribedText) {
        setAnswerText(evalResult.transcribedText);
      }

      // Save to local storage
      await saveEssayAttempt({
        topic: topic.trim(),
        answerText: evalResult.transcribedText || answerText.trim() || 'Handwritten Essay',
        score: evalResult.score,
        evaluation: evalResult,
        wordCount: evalResult.transcribedText ? evalResult.transcribedText.split(/\s+/).length : wordCount,
        image: selectedImage ? 'stored_locally' : null
      });

      // Reload history
      await loadEssayHistory();

      Alert.alert(
        'Evaluation Complete!',
        `Your essay scored ${evalResult.score}/100`,
        [{ text: 'View Results', style: 'default' }]
      );

    } catch (error) {
      console.error('[Essay] Evaluation error:', error);
      Alert.alert(
        'Evaluation Failed',
        error.message || 'Failed to evaluate essay. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsEvaluating(false);
    }
  };

  // Handle document upload (OCR Implementation)
  const handleUploadDocument = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert("Permission Required", "You've refused to allow this app to access your photos!");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.3, // Compress image to avoid payload limits
        base64: true, // Get base64 for API
      });

      if (!result.canceled && result.assets && result.assets[0].base64) {
        setSelectedImage(result.assets[0].base64);
        Alert.alert(
          'Image Selected',
          'Your handwritten essay has been attached. Click "Evaluate Essay" to transcribe and analyze it.'
        );
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  // Clear form
  const handleClear = () => {
    Alert.alert(
      'Clear Essay',
      'Are you sure you want to clear your essay?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setTopic('');
            setAnswerText('');
            setEvaluation(null);
          },
        },
      ]
    );
  };

  // Render score badge
  const renderScoreBadge = (score) => {
    let color = '#FF3B30';
    let label = 'Needs Improvement';

    if (score >= 80) {
      color = '#34C759';
      label = 'Excellent';
    } else if (score >= 60) {
      color = '#FF9500';
      label = 'Good';
    } else if (score >= 40) {
      color = '#FFCC00';
      label = 'Average';
    }

    return (
      <View style={[styles.scoreBadge, { backgroundColor: color + '20' }]}>
        <Text style={[styles.scoreNumber, { color }]}>{score}</Text>
        <Text style={[styles.scoreLabel, { color }]}>{label}</Text>
      </View>
    );
  };

  // Render evaluation results - Enhanced UPSC-standard display
  const renderEvaluation = () => {
    if (!evaluation) return null;

    return (
      <View style={styles.evaluationSection}>
        {/* Score Card with Verdict */}
        <View style={[styles.scoreCard, { backgroundColor: theme.colors.surface }]}>
          {renderScoreBadge(evaluation.score)}
          <Text style={[styles.examinerRemark, { color: theme.colors.text }]}>
            {evaluation.overallVerdict || evaluation.examinerRemark}
          </Text>
          {evaluation.executiveSummary && (
            <Text style={[styles.executiveSummary, { color: theme.colors.textSecondary }]}>
              {evaluation.executiveSummary}
            </Text>
          )}
        </View>

        {/* Structure Analysis */}
        {evaluation.structure && (
          <View style={[styles.feedbackCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.feedbackHeader}>
              <Ionicons name="layers" size={20} color="#6366F1" />
              <Text style={[styles.feedbackTitle, { color: theme.colors.text }]}>Structure ({evaluation.structure.score}/25)</Text>
            </View>
            {evaluation.structure.introductionAnalysis && (
              <View style={styles.subSection}>
                <Text style={[styles.subSectionTitle, { color: theme.colors.primary }]}>Introduction:</Text>
                <Text style={[styles.feedbackItem, { color: theme.colors.text }]}>{evaluation.structure.introductionAnalysis}</Text>
              </View>
            )}
            {evaluation.structure.bodyAnalysis && (
              <View style={styles.subSection}>
                <Text style={[styles.subSectionTitle, { color: theme.colors.primary }]}>Body:</Text>
                <Text style={[styles.feedbackItem, { color: theme.colors.text }]}>{evaluation.structure.bodyAnalysis}</Text>
              </View>
            )}
            {evaluation.structure.conclusionAnalysis && (
              <View style={styles.subSection}>
                <Text style={[styles.subSectionTitle, { color: theme.colors.primary }]}>Conclusion:</Text>
                <Text style={[styles.feedbackItem, { color: theme.colors.text }]}>{evaluation.structure.conclusionAnalysis}</Text>
              </View>
            )}
          </View>
        )}

        {/* Content Analysis */}
        {evaluation.content && (
          <View style={[styles.feedbackCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.feedbackHeader}>
              <Ionicons name="document-text" size={20} color="#10B981" />
              <Text style={[styles.feedbackTitle, { color: theme.colors.text }]}>Content ({evaluation.content.score}/25)</Text>
            </View>
            {evaluation.content.depthAnalysis && (
              <Text style={[styles.feedbackItem, { color: theme.colors.text }]}>• {evaluation.content.depthAnalysis}</Text>
            )}
            {evaluation.content.factualAccuracy && (
              <Text style={[styles.feedbackItem, { color: theme.colors.text }]}>• {evaluation.content.factualAccuracy}</Text>
            )}
            {evaluation.content.missingDimensions?.length > 0 && (
              <View style={styles.subSection}>
                <Text style={[styles.subSectionTitle, { color: '#EF4444' }]}>Missing Dimensions:</Text>
                {evaluation.content.missingDimensions.map((dim, i) => (
                  <Text key={i} style={[styles.feedbackItem, { color: theme.colors.text }]}>• {dim}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Strengths */}
        <View style={[styles.feedbackCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.feedbackHeader}>
            <Ionicons name="checkmark-circle" size={20} color="#34C759" />
            <Text style={[styles.feedbackTitle, { color: theme.colors.text }]}>Strengths</Text>
          </View>
          {(evaluation.strengths || []).map((strength, index) => (
            <Text key={index} style={[styles.feedbackItem, { color: theme.colors.text }]}>
              • {strength}
            </Text>
          ))}
        </View>

        {/* Critical Weaknesses */}
        <View style={[styles.feedbackCard, { backgroundColor: theme.colors.surface }]}>
          <View style={styles.feedbackHeader}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text style={[styles.feedbackTitle, { color: theme.colors.text }]}>Critical Weaknesses</Text>
          </View>
          {(evaluation.criticalWeaknesses || evaluation.weaknesses || []).map((weakness, index) => (
            <Text key={index} style={[styles.feedbackItem, { color: theme.colors.text }]}>
              • {weakness}
            </Text>
          ))}
        </View>

        {/* Action Plan - Comprehensive */}
        {evaluation.actionPlan && (
          <View style={[styles.feedbackCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.feedbackHeader}>
              <Ionicons name="rocket" size={20} color="#F59E0B" />
              <Text style={[styles.feedbackTitle, { color: theme.colors.text }]}>Action Plan</Text>
            </View>

            {evaluation.actionPlan.immediate?.length > 0 && (
              <View style={styles.subSection}>
                <Text style={[styles.subSectionTitle, { color: '#EF4444' }]}>Immediate Fixes:</Text>
                {evaluation.actionPlan.immediate.map((item, i) => (
                  <Text key={i} style={[styles.feedbackItem, { color: theme.colors.text }]}>{i + 1}. {item}</Text>
                ))}
              </View>
            )}

            {evaluation.actionPlan.shortTerm?.length > 0 && (
              <View style={styles.subSection}>
                <Text style={[styles.subSectionTitle, { color: '#F59E0B' }]}>Next 30 Days:</Text>
                {evaluation.actionPlan.shortTerm.map((item, i) => (
                  <Text key={i} style={[styles.feedbackItem, { color: theme.colors.text }]}>{i + 1}. {item}</Text>
                ))}
              </View>
            )}

            {evaluation.actionPlan.longTerm?.length > 0 && (
              <View style={styles.subSection}>
                <Text style={[styles.subSectionTitle, { color: '#10B981' }]}>Long-term (3-6 months):</Text>
                {evaluation.actionPlan.longTerm.map((item, i) => (
                  <Text key={i} style={[styles.feedbackItem, { color: theme.colors.text }]}>{i + 1}. {item}</Text>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Model Answer Outline */}
        {evaluation.modelAnswerOutline && (
          <View style={[styles.feedbackCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.feedbackHeader}>
              <Ionicons name="school" size={20} color="#8B5CF6" />
              <Text style={[styles.feedbackTitle, { color: theme.colors.text }]}>Model Answer Blueprint</Text>
            </View>

            {evaluation.modelAnswerOutline.suggestedIntro && (
              <View style={styles.subSection}>
                <Text style={[styles.subSectionTitle, { color: theme.colors.primary }]}>Ideal Introduction:</Text>
                <Text style={[styles.rewrittenText, { color: theme.colors.text }]}>{evaluation.modelAnswerOutline.suggestedIntro}</Text>
              </View>
            )}

            {evaluation.modelAnswerOutline.keyPointsToInclude?.length > 0 && (
              <View style={styles.subSection}>
                <Text style={[styles.subSectionTitle, { color: theme.colors.primary }]}>Key Points to Include:</Text>
                {evaluation.modelAnswerOutline.keyPointsToInclude.map((point, i) => (
                  <Text key={i} style={[styles.feedbackItem, { color: theme.colors.text }]}>• {point}</Text>
                ))}
              </View>
            )}

            {evaluation.modelAnswerOutline.recommendedExamples?.length > 0 && (
              <View style={styles.subSection}>
                <Text style={[styles.subSectionTitle, { color: theme.colors.primary }]}>Recommended Examples:</Text>
                {evaluation.modelAnswerOutline.recommendedExamples.map((ex, i) => (
                  <Text key={i} style={[styles.feedbackItem, { color: theme.colors.text }]}>• {ex}</Text>
                ))}
              </View>
            )}

            {evaluation.modelAnswerOutline.quotesToUse?.length > 0 && (
              <View style={styles.subSection}>
                <Text style={[styles.subSectionTitle, { color: theme.colors.primary }]}>Quotes to Use:</Text>
                {evaluation.modelAnswerOutline.quotesToUse.map((quote, i) => (
                  <Text key={i} style={[styles.feedbackItem, { color: theme.colors.text, fontStyle: 'italic' }]}>"{quote}"</Text>
                ))}
              </View>
            )}

            {evaluation.modelAnswerOutline.suggestedConclusion && (
              <View style={styles.subSection}>
                <Text style={[styles.subSectionTitle, { color: theme.colors.primary }]}>Ideal Conclusion:</Text>
                <Text style={[styles.rewrittenText, { color: theme.colors.text }]}>{evaluation.modelAnswerOutline.suggestedConclusion}</Text>
              </View>
            )}
          </View>
        )}

        {/* UPSC Insights */}
        {evaluation.upscInsights && (
          <View style={[styles.feedbackCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.feedbackHeader}>
              <Ionicons name="trophy" size={20} color="#F59E0B" />
              <Text style={[styles.feedbackTitle, { color: theme.colors.text }]}>UPSC Topper Insights</Text>
            </View>
            {evaluation.upscInsights.whatExaminersLookFor && (
              <View style={styles.subSection}>
                <Text style={[styles.subSectionTitle, { color: '#10B981' }]}>What Examiners Look For:</Text>
                <Text style={[styles.feedbackItem, { color: theme.colors.text }]}>{evaluation.upscInsights.whatExaminersLookFor}</Text>
              </View>
            )}
            {evaluation.upscInsights.commonMistakes && (
              <View style={styles.subSection}>
                <Text style={[styles.subSectionTitle, { color: '#EF4444' }]}>Common Mistakes Made:</Text>
                <Text style={[styles.feedbackItem, { color: theme.colors.text }]}>{evaluation.upscInsights.commonMistakes}</Text>
              </View>
            )}
            {evaluation.upscInsights.scoringTips && (
              <View style={styles.subSection}>
                <Text style={[styles.subSectionTitle, { color: '#6366F1' }]}>How to Score 140+:</Text>
                <Text style={[styles.feedbackItem, { color: theme.colors.text }]}>{evaluation.upscInsights.scoringTips}</Text>
              </View>
            )}
          </View>
        )}

        {/* Final Recommendation */}
        {evaluation.finalRecommendation && (
          <View style={[styles.feedbackCard, { backgroundColor: '#4F46E510' }]}>
            <View style={styles.feedbackHeader}>
              <Ionicons name="heart" size={20} color="#4F46E5" />
              <Text style={[styles.feedbackTitle, { color: theme.colors.text }]}>Final Words</Text>
            </View>
            <Text style={[styles.motivationalText, { color: theme.colors.text }]}>
              {evaluation.finalRecommendation}
            </Text>
          </View>
        )}
      </View>
    );
  };


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding || 20 }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
          </TouchableOpacity>
        </View>

        {/* Title Card */}
        <View style={[styles.titleCard, { backgroundColor: theme.colors.surface }]}>
          <View style={[styles.topAccent, { backgroundColor: theme.colors.primary }]} />
          <View style={styles.titleContent}>
            <View style={[styles.titleIcon, { backgroundColor: theme.colors.primary + '12' }]}>
              <Ionicons name="document-text" size={28} color={theme.colors.primary} />
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>Essay Evaluation</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              AI-powered feedback for UPSC Mains
            </Text>
          </View>
        </View>

        {/* Topic Input */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>ESSAY TOPIC</Text>
          <View style={[styles.inputCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <SmartTextInput
              style={[styles.textInput, { color: theme.colors.text }]}
              placeholder="Enter your essay topic..."
              placeholderTextColor={theme.colors.textTertiary}
              value={topic}
              onChangeText={setTopic}
              multiline
              editable={!isEvaluating}
            />
          </View>
        </View>

        {/* Word Limit Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>TARGET WORD LIMIT</Text>
          <View style={styles.optionRow}>
            {['250', '500', '750', '1000', '1250'].map((limit) => (
              <TouchableOpacity
                key={limit}
                style={[
                  styles.optionChip,
                  { backgroundColor: isDark ? '#2A2A2E' : '#F5F5F5', borderColor: theme.colors.border },
                  wordLimit === limit && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                ]}
                onPress={() => setWordLimit(limit)}
                disabled={isEvaluating}
              >
                <Text style={[
                  styles.optionText,
                  { color: theme.colors.text },
                  wordLimit === limit && { color: '#fff', fontWeight: '600' }
                ]}>
                  {limit}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Essay Input */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.colors.textSecondary }]}>YOUR ESSAY (HANDWRITTEN)</Text>

          {/* Image Upload / Preview */}
          {selectedImage ? (
            <View style={[styles.imagePreviewContainer, { backgroundColor: theme.colors.surface }]}>
              <Image
                source={{ uri: `data:image/jpeg;base64,${selectedImage}` }}
                style={styles.imagePreview}
                resizeMode="contain"
              />
              <View style={[styles.imageActions, { backgroundColor: theme.colors.surface }]}>
                <View style={styles.imageAttachedRow}>
                  <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                  <Text style={[styles.imageAttachedText, { color: '#10B981' }]}>
                    Handwritten Essay Attached
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setSelectedImage(null)}
                  disabled={isEvaluating}
                >
                  <Ionicons name="close" size={16} color="#FF3B30" />
                  <Text style={styles.removeImageText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.uploadButton, { backgroundColor: isDark ? '#2A2A2E' : '#F8F9FA', borderColor: theme.colors.border }]}
              onPress={handleUploadDocument}
              disabled={isEvaluating}
            >
              <View style={[styles.uploadIconBg, { backgroundColor: theme.colors.primary + '15' }]}>
                <Ionicons name="camera-outline" size={22} color={theme.colors.primary} />
              </View>
              <Text style={[styles.uploadText, { color: theme.colors.text }]}>
                Upload / Scan Handwritten Essay
              </Text>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.secondaryButton, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
            onPress={handleClear}
            disabled={isEvaluating}
          >
            <Ionicons name="trash-outline" size={18} color="#FF3B30" />
            <Text style={[styles.secondaryButtonText, { color: '#FF3B30' }]}>Clear</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.evaluateButton,
              { backgroundColor: (!topic || (!answerText && !selectedImage) || isEvaluating) ? '#C7C7CC' : theme.colors.primary }
            ]}
            activeOpacity={0.8}
            onPress={handleEvaluate}
            disabled={!topic || (!answerText && !selectedImage) || isEvaluating}
          >
            {isEvaluating ? (
              <>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.buttonText}>Evaluating...</Text>
              </>
            ) : (
              <>
                <Ionicons name="analytics-outline" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Evaluate Essay</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Evaluation Results */}
        {renderEvaluation()}

        {/* Info Card */}
        {!evaluation && (
          <View style={[styles.infoCard, { backgroundColor: isDark ? '#1E293B' : '#F0F9FF', borderColor: isDark ? '#334155' : '#BAE6FD' }]}>
            <View style={styles.infoHeader}>
              <View style={[styles.infoIconBg, { backgroundColor: '#3B82F615' }]}>
                <Ionicons name="information-circle" size={18} color="#3B82F6" />
              </View>
              <Text style={[styles.infoTitle, { color: '#3B82F6' }]}>How it works</Text>
            </View>
            <View style={styles.infoList}>
              {[
                'Write your essay on any UPSC-relevant topic',
                'Get AI-powered evaluation with detailed feedback',
                'Receive a score out of 100 based on UPSC standards',
                'Get specific improvement suggestions',
                'All evaluations are saved locally on your device'
              ].map((item, index) => (
                <View key={index} style={styles.infoItem}>
                  <Text style={[styles.infoBullet, { color: theme.colors.textSecondary }]}>•</Text>
                  <Text style={[styles.infoText, { color: theme.colors.text }]}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
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
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Title Card
  titleCard: {
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  topAccent: {
    height: 4,
    width: '100%',
  },
  titleContent: {
    padding: 24,
    alignItems: 'center',
  },
  titleIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: '#8E8E93',
    marginTop: 6,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.4,
    marginBottom: 12,
  },
  inputCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  textInput: {
    padding: 16,
    fontSize: 15,
    fontWeight: '400',
    minHeight: 52,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  optionText: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  uploadIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  evaluateButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  evaluationSection: {
    marginTop: 8,
    gap: 16,
  },
  scoreCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  scoreBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
    marginBottom: 16,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1,
  },
  scoreLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: -0.3,
  },
  examinerRemark: {
    fontSize: 15,
    fontWeight: '400',
    color: '#1C1C1E',
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: -0.3,
  },
  executiveSummary: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 12,
    paddingHorizontal: 8,
  },
  subSection: {
    marginTop: 12,
    marginBottom: 8,
  },
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  motivationalText: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  feedbackCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  feedbackTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1C1C1E',
    letterSpacing: -0.4,
  },
  feedbackItem: {
    fontSize: 14,
    fontWeight: '400',
    color: '#1C1C1E',
    lineHeight: 20,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  rewrittenText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 22,
    fontStyle: 'italic',
    letterSpacing: -0.2,
  },
  detailedItem: {
    marginBottom: 12,
  },
  detailedLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  detailedText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  infoCard: {
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  infoIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  infoList: {
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    gap: 8,
  },
  infoBullet: {
    fontSize: 14,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  imagePreviewContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    backgroundColor: '#1A1A1A',
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  imageAttachedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  imageAttachedText: {
    fontSize: 14,
    fontWeight: '600',
  },
  removeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FF3B3015',
  },
  removeImageText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FF3B30',
  },
});
