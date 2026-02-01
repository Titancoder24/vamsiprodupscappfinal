import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../features/Reference/theme/ThemeContext';

const { width, height } = Dimensions.get('window');

interface Props {
    visible: boolean;
    onClose: () => void;
}

export default function PayWallPopup({ visible, onClose }: Props) {
    const { theme, isDark } = useTheme();
    useNavigation(); // Ensures we are in a nav context if needed, but we'll use a direct link callback if possible.
    const navigation = useNavigation<any>();

    const handleUpgrade = () => {
        onClose();
        navigation.navigate('Billing');
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={[styles.container, { backgroundColor: isDark ? '#1F2937' : '#FFFFFF', borderColor: isDark ? '#374151' : '#E5E7EB' }]}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="diamond" size={40} color="#F59E0B" />
                    </View>

                    <Text style={[styles.title, { color: theme.colors.text }]}>
                        Running Low on Credits?
                    </Text>

                    <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
                        You need more credits to use this AI Premium feature. Upgrade now to continue your uninterrupted learning journey!
                    </Text>

                    <TouchableOpacity
                        style={[styles.upgradeBtn, { backgroundColor: theme.colors.primary }]}
                        onPress={handleUpgrade}
                    >
                        <Text style={styles.upgradeText}>Get Credits</Text>
                        <Ionicons name="arrow-forward" size={18} color="#FFF" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Text style={[styles.closeText, { color: theme.colors.textSecondary }]}>Maybe Later</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    container: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFFBEB',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 4,
        borderColor: '#FEF3C7'
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 12
    },
    description: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22,
        paddingHorizontal: 10
    },
    upgradeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        width: '100%',
        paddingVertical: 14,
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: "#F59E0B",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    upgradeText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold'
    },
    closeBtn: {
        paddingVertical: 10,
    },
    closeText: {
        fontSize: 14,
        fontWeight: '600'
    }
});
