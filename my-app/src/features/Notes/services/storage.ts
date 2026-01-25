/**
 * Cross-platform Storage Utility
 * Uses localStorage on web and AsyncStorage on native
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const isWeb = Platform.OS === 'web';

/**
 * Get item from storage
 */
export const getItem = async (key: string): Promise<string | null> => {
    try {
        if (isWeb && typeof window !== 'undefined' && window.localStorage) {
            const value = window.localStorage.getItem(key);
            console.log(`[Storage] getItem(${key}):`, value ? `${value.length} chars` : 'null');
            return value;
        }
        return await AsyncStorage.getItem(key);
    } catch (error) {
        console.error('[Storage] getItem error:', error);
        return null;
    }
};

/**
 * Set item in storage
 */
export const setItem = async (key: string, value: string): Promise<void> => {
    try {
        if (isWeb && typeof window !== 'undefined' && window.localStorage) {
            console.log(`[Storage] setItem(${key}):`, value.length, 'chars');
            window.localStorage.setItem(key, value);
            return;
        }
        await AsyncStorage.setItem(key, value);
    } catch (error) {
        console.error('[Storage] setItem error:', error);
        throw error;
    }
};

/**
 * Remove item from storage
 */
export const removeItem = async (key: string): Promise<void> => {
    try {
        if (isWeb && typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.removeItem(key);
            return;
        }
        await AsyncStorage.removeItem(key);
    } catch (error) {
        console.error('[Storage] removeItem error:', error);
    }
};

/**
 * Clear all storage
 */
export const clear = async (): Promise<void> => {
    try {
        if (isWeb && typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.clear();
            return;
        }
        await AsyncStorage.clear();
    } catch (error) {
        console.error('[Storage] clear error:', error);
    }
};

export default {
    getItem,
    setItem,
    removeItem,
    clear,
};
