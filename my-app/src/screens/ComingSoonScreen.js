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
import { useWebStyles } from '../components/WebContainer';

export default function ComingSoonScreen({ navigation, route }) {
    const { theme, isDark } = useTheme();
    const { horizontalPadding } = useWebStyles();

    // Get feature name from route params
    const featureName = route?.params?.featureName || 'Feature';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={[styles.content, { paddingHorizontal: horizontalPadding || 20 }]}>
                {/* Back Button */}
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
                </TouchableOpacity>

                {/* Main Content */}
                <View style={styles.centerContent}>
                    {/* Icon Container */}
                    <View style={[styles.iconContainer, { backgroundColor: theme.colors.primary + '12' }]}>
                        <View style={[styles.iconInner, { backgroundColor: theme.colors.primary + '20' }]}>
                            <Ionicons name="construct-outline" size={48} color={theme.colors.primary} />
                        </View>
                    </View>

                    {/* Title */}
                    <Text style={[styles.title, { color: theme.colors.text }]}>
                        Coming Soon
                    </Text>

                    {/* Feature Name */}
                    <View style={[styles.featureBadge, { backgroundColor: theme.colors.primary + '15' }]}>
                        <Text style={[styles.featureName, { color: theme.colors.primary }]}>
                            {featureName}
                        </Text>
                    </View>

                    {/* Description */}
                    <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                        We're working hard to bring you this exciting feature. Stay tuned for updates!
                    </Text>

                    {/* Progress Indicator */}
                    <View style={styles.progressSection}>
                        <View style={[styles.progressBar, { backgroundColor: isDark ? '#333' : '#E5E5EA' }]}>
                            <View style={[styles.progressFill, { backgroundColor: theme.colors.primary, width: '65%' }]} />
                        </View>
                        <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
                            Development in progress
                        </Text>
                    </View>

                    {/* Features List */}
                    <View style={[styles.featuresList, { backgroundColor: theme.colors.surface }]}>
                        <Text style={[styles.featuresTitle, { color: theme.colors.text }]}>
                            What to expect
                        </Text>
                        {[
                            { icon: 'sparkles-outline', text: 'AI-powered insights' },
                            { icon: 'layers-outline', text: 'Intuitive interface' },
                            { icon: 'flash-outline', text: 'Fast performance' },
                            { icon: 'shield-checkmark-outline', text: 'Secure & private' },
                        ].map((item, index) => (
                            <View key={index} style={styles.featureItem}>
                                <View style={[styles.featureIconBg, { backgroundColor: '#10B98115' }]}>
                                    <Ionicons name={item.icon} size={16} color="#10B981" />
                                </View>
                                <Text style={[styles.featureText, { color: theme.colors.text }]}>
                                    {item.text}
                                </Text>
                            </View>
                        ))}
                    </View>
                </View>

                {/* Bottom Button */}
                <TouchableOpacity
                    style={[styles.notifyButton, { backgroundColor: theme.colors.primary }]}
                    onPress={() => navigation.goBack()}
                    activeOpacity={0.8}
                >
                    <Ionicons name="arrow-back" size={20} color="#fff" />
                    <Text style={styles.notifyButtonText}>Go Back to Home</Text>
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
        paddingTop: 16,
        paddingBottom: 24,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    centerContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    iconInner: {
        width: 88,
        height: 88,
        borderRadius: 44,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        letterSpacing: -0.5,
        marginBottom: 12,
    },
    featureBadge: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 16,
    },
    featureName: {
        fontSize: 15,
        fontWeight: '600',
    },
    description: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        maxWidth: 300,
        marginBottom: 28,
    },
    progressSection: {
        width: '100%',
        maxWidth: 280,
        alignItems: 'center',
        marginBottom: 28,
    },
    progressBar: {
        width: '100%',
        height: 8,
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 12,
        marginTop: 8,
        fontWeight: '500',
    },
    featuresList: {
        width: '100%',
        maxWidth: 320,
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 4,
    },
    featuresTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    featureIconBg: {
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureText: {
        fontSize: 14,
        fontWeight: '500',
    },
    notifyButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        paddingVertical: 16,
        borderRadius: 14,
        marginTop: 16,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    notifyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
