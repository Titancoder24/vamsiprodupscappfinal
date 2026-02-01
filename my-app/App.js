import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { RoadmapProvider } from './src/context/RoadmapContext';
import { VisualReferenceProvider } from './src/context/VisualReferenceContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { WebLayout } from './src/components/WebContainer';

// Auth Screens
import LandingScreen from './src/screens/LandingScreen';
import LoginScreen from './src/screens/LoginScreen';
import PricingScreen from './src/screens/PricingScreen';

// Main App Screens
import HomeScreen from './src/screens/HomeScreen';
import ConfigScreen from './src/screens/ConfigScreen';
import QuestionsListScreen from './src/screens/QuestionsListScreen';
import TestScreen from './src/screens/TestScreen';
import ResultScreen from './src/screens/ResultScreen';
import MainsAnswerEvaluationScreen from './src/screens/MainsAnswerEvaluationScreen';
import QuestionBankScreen from './src/screens/QuestionBankScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import NewsFeedScreen from './src/screens/NewsFeedScreen';
import ArticleDetailScreen from './src/screens/ArticleDetailScreen';
import QuestionPaperScreen from './src/screens/QuestionPaperScreen';
import QuestionSetListScreen from './src/screens/QuestionSetListScreen';

// Roadmap Screens
import RoadmapScreen from './src/screens/RoadmapScreen';
import TopicDetailScreen from './src/screens/TopicDetailScreen';
import DailyPlanScreen from './src/screens/DailyPlanScreen';
import UserPreferencesScreen from './src/screens/UserPreferencesScreen';

// Visual Reference Screens
import {
  ReferenceScreen,
  HistoryTimelineScreen,
  PolityFlowScreen,
  GeographyViewScreen,
  EconomyCardsScreen,
  EnvironmentCardsScreen,
  ScienceTechViewScreen,
  ThemeProvider as ReferenceThemeProvider,
} from './src/features/Reference';

// Mind Map Screens
import { MindMapScreen, MindMapListScreen, AIMindMapScreen, AIMindMapListScreen } from './src/features/MindMap';

// Notes Screens
import {
  NoteListScreen,
  NoteEditorScreen,
  NotePreviewScreen,
  UploadNotesScreen,
  WebClipperScreen,
  CreateNoteScreen,
  NoteDetailScreen,
  AINotesMakerScreen,
} from './src/features/Notes';

// PDF MCQ Screens
import { GenerateMCQsFromPDFScreen, PDFMCQListScreen, AIMCQsGenerateScreen, AIMCQListScreen } from './src/features/PDFMCQ';

// Coming Soon Screen
import ComingSoonScreen from './src/screens/ComingSoonScreen';

// Auth Callback Screen
import AuthCallbackScreen from './src/screens/AuthCallbackScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';

// Billing Screen
import BillingScreen from './src/screens/BillingScreen';

const Stack = createNativeStackNavigator();

// Loading Screen
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color="#8E54E9" />
  </View>
);

// Auth Navigator (Login + Pricing)
const AuthNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
        animation: 'fade',
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Pricing" component={PricingScreen} />
      <Stack.Screen name="AuthCallback" component={AuthCallbackScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
};

