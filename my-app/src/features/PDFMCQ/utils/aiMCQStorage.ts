/**
 * AI MCQ Generator Local Storage Manager
 * Uses IndexedDB for web and AsyncStorage for mobile
 * All data is stored locally on your device - no cloud storage
 */

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface MCQ {
    id: number;
    question: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: string;
    explanation: string;
}

export interface AIMCQSession {
    id: string;
    title: string;
    examType: string;
    paperType: string;
    difficulty: string;
    language: string;
    mcqs: MCQ[];
    userAnswers: { [key: number]: string };
    score: number;
    completed: boolean;
    createdAt: string;
    updatedAt: string;
}

const DB_NAME = 'UPSCMCQGeneratorDB';
const DB_VERSION = 1;
const STORE_NAME = 'mcq_sessions';
const ASYNC_STORAGE_KEY = '@ai_mcq_sessions';

// IndexedDB for Web
class IndexedDBStorage {
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        if (this.db) return;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                    store.createIndex('updatedAt', 'updatedAt', { unique: false });
                    store.createIndex('title', 'title', { unique: false });
                }
            };
        });
    }

    async getAll(): Promise<AIMCQSession[]> {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.getAll();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const results = request.result || [];
                results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
                resolve(results);
            };
        });
    }

    async get(id: string): Promise<AIMCQSession | null> {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(STORE_NAME, 'readonly');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get(id);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result || null);
        });
    }

    async save(session: AIMCQSession): Promise<void> {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.put(session);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async delete(id: string): Promise<void> {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.delete(id);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async clear(): Promise<void> {
        await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
            const store = transaction.objectStore(STORE_NAME);
            const request = store.clear();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }
}

// AsyncStorage for Mobile
class AsyncStorageWrapper {
    async getAll(): Promise<AIMCQSession[]> {
        try {
            const data = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
            if (!data) return [];
            const sessions = JSON.parse(data) as AIMCQSession[];
            return sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        } catch (error) {
            console.error('[MCQStorage] Failed to get sessions:', error);
            return [];
        }
    }

    async get(id: string): Promise<AIMCQSession | null> {
        const all = await this.getAll();
        return all.find(s => s.id === id) || null;
    }

    async save(session: AIMCQSession): Promise<void> {
        try {
            const all = await this.getAll();
            const index = all.findIndex(s => s.id === session.id);
            if (index >= 0) {
                all[index] = session;
            } else {
                all.unshift(session); // Add to beginning
            }
            // Limit to 100 sessions
            const trimmed = all.slice(0, 100);
            await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(trimmed));
        } catch (error) {
            console.error('[MCQStorage] Failed to save session:', error);
            throw error;
        }
    }

    async delete(id: string): Promise<void> {
        try {
            const all = await this.getAll();
            const filtered = all.filter(s => s.id !== id);
            await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(filtered));
        } catch (error) {
            console.error('[MCQStorage] Failed to delete session:', error);
            throw error;
        }
    }

    async clear(): Promise<void> {
        try {
            await AsyncStorage.removeItem(ASYNC_STORAGE_KEY);
        } catch (error) {
            console.error('[MCQStorage] Failed to clear sessions:', error);
            throw error;
        }
    }
}

// Export the appropriate storage based on platform
const storage = Platform.OS === 'web' ? new IndexedDBStorage() : new AsyncStorageWrapper();

// Helper to generate UUID
export const generateId = (): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `mcq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// API Functions
export const getAllMCQSessions = (): Promise<AIMCQSession[]> => storage.getAll();
export const getMCQSession = (id: string): Promise<AIMCQSession | null> => storage.get(id);
export const saveMCQSession = (session: AIMCQSession): Promise<void> => storage.save(session);
export const deleteMCQSession = (id: string): Promise<void> => storage.delete(id);
export const clearAllMCQSessions = (): Promise<void> => storage.clear();

// Create a new MCQ session
export const createMCQSession = (
    title: string,
    examType: string,
    paperType: string,
    difficulty: string,
    language: string,
    mcqs: MCQ[]
): AIMCQSession => {
    const now = new Date().toISOString();
    return {
        id: generateId(),
        title,
        examType,
        paperType,
        difficulty,
        language,
        mcqs,
        userAnswers: {},
        score: 0,
        completed: false,
        createdAt: now,
        updatedAt: now,
    };
};

// Update user answer
export const updateSessionAnswer = (
    session: AIMCQSession,
    questionIndex: number,
    answer: string
): AIMCQSession => {
    const updatedAnswers = { ...session.userAnswers, [questionIndex]: answer };
    const correct = session.mcqs.filter((mcq, i) => updatedAnswers[i] === mcq.correctAnswer).length;

    return {
        ...session,
        userAnswers: updatedAnswers,
        score: Math.round((correct / session.mcqs.length) * 100),
        updatedAt: new Date().toISOString(),
    };
};

// Mark session as completed
export const completeSession = (session: AIMCQSession): AIMCQSession => {
    return {
        ...session,
        completed: true,
        updatedAt: new Date().toISOString(),
    };
};

// Get session statistics
export const getSessionStats = (session: AIMCQSession) => {
    const total = session.mcqs.length;
    const answered = Object.keys(session.userAnswers).length;
    const correct = session.mcqs.filter((mcq, i) => session.userAnswers[i] === mcq.correctAnswer).length;

    return {
        total,
        answered,
        correct,
        wrong: answered - correct,
        unanswered: total - answered,
        percentage: total > 0 ? Math.round((correct / total) * 100) : 0,
    };
};

// Storage Info
export const getStorageInfo = (): { type: string; message: string } => {
    const isWeb = Platform.OS === 'web';
    return {
        type: isWeb ? 'IndexedDB' : 'AsyncStorage',
        message: isWeb
            ? '📱 All data is stored locally in your browser. Nothing is uploaded to any server.'
            : '📱 All data is stored locally on your device. Nothing is uploaded to any server.',
    };
};