// Main App Navigator
const MainNavigator = () => (
  <Stack.Navigator
    initialRouteName="Home"
    screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: '#F2F2F7' },
      animation: 'slide_from_right',
    }}
  >
    <Stack.Screen name="Home" component={HomeScreen} />
    <Stack.Screen name="Config" component={ConfigScreen} />
    <Stack.Screen name="QuestionsList" component={QuestionsListScreen} />
    <Stack.Screen name="Test" component={TestScreen} />
    <Stack.Screen name="Result" component={ResultScreen} />
    <Stack.Screen name="Essay" component={MainsAnswerEvaluationScreen} />
    <Stack.Screen name="QuestionBank" component={QuestionBankScreen} />
    <Stack.Screen name="Progress" component={ProgressScreen} />
    <Stack.Screen name="Settings" component={SettingsScreen} />
    <Stack.Screen name="Roadmap" component={RoadmapScreen} />
    <Stack.Screen name="TopicDetail" component={TopicDetailScreen} />
    <Stack.Screen name="DailyPlan" component={DailyPlanScreen} />
    <Stack.Screen name="UserPreferences" component={UserPreferencesScreen} />
    {/* Visual Reference Screens */}
    <Stack.Screen name="Reference" component={ReferenceScreen} />
    <Stack.Screen name="HistoryTimeline" component={HistoryTimelineScreen} />
    <Stack.Screen name="PolityFlow" component={PolityFlowScreen} />
    <Stack.Screen name="GeographyView" component={GeographyViewScreen} />
    <Stack.Screen name="EconomyCards" component={EconomyCardsScreen} />
    <Stack.Screen name="EnvironmentCards" component={EnvironmentCardsScreen} />
    <Stack.Screen name="ScienceTechView" component={ScienceTechViewScreen} />
    {/* Articles Screens */}
    <Stack.Screen name="Articles" component={NewsFeedScreen} />
    <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
    {/* Mind Map Screens */}
    <Stack.Screen name="MindMap" component={MindMapListScreen} />
    <Stack.Screen name="MindMapEditor" component={MindMapScreen} />
    {/* AI Mind Map Screens */}
    <Stack.Screen name="AIMindMap" component={AIMindMapListScreen} />
    <Stack.Screen name="AIMindMapEditor" component={AIMindMapScreen} />
    {/* Notes Screens */}
    <Stack.Screen name="Notes" component={UploadNotesScreen} />
    <Stack.Screen name="WebClipperScreen" component={WebClipperScreen} />
    <Stack.Screen name="CreateNoteScreen" component={CreateNoteScreen} />
    <Stack.Screen name="NoteDetailScreen" component={NoteDetailScreen} />
    <Stack.Screen name="NoteEditor" component={NoteEditorScreen} />
    <Stack.Screen name="NotePreview" component={NotePreviewScreen} />
    <Stack.Screen name="AINotesMaker" component={AINotesMakerScreen} />
    {/* PDF MCQ Generator */}
    <Stack.Screen name="PDFMCQGenerator" component={GenerateMCQsFromPDFScreen} />
    <Stack.Screen name="PDFMCQList" component={PDFMCQListScreen} />
    {/* AI MCQ Generator (without PDF upload) */}
    <Stack.Screen name="AIMCQGenerator" component={AIMCQsGenerateScreen} />
    <Stack.Screen name="AIMCQList" component={AIMCQListScreen} />
    <Stack.Screen name="QuestionPaper" component={QuestionPaperScreen} />
    <Stack.Screen name="QuestionSetList" component={QuestionSetListScreen} />
    {/* Coming Soon */}
    <Stack.Screen name="ComingSoon" component={ComingSoonScreen} />
    {/* Billing */}
    <Stack.Screen name="Billing" component={BillingScreen} />
  </Stack.Navigator>
);

// Root Navigator
const RootNavigator = () => {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen
          name="Main"
          component={MainNavigator}
          options={{ animation: 'fade' }}
        />
      ) : (
        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
          options={{ animation: 'fade' }}
        />
      )}
    </Stack.Navigator>
  );
};

import * as Linking from 'expo-linking';

const prefix = Linking.createURL('/');

const linking = {
  prefixes: [prefix, 'upscprep://'],
  config: {
    screens: {
      Main: {
        screens: {
          Home: 'home',
          Notes: 'notes',
          WebClipperScreen: 'clip',
          CreateNoteScreen: 'create-note',
          NoteDetailScreen: 'note/:noteId',
          AINotesMaker: 'ai-notes-maker',
          Roadmap: 'roadmap',
          QuestionSetList: 'questions',
          Essay: 'essay',
          Reference: 'reference',
          MindMap: 'mindmap',
          PDFMCQGenerator: 'pdf-mcq',
          AIMCQGenerator: 'ai-mcq',
          Progress: 'progress',
          Settings: 'settings',
          QuestionPaper: 'question-bank/:questionSetId',
        },
      },
      Auth: {
        screens: {
          Login: 'login',
          Pricing: 'pricing',
          AuthCallback: {
            path: 'auth/callback',
          },
          ResetPassword: {
            path: 'auth/reset-password',
          },
        },
      },
    },
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NotificationProvider>
          <RoadmapProvider>
            <VisualReferenceProvider>
              <ReferenceThemeProvider>
                <WebLayout>
                  <NavigationContainer linking={linking} fallback={<LoadingScreen />}>
                    <StatusBar style="dark" />
                    <RootNavigator />
                  </NavigationContainer>
                </WebLayout>
              </ReferenceThemeProvider>
            </VisualReferenceProvider>
          </RoadmapProvider>
        </NotificationProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFBFF',
  },
});
