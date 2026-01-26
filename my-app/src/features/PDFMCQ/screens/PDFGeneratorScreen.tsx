/**
 * PDF MCQ Generator Screen
 * 
 * WORKFLOW:
 * 1. User picks a PDF file
 * 2. OpenRouter parses PDF and generates MCQs with GPT-5.1
 * 3. Display MCQs with interactive UI
 * 
 * Works on: Web, iOS, Android
 */

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Alert,
    TextInput,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useNavigation } from '@react-navigation/native';
// @ts-ignore
import { getMobileApiEndpoint } from '../../../config/api';
// @ts-ignore
import { useTheme } from '../../Reference/theme/ThemeContext';
// @ts-ignore
import { useWebStyles } from '../../../components/WebContainer';

// Conditionally import FileSystem only for native
let FileSystem: any = null;
if (Platform.OS !== 'web') {
    FileSystem = require('expo-file-system/legacy');
}

import { OPENROUTER_API_KEY } from '../../../utils/secureKey';
import { savePDFMCQSession, getAllPDFMCQSessions, PDFMCQSession } from '../utils/pdfMCQStorage';
import useCredits from '../../../hooks/useCredits';
import { supabase } from '../../../lib/supabase';

// ===================== CONFIGURATION =====================
const CONFIG = {
    OPENROUTER_API_KEY: OPENROUTER_API_KEY,
    OPENROUTER_URL: 'https://openrouter.ai/api/v1/chat/completions',
    // Gemini 3 Pro Preview
    AI_MODEL: 'google/gemini-3-flash-preview',
    // File size limits
    MAX_FILE_SIZE_MB: 20,
    MAX_TEXT_LENGTH: 200000,
};

// ===================== TYPES =====================
interface MCQ {
    id: number;
    question: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: string;
    explanation: string;
}

interface PickedFile {
    uri: string;
    name: string;
    size: number;
    mimeType: string;
    file?: File;  // Web only: actual File object
}

type ProcessStage = 'idle' | 'picking' | 'reading' | 'ocr' | 'generating' | 'parsing' | 'complete' | 'error';

// ===================== EXPORT UTILITIES =====================

// Export MCQs to CSV format
function exportToCSV(mcqs: MCQ[], selectedAnswers: Record<number, string>): void {
    const headers = ['Q.No', 'Question', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Your Answer', 'Result', 'Explanation'];

    const rows = mcqs.map((mcq, index) => {
        const userAnswer = selectedAnswers[mcq.id] || 'Not Answered';
        const isCorrect = userAnswer === mcq.correctAnswer ? 'Correct' : (userAnswer === 'Not Answered' ? 'Skipped' : 'Wrong');

        return [
            index + 1,
            `"${mcq.question.replace(/"/g, '""')}"`,
            `"${mcq.optionA.replace(/"/g, '""')}"`,
            `"${mcq.optionB.replace(/"/g, '""')}"`,
            `"${mcq.optionC.replace(/"/g, '""')}"`,
            `"${mcq.optionD.replace(/"/g, '""')}"`,
            mcq.correctAnswer,
            userAnswer,
            isCorrect,
            `"${mcq.explanation.replace(/"/g, '""')}"`
        ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadFile(csvContent, 'mcq-results.csv', 'text/csv');
}

// Export MCQs to XLSX (Excel) format - using XML spreadsheet format
function exportToXLSX(mcqs: MCQ[], selectedAnswers: Record<number, string>): void {
    // Create XML Spreadsheet (Excel 2003 XML format - widely compatible)
    const escapeXml = (str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    let xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="MCQ Results">
<Table>
<Row>
<Cell><Data ss:Type="String">Q.No</Data></Cell>
<Cell><Data ss:Type="String">Question</Data></Cell>
<Cell><Data ss:Type="String">Option A</Data></Cell>
<Cell><Data ss:Type="String">Option B</Data></Cell>
<Cell><Data ss:Type="String">Option C</Data></Cell>
<Cell><Data ss:Type="String">Option D</Data></Cell>
<Cell><Data ss:Type="String">Correct Answer</Data></Cell>
<Cell><Data ss:Type="String">Your Answer</Data></Cell>
<Cell><Data ss:Type="String">Result</Data></Cell>
<Cell><Data ss:Type="String">Explanation</Data></Cell>
</Row>`;

    mcqs.forEach((mcq, index) => {
        const userAnswer = selectedAnswers[mcq.id] || 'Not Answered';
        const isCorrect = userAnswer === mcq.correctAnswer ? 'Correct' : (userAnswer === 'Not Answered' ? 'Skipped' : 'Wrong');

        xmlContent += `
<Row>
<Cell><Data ss:Type="Number">${index + 1}</Data></Cell>
<Cell><Data ss:Type="String">${escapeXml(mcq.question)}</Data></Cell>
<Cell><Data ss:Type="String">${escapeXml(mcq.optionA)}</Data></Cell>
<Cell><Data ss:Type="String">${escapeXml(mcq.optionB)}</Data></Cell>
<Cell><Data ss:Type="String">${escapeXml(mcq.optionC)}</Data></Cell>
<Cell><Data ss:Type="String">${escapeXml(mcq.optionD)}</Data></Cell>
<Cell><Data ss:Type="String">${mcq.correctAnswer}</Data></Cell>
<Cell><Data ss:Type="String">${userAnswer}</Data></Cell>
<Cell><Data ss:Type="String">${isCorrect}</Data></Cell>
<Cell><Data ss:Type="String">${escapeXml(mcq.explanation)}</Data></Cell>
</Row>`;
    });

    xmlContent += `
</Table>
</Worksheet>
</Workbook>`;

    downloadFile(xmlContent, 'mcq-results.xls', 'application/vnd.ms-excel');
}

// Export MCQs to PDF Report
function exportToPDF(mcqs: MCQ[], selectedAnswers: Record<number, string>): void {
    // Calculate score
    let correct = 0;
    let answered = 0;
    mcqs.forEach(mcq => {
        if (selectedAnswers[mcq.id]) {
            answered++;
            if (selectedAnswers[mcq.id] === mcq.correctAnswer) correct++;
        }
    });

    const scorePercent = answered > 0 ? Math.round((correct / answered) * 100) : 0;

    // Generate HTML for PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>MCQ Results Report</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
        h1 { color: #1a1a1a; text-align: center; border-bottom: 2px solid #4F46E5; padding-bottom: 10px; }
        .summary { background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center; }
        .summary h2 { margin: 0; color: #0369a1; }
        .score { font-size: 32px; font-weight: bold; color: ${scorePercent >= 70 ? '#10B981' : scorePercent >= 40 ? '#F59E0B' : '#EF4444'}; }
        .mcq { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 15px 0; }
        .question { font-weight: bold; font-size: 14px; margin-bottom: 10px; }
        .options { margin: 10px 0; }
        .option { padding: 5px 10px; margin: 3px 0; border-radius: 4px; }
        .correct { background: #d1fae5; border-left: 3px solid #10B981; }
        .wrong { background: #fee2e2; border-left: 3px solid #EF4444; }
        .explanation { background: #f3f4f6; padding: 10px; border-radius: 4px; font-size: 12px; margin-top: 10px; }
        .result-tag { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; }
        .result-correct { background: #10B981; color: white; }
        .result-wrong { background: #EF4444; color: white; }
        .result-skipped { background: #9CA3AF; color: white; }
        @media print { body { padding: 0; } .mcq { page-break-inside: avoid; } }
    </style>
</head>
<body>
    <h1>📝 MCQ Results Report</h1>
    
    <div class="summary">
        <h2>Your Score</h2>
        <div class="score">${scorePercent}%</div>
        <p>${correct} correct out of ${answered} answered (${mcqs.length} total questions)</p>
    </div>
    
    ${mcqs.map((mcq, index) => {
        const userAnswer = selectedAnswers[mcq.id];
        const isCorrect = userAnswer === mcq.correctAnswer;
        const resultClass = !userAnswer ? 'result-skipped' : isCorrect ? 'result-correct' : 'result-wrong';
        const resultText = !userAnswer ? 'Skipped' : isCorrect ? 'Correct' : 'Wrong';

        return `
    <div class="mcq">
        <div class="question">
            Q${index + 1}. ${mcq.question}
            <span class="result-tag ${resultClass}">${resultText}</span>
        </div>
        <div class="options">
            ${['A', 'B', 'C', 'D'].map(opt => {
            const optText = mcq[`option${opt}` as keyof MCQ];
            const isCorrectOpt = mcq.correctAnswer === opt;
            const isUserAnswer = userAnswer === opt;
            let optClass = '';
            if (isCorrectOpt) optClass = 'correct';
            else if (isUserAnswer && !isCorrect) optClass = 'wrong';
            return `<div class="option ${optClass}">${opt}. ${optText} ${isCorrectOpt ? '✓' : ''}</div>`;
        }).join('')}
        </div>
        <div class="explanation"><strong>Explanation:</strong> ${mcq.explanation}</div>
    </div>`;
    }).join('')}
    
    <p style="text-align: center; color: #9CA3AF; margin-top: 30px;">Generated by UPSC MCQ Generator</p>
</body>
</html>`;

    // Open in new window for printing/saving as PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
    }
}

// Helper function to download files (Web only)
function downloadFile(content: string, filename: string, mimeType: string): void {
    if (Platform.OS !== 'web') {
        Alert.alert('Export', 'Export is only available on web platform');
        return;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ===================== STEP 1: Pick File (Web + Native) =====================
async function pickFile(): Promise<{
    success: boolean;
    file?: PickedFile;
    error?: string;
    canceled?: boolean;
}> {
    try {
        console.log('[PDF-MCQ] Step 1: Picking file... Platform:', Platform.OS);

        const result = await DocumentPicker.getDocumentAsync({
            type: ['application/pdf', 'image/*'],
            copyToCacheDirectory: true,
        });

        if (result.canceled) {
            console.log('[PDF-MCQ] User canceled file picker');
            return { success: false, canceled: true };
        }

        const asset = result.assets[0];
        console.log('[PDF-MCQ] File selected:', asset.name, 'Size:', asset.size, 'bytes');

        // On web, asset.file contains the actual File object
        return {
            success: true,
            file: {
                uri: asset.uri,
                name: asset.name || 'document.pdf',
                size: asset.size || 0,
                mimeType: asset.mimeType || 'application/pdf',
                file: (asset as any).file,  // Web: File object
            },
        };
    } catch (error: any) {
        console.error('[PDF-MCQ] File pick error:', error);
        return { success: false, error: error.message || 'Failed to pick file' };
    }
}

// ===================== STEP 2: Read File as Base64 (Web + Native) =====================
async function readFileAsBase64(pickedFile: PickedFile): Promise<string> {
    console.log('[PDF-MCQ] Step 2: Reading file as base64... Platform:', Platform.OS);

    if (Platform.OS === 'web') {
        // WEB: Use FileReader API
        return new Promise((resolve, reject) => {
            // Get the file from various possible sources
            let file: File | Blob | null = pickedFile.file || null;

            if (!file && pickedFile.uri.startsWith('blob:')) {
                // Fetch the blob from URI
                fetch(pickedFile.uri)
                    .then(res => res.blob())
                    .then(blob => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            const result = reader.result as string;
                            // Remove data URL prefix to get pure base64
                            const base64 = result.split(',')[1] || result;
                            console.log('[PDF-MCQ] Web: File read, base64 length:', base64.length);
                            resolve(base64);
                        };
                        reader.onerror = () => reject(new Error('Failed to read file'));
                        reader.readAsDataURL(blob);
                    })
                    .catch(reject);
                return;
            }

            if (!file) {
                reject(new Error('No file object available on web'));
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                const result = reader.result as string;
                // Remove data URL prefix to get pure base64
                const base64 = result.split(',')[1] || result;
                console.log('[PDF-MCQ] Web: File read, base64 length:', base64.length);
                resolve(base64);
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    } else {
        // NATIVE: Use expo-file-system
        if (!FileSystem) {
            throw new Error('FileSystem not available');
        }
        const base64 = await FileSystem.readAsStringAsync(pickedFile.uri, {
            encoding: 'base64',
        });
        console.log('[PDF-MCQ] Native: File read, base64 length:', base64.length);
        return base64;
    }
}

// ===================== STEP 3: Generate MCQs using Parallel Batch Processing =====================
// SCALABILITY: Designed to handle 10,000+ concurrent users
// SPEED OPTIMIZED: Target <15-20 seconds for 100 MCQs

// Configuration for batch processing - OPTIMIZED FOR MAXIMUM SPEED
const BATCH_CONFIG = {
    BATCH_SIZE: 25,           // MCQs per batch (increased for fewer API calls)
    MAX_PARALLEL: 8,          // Maximum concurrent API calls (aggressive parallelism)
    RETRY_COUNT: 2,           // Fewer retries for speed
    BASE_DELAY_MS: 50,        // Minimal delay between requests
    MAX_DELAY_MS: 2000,       // Lower max delay for faster recovery
    RATE_LIMIT_BACKOFF: 1.5,  // Gentler backoff
    CIRCUIT_BREAKER_THRESHOLD: 5, // More tolerance before circuit break
    REQUEST_TIMEOUT_MS: 45000, // 45 second timeout (faster fail)
};

// Rate limiter state (per session)
let rateLimitState = {
    consecutiveFailures: 0,
    lastRequestTime: 0,
    currentDelay: BATCH_CONFIG.BASE_DELAY_MS,
    circuitOpen: false,
    circuitResetTime: 0,
};

// Reset rate limiter state
function resetRateLimiter(): void {
    rateLimitState = {
        consecutiveFailures: 0,
        lastRequestTime: 0,
        currentDelay: BATCH_CONFIG.BASE_DELAY_MS,
        circuitOpen: false,
        circuitResetTime: 0,
    };
}

// Delay function with jitter for preventing thundering herd
async function delayWithJitter(baseMs: number): Promise<void> {
    const jitter = Math.random() * baseMs * 0.3; // 0-30% jitter
    await new Promise(r => setTimeout(r, baseMs + jitter));
}

// Check and handle rate limiting
async function handleRateLimit(): Promise<boolean> {
    // Check circuit breaker
    if (rateLimitState.circuitOpen) {
        if (Date.now() < rateLimitState.circuitResetTime) {
            console.log('[PDF-MCQ] Circuit breaker open, waiting...');
            await delayWithJitter(rateLimitState.circuitResetTime - Date.now());
        }
        rateLimitState.circuitOpen = false;
    }

    // Enforce minimum delay between requests
    const timeSinceLastRequest = Date.now() - rateLimitState.lastRequestTime;
    if (timeSinceLastRequest < rateLimitState.currentDelay) {
        await delayWithJitter(rateLimitState.currentDelay - timeSinceLastRequest);
    }

    rateLimitState.lastRequestTime = Date.now();
    return true;
}

// Record request result for adaptive rate limiting
function recordRequestResult(success: boolean, wasRateLimited: boolean): void {
    if (success) {
        rateLimitState.consecutiveFailures = 0;
        // Gradually reduce delay on success
        rateLimitState.currentDelay = Math.max(
            BATCH_CONFIG.BASE_DELAY_MS,
            rateLimitState.currentDelay * 0.8
        );
    } else {
        rateLimitState.consecutiveFailures++;

        if (wasRateLimited) {
            // Exponential backoff on rate limit
            rateLimitState.currentDelay = Math.min(
                BATCH_CONFIG.MAX_DELAY_MS,
                rateLimitState.currentDelay * BATCH_CONFIG.RATE_LIMIT_BACKOFF
            );
        }

        // Circuit breaker
        if (rateLimitState.consecutiveFailures >= BATCH_CONFIG.CIRCUIT_BREAKER_THRESHOLD) {
            rateLimitState.circuitOpen = true;
            rateLimitState.circuitResetTime = Date.now() + 10000; // 10 second reset
            console.log('[PDF-MCQ] Circuit breaker tripped, cooling down for 10s');
        }
    }
}

// Fetch with timeout wrapper
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        return response;
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timeout');
        }
        throw error;
    }
}

// Robust JSON repair function
function repairJSON(jsonString: string): string {
    let cleaned = jsonString
        // Remove markdown code blocks
        .replace(/```(?:json)?\s*/gi, '')
        .replace(/```\s*/gi, '')
        // Fix common issues
        .replace(/,\s*]/g, ']')  // Remove trailing commas before ]
        .replace(/,\s*}/g, '}')  // Remove trailing commas before }
        .replace(/\n/g, ' ')     // Replace newlines with spaces
        .replace(/\r/g, '')      // Remove carriage returns
        .replace(/\t/g, ' ')     // Replace tabs with spaces
        .replace(/\\n/g, ' ')    // Replace escaped newlines
        .replace(/\\"/g, '"')    // Fix double-escaped quotes
        .replace(/"{/g, '{')     // Fix quote before brace
        .replace(/}"/g, '}')     // Fix quote after brace
        .replace(/"\[/g, '[')    // Fix quote before bracket
        .replace(/\]"/g, ']')    // Fix quote after bracket
        .trim();

    // Try to extract just the JSON object/array
    const startBrace = cleaned.indexOf('{');
    const startBracket = cleaned.indexOf('[');

    if (startBrace !== -1 && (startBracket === -1 || startBrace < startBracket)) {
        // Object starts first - find matching close brace
        let depth = 0;
        let endIndex = -1;
        for (let i = startBrace; i < cleaned.length; i++) {
            if (cleaned[i] === '{') depth++;
            if (cleaned[i] === '}') depth--;
            if (depth === 0) {
                endIndex = i;
                break;
            }
        }
        if (endIndex !== -1) {
            cleaned = cleaned.substring(startBrace, endIndex + 1);
        }
    }

    return cleaned;
}

// Parse MCQs from AI response with multiple fallback strategies
function parseMCQsFromResponse(content: string): MCQ[] {
    console.log('[PDF-MCQ] Parsing response, length:', content.length);

    // Strategy 1: Direct JSON parse
    try {
        const parsed = JSON.parse(content);
        if (parsed?.mcqs?.length) {
            return parsed.mcqs.map((m: any, i: number) => ({
                id: i + 1,
                question: m.question || '',
                optionA: m.optionA || m.option_a || m.options?.A || '',
                optionB: m.optionB || m.option_b || m.options?.B || '',
                optionC: m.optionC || m.option_c || m.options?.C || '',
                optionD: m.optionD || m.option_d || m.options?.D || '',
                correctAnswer: (m.correctAnswer || m.correct_answer || m.answer || 'A').toString().toUpperCase().charAt(0),
                explanation: m.explanation || ''
            }));
        }
    } catch (e) { }

    // Strategy 2: Repair JSON and parse
    try {
        const repaired = repairJSON(content);
        const parsed = JSON.parse(repaired);
        if (parsed?.mcqs?.length) {
            return parsed.mcqs.map((m: any, i: number) => ({
                id: i + 1,
                question: m.question || '',
                optionA: m.optionA || m.option_a || '',
                optionB: m.optionB || m.option_b || '',
                optionC: m.optionC || m.option_c || '',
                optionD: m.optionD || m.option_d || '',
                correctAnswer: (m.correctAnswer || m.correct_answer || 'A').toString().toUpperCase().charAt(0),
                explanation: m.explanation || ''
            }));
        }
    } catch (e) { }

    // Strategy 3: Extract from code block
    try {
        const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (codeBlockMatch) {
            const repaired = repairJSON(codeBlockMatch[1]);
            const parsed = JSON.parse(repaired);
            if (parsed?.mcqs?.length) {
                return parsed.mcqs.map((m: any, i: number) => ({
                    id: i + 1,
                    question: m.question || '',
                    optionA: m.optionA || m.option_a || '',
                    optionB: m.optionB || m.option_b || '',
                    optionC: m.optionC || m.option_c || '',
                    optionD: m.optionD || m.option_d || '',
                    correctAnswer: (m.correctAnswer || m.correct_answer || 'A').toString().toUpperCase().charAt(0),
                    explanation: m.explanation || ''
                }));
            }
        }
    } catch (e) { }

    // Strategy 4: Extract individual MCQ objects using regex
    try {
        const mcqObjects: MCQ[] = [];
        const regex = /\{[^{}]*"question"\s*:\s*"[^"]+?"[^{}]*\}/g;
        const matches = content.match(regex) || [];

        for (const match of matches) {
            try {
                const obj = JSON.parse(repairJSON(match));
                mcqObjects.push({
                    id: mcqObjects.length + 1,
                    question: obj.question || '',
                    optionA: obj.optionA || obj.option_a || '',
                    optionB: obj.optionB || obj.option_b || '',
                    optionC: obj.optionC || obj.option_c || '',
                    optionD: obj.optionD || obj.option_d || '',
                    correctAnswer: (obj.correctAnswer || obj.correct_answer || 'A').toString().toUpperCase().charAt(0),
                    explanation: obj.explanation || ''
                });
            } catch (e) { }
        }

        if (mcqObjects.length > 0) {
            console.log('[PDF-MCQ] Extracted', mcqObjects.length, 'MCQs via regex');
            return mcqObjects;
        }
    } catch (e) { }

    // Strategy 5: Fallback to text parsing
    console.log('[PDF-MCQ] Using text parser as fallback');
    return parseMCQResponse(content);
}

// Generate a single batch of MCQs with rate limiting
async function generateBatch(base64Data: string, mimeType: string, batchNum: number, batchSize: number, totalCount: number): Promise<MCQ[]> {
    // Handle rate limiting before making request
    await handleRateLimit();

    const prompt = `You are an expert UPSC question creator. Analyze the PDF and create EXACTLY ${batchSize} MCQs.

This is batch ${batchNum} of ${Math.ceil(totalCount / batchSize)}. Generate questions ${((batchNum - 1) * batchSize) + 1} to ${Math.min(batchNum * batchSize, totalCount)}.

REQUIREMENTS:
- Create EXACTLY ${batchSize} MCQs from the document
- Each question tests understanding, not memorization
- 4 options (A, B, C, D) per question
- One correct answer per question
- Brief explanation for each

RESPOND WITH VALID JSON ONLY:
{"mcqs":[{"question":"...","optionA":"...","optionB":"...","optionC":"...","optionD":"...","correctAnswer":"A","explanation":"..."}]}

Generate ${batchSize} MCQs now:`;

    const messages = [{
        role: 'user',
        content: [
            { type: 'text', text: prompt },
            {
                type: 'image_url',
                image_url: { url: `data:${mimeType};base64,${base64Data}` }
            }
        ]
    }];

    try {
        const response = await fetchWithTimeout(
            CONFIG.OPENROUTER_URL,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${CONFIG.OPENROUTER_API_KEY}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': 'https://upsc-prep.app',
                    'X-Title': 'UPSC PDF MCQ Generator',
                },
                body: JSON.stringify({
                    model: CONFIG.AI_MODEL,
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 4096,
                }),
            },
            BATCH_CONFIG.REQUEST_TIMEOUT_MS
        );

        const wasRateLimited = response.status === 429;

        if (!response.ok) {
            recordRequestResult(false, wasRateLimited);
            throw new Error(`Batch ${batchNum} API Error: ${response.status}${wasRateLimited ? ' (Rate Limited)' : ''}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            recordRequestResult(false, false);
            throw new Error(`Batch ${batchNum}: No content`);
        }

        recordRequestResult(true, false);
        return parseMCQsFromResponse(content);

    } catch (error: any) {
        const wasRateLimited = error.message?.includes('429') || error.message?.includes('Rate');
        recordRequestResult(false, wasRateLimited);
        throw error;
    }
}

// Process batches with retry logic and exponential backoff
async function processBatchWithRetry(base64Data: string, mimeType: string, batchNum: number, batchSize: number, totalCount: number): Promise<MCQ[]> {
    for (let attempt = 1; attempt <= BATCH_CONFIG.RETRY_COUNT + 1; attempt++) {
        try {
            const result = await generateBatch(base64Data, mimeType, batchNum, batchSize, totalCount);
            console.log(`[PDF-MCQ] Batch ${batchNum} succeeded with ${result.length} MCQs`);
            return result;
        } catch (error: any) {
            console.warn(`[PDF-MCQ] Batch ${batchNum} attempt ${attempt} failed:`, error.message);

            if (attempt > BATCH_CONFIG.RETRY_COUNT) {
                console.error(`[PDF-MCQ] Batch ${batchNum} failed after ${BATCH_CONFIG.RETRY_COUNT + 1} attempts`);
                return []; // Return empty on final failure
            }

            // Exponential backoff with jitter
            const backoffMs = Math.min(
                BATCH_CONFIG.MAX_DELAY_MS,
                BATCH_CONFIG.BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 500
            );
            console.log(`[PDF-MCQ] Retrying batch ${batchNum} in ${backoffMs}ms...`);
            await new Promise(r => setTimeout(r, backoffMs));
        }
    }
    return [];
}

// Main parallel batch processing function
async function generateMCQsFromPDF(base64Data: string, fileName: string, mimeType: string, count: number): Promise<MCQ[]> {
    console.log('[PDF-MCQ] Starting parallel batch generation...');
    console.log('[PDF-MCQ] File:', fileName, 'Type:', mimeType, 'Count:', count);

    if (!CONFIG.OPENROUTER_API_KEY || CONFIG.OPENROUTER_API_KEY.length < 10) {
        throw new Error('API key not configured');
    }

    // Reset rate limiter for fresh session
    resetRateLimiter();

    const startTime = Date.now();

    // For small counts, use single request
    if (count <= 20) {
        const prompt = `You are an expert UPSC question creator. Analyze this PDF and create EXACTLY ${count} MCQs.

REQUIREMENTS:
- Create EXACTLY ${count} MCQs from the document content
- 4 options (A, B, C, D) per question
- One correct answer per question
- Brief explanation for each

RESPOND WITH VALID JSON ONLY:
{"mcqs":[{"question":"...","optionA":"...","optionB":"...","optionC":"...","optionD":"...","correctAnswer":"A","explanation":"..."}]}`;

        const messages = [{
            role: 'user',
            content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Data}` } }
            ]
        }];

        const response = await fetch(CONFIG.OPENROUTER_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CONFIG.OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://upsc-prep.app',
                'X-Title': 'UPSC PDF MCQ Generator',
            },
            body: JSON.stringify({
                model: CONFIG.AI_MODEL,
                messages: messages,
                temperature: 0.7,
                max_tokens: 8192,
            }),
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            throw new Error('No content in response');
        }

        const mcqs = parseMCQsFromResponse(content);
        console.log(`[PDF-MCQ] Generated ${mcqs.length} MCQs in ${(Date.now() - startTime) / 1000}s`);
        return mcqs;
    }

    // For large counts, use parallel batch processing
    const batchSize = BATCH_CONFIG.BATCH_SIZE;
    const totalBatches = Math.ceil(count / batchSize);

    console.log(`[PDF-MCQ] Processing ${totalBatches} batches of ${batchSize} MCQs each`);

    const allMCQs: MCQ[] = [];

    // Process batches in parallel groups
    for (let groupStart = 0; groupStart < totalBatches; groupStart += BATCH_CONFIG.MAX_PARALLEL) {
        const groupEnd = Math.min(groupStart + BATCH_CONFIG.MAX_PARALLEL, totalBatches);
        const batchPromises: Promise<MCQ[]>[] = [];

        for (let batchNum = groupStart + 1; batchNum <= groupEnd; batchNum++) {
            const thisBatchSize = Math.min(batchSize, count - (batchNum - 1) * batchSize);
            batchPromises.push(
                processBatchWithRetry(base64Data, mimeType, batchNum, thisBatchSize, count)
            );
        }

        console.log(`[PDF-MCQ] Processing batch group ${groupStart + 1}-${groupEnd} (${batchPromises.length} parallel requests)`);

        const batchResults = await Promise.all(batchPromises);

        // Merge results and assign sequential IDs
        for (const batchMCQs of batchResults) {
            for (const mcq of batchMCQs) {
                allMCQs.push({
                    ...mcq,
                    id: allMCQs.length + 1
                });
            }
        }

        console.log(`[PDF-MCQ] Total MCQs so far: ${allMCQs.length}`);
    }

    const elapsed = (Date.now() - startTime) / 1000;
    console.log(`[PDF-MCQ] ✅ Generated ${allMCQs.length} MCQs in ${elapsed.toFixed(1)}s`);

    return allMCQs;
}

// ===================== STEP 4: Generate MCQs from text (fallback) =====================
async function generateMCQsWithAI(text: string, count: number): Promise<MCQ[]> {
    console.log('[PDF-MCQ] Generating', count, 'MCQs from text...');

    const truncatedText = text.substring(0, CONFIG.MAX_TEXT_LENGTH);

    const prompt = `You are an expert UPSC exam question creator. Create EXACTLY ${count} Multiple Choice Questions (MCQs) from this content.

CONTENT TO ANALYZE:
${truncatedText}

REQUIREMENTS:
1. Create EXACTLY ${count} MCQs - no more, no less
2. Each question should be challenging and test understanding
3. 4 options per question (A, B, C, D)
4. Only ONE correct answer per question
5. Include brief explanation for each answer

OUTPUT FORMAT (follow EXACTLY for each question):

Question 1: [Question text]
A. [Option A text]
B. [Option B text]
C. [Option C text]
D. [Option D text]
Correct Answer: [Single letter: A, B, C, or D]
Explanation: [Brief explanation]

START GENERATING ${count} MCQs NOW:`;

    const response = await fetch(CONFIG.OPENROUTER_URL, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${CONFIG.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://upsc-prep-app.com',
            'X-Title': 'UPSC Prep App',
        },
        body: JSON.stringify({
            model: CONFIG.AI_MODEL,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: Math.min(16000, count * 500),
            temperature: 0.7,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('[PDF-MCQ] AI API Error:', response.status, errorText);
        throw new Error(`AI Error: ${response.status}. Please try again.`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
        throw new Error('AI returned empty response. Please try again.');
    }

    console.log('[PDF-MCQ] AI response length:', content.length);

    // Parse the response
    const mcqs = parseMCQResponse(content);
    console.log('[PDF-MCQ] Successfully parsed', mcqs.length, 'MCQs');

    return mcqs;
}

// ===================== STEP 5: Parse AI Response =====================
function parseMCQResponse(content: string): MCQ[] {
    console.log('[PDF-MCQ] Step 5: Parsing MCQ response...');

    const mcqs: MCQ[] = [];

    // Split by "Question X:" pattern
    const parts = content.split(/Question\s+(\d+)\s*:/gi);

    for (let i = 1; i < parts.length; i += 2) {
        const questionNum = parseInt(parts[i]);
        const questionContent = parts[i + 1];

        if (!questionContent || questionContent.length < 50) continue;

        try {
            // Extract the question text (before A.)
            const questionMatch = questionContent.match(/^([\s\S]+?)(?=\n\s*A\.)/i);
            const question = questionMatch ? questionMatch[1].trim() : '';

            if (!question || question.length < 10) continue;

            // Extract options - be more flexible with the regex
            const optionA = extractOption(questionContent, 'A', 'B');
            const optionB = extractOption(questionContent, 'B', 'C');
            const optionC = extractOption(questionContent, 'C', 'D');
            const optionD = extractOption(questionContent, 'D', 'Correct');

            if (!optionA || !optionB || !optionC || !optionD) {
                console.log('[PDF-MCQ] Skipping question', questionNum, '- missing options');
                continue;
            }

            // Extract correct answer
            const correctMatch = questionContent.match(/Correct\s*Answer\s*[:\s]*([A-D])/i);
            const correctAnswer = correctMatch ? correctMatch[1].toUpperCase() : 'A';

            // Extract explanation
            const explanationMatch = questionContent.match(/Explanation\s*[:\s]*([\s\S]+?)(?=\n\s*$|$)/i);
            const explanation = explanationMatch ? explanationMatch[1].trim() :
                `The correct answer is ${correctAnswer}.`;

            mcqs.push({
                id: questionNum,
                question,
                optionA,
                optionB,
                optionC,
                optionD,
                correctAnswer,
                explanation,
            });

        } catch (e) {
            console.warn('[PDF-MCQ] Failed to parse question', questionNum);
        }
    }

    return mcqs;
}

function extractOption(content: string, letter: string, nextLetter: string): string {
    // Try multiple patterns
    const patterns = [
        new RegExp(`${letter}\\.\\s*([\\s\\S]+?)(?=\\n\\s*${nextLetter}\\.)`, 'i'),
        new RegExp(`${letter}\\.\\s*(.+?)(?=\\n)`, 'i'),
    ];

    for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
            return match[1].trim();
        }
    }

    // Fallback: try to find the option on a single line
    const lines = content.split('\n');
    for (const line of lines) {
        if (line.trim().match(new RegExp(`^${letter}\\.`, 'i'))) {
            return line.replace(new RegExp(`^${letter}\\.\\s*`, 'i'), '').trim();
        }
    }

    return '';
}

// ===================== MAIN COMPONENT =====================
export default function PDFGeneratorScreen() {
    const { theme, isDark } = useTheme();
    const { horizontalPadding } = useWebStyles();
    const navigation = useNavigation<any>();

    // Credit checking (5 credits for PDF MCQ)
    const { credits, hasEnoughCredits, useCredits: deductCredits } = useCredits();

    // State
    const [stage, setStage] = useState<ProcessStage>('idle');
    const [statusMessage, setStatusMessage] = useState('');
    const [progress, setProgress] = useState(0);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [mcqs, setMcqs] = useState<MCQ[]>([]);
    const [mcqCount, setMcqCount] = useState('10');
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
    const [showResults, setShowResults] = useState<Record<number, boolean>>({});
    const [errorMessage, setErrorMessage] = useState('');
    const [currentSession, setCurrentSession] = useState<PDFMCQSession | null>(null);

    // Timer
    const timerRef = useRef<any>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [pdfHistory, setPdfHistory] = useState<any[]>([]);
    const [hasSavedCurrentTest, setHasSavedCurrentTest] = useState(false);

    // Storage key for PDF test scores
    const PDF_SCORES_KEY = 'pdf_mcq_test_scores';

    // Load history from AsyncStorage on mount
    useEffect(() => {
        const loadHistory = async () => {
            try {
                const AsyncStorage = require('@react-native-async-storage/async-storage').default;
                const stored = await AsyncStorage.getItem(PDF_SCORES_KEY);
                if (stored) {
                    const scores = JSON.parse(stored);
                    setPdfHistory(scores);
                }
            } catch (e) {
                console.log('Error loading history:', e);
            }
        };
        loadHistory();
    }, []);

    // Save score to AsyncStorage
    const handleSaveScore = async () => {
        const { correct, answered } = getScore();

        if (answered === 0) {
            Alert.alert('No Answers', 'Please answer some questions before saving.');
            return;
        }

        setIsSaving(true);
        try {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;

            // Get PDF filename
            let fileName = 'PDF Practice';
            if (statusMessage.includes('Selected:')) {
                const match = statusMessage.match(/Selected:\s*(.*?)\s*\(/);
                if (match && match[1]) fileName = match[1];
            } else if (currentSession && currentSession.pdfName) {
                fileName = currentSession.pdfName;
            }

            const percentage = (correct / answered) * 100;

            // Create new score entry
            const newScore = {
                id: Date.now().toString(),
                file_name: fileName,
                total_questions: mcqs.length,
                correct_answers: correct,
                score_percentage: percentage,
                created_at: new Date().toISOString()
            };

            // Get existing scores
            const stored = await AsyncStorage.getItem(PDF_SCORES_KEY);
            let scores = stored ? JSON.parse(stored) : [];

            // Add new score at the beginning
            scores = [newScore, ...scores].slice(0, 50); // Keep max 50 entries

            // Save to AsyncStorage
            await AsyncStorage.setItem(PDF_SCORES_KEY, JSON.stringify(scores));

            // Update state
            setPdfHistory(scores);

            Alert.alert('Success', 'Your score has been saved locally!');
        } catch (error: any) {
            console.error('Save error:', error);
            Alert.alert('Error', 'Failed to save score. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    // Auto-save when all questions are answered
    useEffect(() => {
        const { answered } = getScore();
        if (mcqs.length > 0 && answered === mcqs.length && !hasSavedCurrentTest && !isSaving) {
            setHasSavedCurrentTest(true);
            handleSaveScore();
        }
    }, [showResults, mcqs.length, hasSavedCurrentTest, isSaving]);

    useEffect(() => {
        if (stage !== 'idle' && stage !== 'complete' && stage !== 'error') {
            timerRef.current = setInterval(() => {
                setElapsedSeconds(prev => prev + 1);
            }, 1000);
        } else {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [stage]);

    // ===================== MAIN PROCESS =====================
    const startProcess = async () => {
        // Check credits first (5 credits for PDF MCQ)
        if (!hasEnoughCredits('pdf_mcq')) {
            Alert.alert(
                '💳 Credits Required',
                `PDF MCQ generation costs 5 credits.\n\nYou have ${credits} credits available.\n\nBuy credits to continue.`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Buy Credits', onPress: () => navigation.navigate('Billing') }
                ]
            );
            return;
        }

        const count = Math.min(1000, Math.max(1, parseInt(mcqCount) || 10));
        // With speed-optimized parallel processing: 8 batches of 25 MCQs = 200 MCQs per parallel round
        // ~5-7 seconds per round, so 100 MCQs in ~10s, 200 in ~15s
        const estimatedTime = count <= 25 ? 8 : Math.max(10, Math.ceil(count / 200) * 7 + 5);

        try {
            // Deduct credits before starting
            const success = await deductCredits('pdf_mcq');
            if (!success) return;

            // Reset state
            setMcqs([]);
            setSelectedAnswers({});
            setShowResults({});
            setElapsedSeconds(0);
            setErrorMessage('');
            setHasSavedCurrentTest(false);

            // STEP 1: Pick file
            setStage('picking');
            setProgress(5);
            setStatusMessage('📁 Select a PDF file...');

            const fileResult = await pickFile();

            if (fileResult.canceled) {
                setStage('idle');
                return;
            }

            if (!fileResult.success || !fileResult.file) {
                throw new Error(fileResult.error || 'Failed to select file');
            }

            const pickedFile = fileResult.file;
            const fileSizeMB = pickedFile.size / (1024 * 1024);

            // Check file size
            if (fileSizeMB > CONFIG.MAX_FILE_SIZE_MB) {
                throw new Error(
                    `File too large (${fileSizeMB.toFixed(1)}MB). Maximum: ${CONFIG.MAX_FILE_SIZE_MB}MB`
                );
            }

            setStatusMessage(`📄 Selected: ${pickedFile.name} (${fileSizeMB.toFixed(1)}MB)`);
            setProgress(10);

            // STEP 2: Read file
            setStage('reading');
            setStatusMessage('📖 Reading file...');
            setProgress(15);

            const base64Data = await readFileAsBase64(pickedFile);

            if (!base64Data || base64Data.length === 0) {
                throw new Error('Failed to read file. Please try again.');
            }

            console.log('[PDF-MCQ] File read, base64 length:', base64Data.length);
            setProgress(25);

            // STEP 3: Generate MCQs directly from PDF using OpenRouter
            // OpenRouter has native PDF parsing - no need for separate OCR!
            setStage('generating');
            setStatusMessage(`🤖 AI analyzing PDF and generating ${count} MCQs...`);
            setProgress(40);

            const generatedMcqs = await generateMCQsFromPDF(
                base64Data,
                pickedFile.name,
                pickedFile.mimeType,
                count
            );

            // STEP 4: Done
            setStage('parsing');
            setProgress(90);
            setStatusMessage('✨ Processing complete!');

            if (generatedMcqs.length === 0) {
                throw new Error('Could not generate MCQs. Please try a different PDF.');
            }

            // Success!
            setMcqs(generatedMcqs);
            setProgress(100);
            setStage('complete');
            setStatusMessage(`✅ Generated ${generatedMcqs.length} MCQs in ${elapsedSeconds}s`);

            // Save to local storage
            try {
                const session = await savePDFMCQSession(
                    pickedFile.name,
                    generatedMcqs.map((mcq, idx) => ({
                        question: mcq.question,
                        optionA: mcq.optionA,
                        optionB: mcq.optionB,
                        optionC: mcq.optionC,
                        optionD: mcq.optionD,
                        correctAnswer: mcq.correctAnswer,
                        explanation: mcq.explanation,
                    }))
                );
                setCurrentSession(session);
                console.log('[PDF-MCQ] Session saved locally:', session.id);
            } catch (saveError) {
                console.warn('[PDF-MCQ] Failed to save to local storage:', saveError);
            }

            Alert.alert(
                '🎉 Success!',
                `Generated ${generatedMcqs.length} MCQs in ${elapsedSeconds} seconds!\n\nAll data is saved locally on your device.`
            );

        } catch (error: any) {
            console.error('[PDF-MCQ] Error:', error);
            setStage('error');
            setErrorMessage(error.message || 'Something went wrong');
            setStatusMessage(`❌ ${error.message || 'Error occurred'}`);
            Alert.alert('Error', error.message || 'Failed to process PDF');
        }
    };

    const handleOptionSelect = (mcqId: number, option: string) => {
        if (showResults[mcqId]) return;
        setSelectedAnswers(prev => ({ ...prev, [mcqId]: option }));
        setShowResults(prev => ({ ...prev, [mcqId]: true }));
    };

    const handleReset = () => {
        setStage('idle');
        setMcqs([]);
        setSelectedAnswers({});
        setShowResults({});
        setProgress(0);
        setElapsedSeconds(0);
        setErrorMessage('');
        setStatusMessage('');
    };

    const getScore = () => {
        let correct = 0;
        let answered = 0;
        mcqs.forEach(mcq => {
            if (selectedAnswers[mcq.id]) {
                answered++;
                if (selectedAnswers[mcq.id] === mcq.correctAnswer) {
                    correct++;
                }
            }
        });
        return { correct, answered };
    };

    const isLoading = ['picking', 'reading', 'ocr', 'generating', 'parsing'].includes(stage);
    const count = parseInt(mcqCount) || 10;
    const estimatedTime = Math.max(20, count * 2);

    // ===================== LOADING SCREEN =====================
    if (isLoading) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <View style={styles.loadingContainer}>
                    {/* Icon */}
                    <View style={[styles.loadingIcon, { backgroundColor: theme.colors.primary + '20' }]}>
                        <Text style={{ fontSize: 56 }}>⚡</Text>
                    </View>

                    {/* Title */}
                    <Text style={[styles.loadingTitle, { color: theme.colors.text }]}>
                        Processing PDF
                    </Text>

                    {/* Status */}
                    <Text style={[styles.loadingStatus, { color: theme.colors.textSecondary }]}>
                        {statusMessage}
                    </Text>

                    {/* Progress Bar */}
                    <View style={[styles.progressContainer, { backgroundColor: isDark ? '#333' : '#E5E5EA' }]}>
                        <View
                            style={[
                                styles.progressFill,
                                {
                                    width: `${progress}%`,
                                    backgroundColor: theme.colors.primary
                                }
                            ]}
                        />
                    </View>
                    <Text style={[styles.progressText, { color: theme.colors.textSecondary }]}>
                        {progress}% complete
                    </Text>

                    {/* Timer */}
                    <View style={[styles.timerBox, { backgroundColor: theme.colors.surface }]}>
                        <Ionicons name="time" size={24} color={theme.colors.primary} />
                        <Text style={[styles.timerValue, { color: theme.colors.text }]}>
                            {elapsedSeconds}s
                        </Text>
                        <Text style={[styles.timerLabel, { color: theme.colors.textSecondary }]}>
                            / ~{estimatedTime}s estimated
                        </Text>
                    </View>

                    {/* Spinner */}
                    <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 24 }} />

                    {/* Cancel */}
                    <TouchableOpacity
                        style={[styles.cancelButton, { borderColor: theme.colors.error }]}
                        onPress={handleReset}
                    >
                        <Text style={{ color: theme.colors.error, fontWeight: '600' }}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ===================== MAIN SCREEN =====================
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingHorizontal: horizontalPadding || 20 }]}>
                <TouchableOpacity
                    style={[styles.backButton, { backgroundColor: theme.colors.surface }]}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                    PDF to MCQ Generator
                </Text>
                <TouchableOpacity
                    style={[styles.savedBtn, { backgroundColor: theme.colors.primaryLight }]}
                    onPress={() => navigation.navigate('PDFMCQList')}
                >
                    <Ionicons name="folder-outline" size={18} color={theme.colors.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding || 20 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Local Storage Info Banner */}
                <View style={[styles.storageBanner, { backgroundColor: isDark ? '#1A2F1A' : '#D1FAE5', borderColor: '#10B981' }]}>
                    <Ionicons name="save-outline" size={18} color="#10B981" />
                    <Text style={[styles.storageBannerText, { color: isDark ? '#A7F3D0' : '#065F46' }]}>
                        All generated MCQs are stored locally on your device. Nothing is uploaded to any server.
                    </Text>
                </View>

                {/* Upload Card (when no MCQs) */}
                {mcqs.length === 0 && (
                    <View style={[styles.uploadCard, { backgroundColor: theme.colors.surface }]}>
                        {/* Decorative Top Border */}
                        <View style={[styles.topAccent, { backgroundColor: theme.colors.primary }]} />

                        {/* Icon */}
                        <View style={[styles.uploadIconWrapper]}>
                            <View style={[styles.uploadIcon, { backgroundColor: theme.colors.primary + '12' }]}>
                                <Ionicons name="document-text" size={48} color={theme.colors.primary} />
                            </View>
                        </View>

                        {/* Title */}
                        <Text style={[styles.uploadTitle, { color: theme.colors.text }]}>
                            Upload Your PDF
                        </Text>

                        {/* Description */}
                        <Text style={[styles.uploadDesc, { color: theme.colors.textSecondary }]}>
                            Transform any PDF document into interactive UPSC-level MCQs using advanced AI.
                        </Text>

                        {/* Divider */}
                        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

                        {/* MCQ Count */}
                        <View style={styles.settingsSection}>
                            <Text style={[styles.settingsLabel, { color: theme.colors.textSecondary }]}>CONFIGURATION</Text>

                            <View style={[styles.countCard, { backgroundColor: isDark ? '#1A1A1E' : '#FAFAFA', borderColor: theme.colors.border }]}>
                                <View style={styles.countInfo}>
                                    <Text style={[styles.countLabel, { color: theme.colors.text }]}>
                                        Number of MCQs
                                    </Text>
                                    <Text style={[styles.countHint, { color: theme.colors.textSecondary }]}>
                                        1 to 1000 questions
                                    </Text>
                                </View>
                                <TextInput
                                    style={[styles.countInput, {
                                        backgroundColor: isDark ? '#2A2A2E' : '#FFFFFF',
                                        color: theme.colors.text,
                                        borderColor: theme.colors.border,
                                    }]}
                                    value={mcqCount}
                                    onChangeText={setMcqCount}
                                    keyboardType="number-pad"
                                    maxLength={3}
                                    placeholder="10"
                                    placeholderTextColor={theme.colors.textSecondary}
                                />
                            </View>

                            {/* Estimated Time */}
                            <View style={[styles.timeCard, { backgroundColor: isDark ? '#1A1A1E' : '#F5F5F5' }]}>
                                <Ionicons name="time-outline" size={18} color={theme.colors.textSecondary} />
                                <Text style={[styles.timeText, { color: theme.colors.textSecondary }]}>
                                    Estimated time: {estimatedTime} seconds
                                </Text>
                            </View>
                        </View>

                        {/* Upload Button */}
                        <TouchableOpacity
                            style={[styles.uploadButton, { backgroundColor: theme.colors.primary }]}
                            onPress={startProcess}
                            activeOpacity={0.8}
                        >
                            <Ionicons name="cloud-upload-outline" size={22} color="#FFF" />
                            <Text style={styles.uploadButtonText}>Select PDF & Generate MCQs</Text>
                            <Ionicons name="arrow-forward" size={18} color="#FFF" />
                        </TouchableOpacity>

                        {/* Features */}
                        <View style={styles.features}>
                            {[
                                { icon: 'document-outline', text: 'Supports any PDF document' },
                                { icon: 'flash-outline', text: 'AI-powered generation' },
                                { icon: 'speedometer-outline', text: 'Fast processing' },
                                { icon: 'shield-checkmark-outline', text: 'Secure & private' },
                            ].map((feature, index) => (
                                <View key={index} style={styles.featureRow}>
                                    <View style={[styles.featureIconBg, { backgroundColor: '#10B98115' }]}>
                                        <Ionicons name={feature.icon as any} size={16} color="#10B981" />
                                    </View>
                                    <Text style={[styles.featureText, { color: theme.colors.text }]}>
                                        {feature.text}
                                    </Text>
                                </View>
                            ))}
                        </View>

                        {/* Error Display */}
                        {errorMessage && (
                            <View style={[styles.errorBox]}>
                                <Ionicons name="alert-circle" size={20} color="#DC2626" />
                                <Text style={styles.errorText}>{errorMessage}</Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Previous Test Scores Table */}
                {stage === 'idle' && mcqs.length === 0 && (
                    <View style={{ marginTop: 24, paddingHorizontal: 4 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                            <Ionicons name="time-outline" size={20} color={theme.colors.primary} />
                            <Text style={{ fontSize: 18, fontWeight: '700', color: theme.colors.text, marginLeft: 8 }}>
                                Previous Test Scores
                            </Text>
                        </View>
                        <View style={{
                            backgroundColor: theme.colors.surface,
                            borderRadius: 16,
                            overflow: 'hidden',
                            borderWidth: 1,
                            borderColor: theme.colors.border
                        }}>
                            {/* Table Header */}
                            <View style={{
                                flexDirection: 'row',
                                padding: 12,
                                backgroundColor: isDark ? '#2A2A2E' : '#F5F5F7',
                                borderBottomWidth: 1,
                                borderBottomColor: theme.colors.border
                            }}>
                                <Text style={{ flex: 2, fontWeight: '600', fontSize: 13, color: theme.colors.textSecondary }}>PDF Name</Text>
                                <Text style={{ flex: 1, fontWeight: '600', fontSize: 13, color: theme.colors.textSecondary, textAlign: 'center' }}>Score</Text>
                                <Text style={{ flex: 1, fontWeight: '600', fontSize: 13, color: theme.colors.textSecondary, textAlign: 'right' }}>Date</Text>
                            </View>

                            {/* Empty State */}
                            {pdfHistory.length === 0 && (
                                <View style={{ padding: 32, alignItems: 'center' }}>
                                    <Ionicons name="document-text-outline" size={40} color={theme.colors.textSecondary} />
                                    <Text style={{ fontSize: 15, fontWeight: '600', color: theme.colors.text, marginTop: 12 }}>
                                        No tests completed yet
                                    </Text>
                                    <Text style={{ fontSize: 13, color: theme.colors.textSecondary, marginTop: 4, textAlign: 'center' }}>
                                        Complete a PDF MCQ test and save your score to see it here
                                    </Text>
                                </View>
                            )}

                            {/* Table Rows */}
                            {pdfHistory.map((item, index) => (
                                <View key={item.id} style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    padding: 12,
                                    borderBottomWidth: index === pdfHistory.length - 1 ? 0 : 1,
                                    borderBottomColor: theme.colors.border
                                }}>
                                    <View style={{ flex: 2, flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={{
                                            width: 32, height: 32, borderRadius: 8,
                                            backgroundColor: item.score_percentage >= 70 ? '#10B98115' : item.score_percentage >= 40 ? '#F59E0B15' : '#EF444415',
                                            alignItems: 'center', justifyContent: 'center', marginRight: 10
                                        }}>
                                            <Ionicons name="document-text" size={16} color={item.score_percentage >= 70 ? '#10B981' : item.score_percentage >= 40 ? '#F59E0B' : '#EF4444'} />
                                        </View>
                                        <Text style={{ fontSize: 14, fontWeight: '500', color: theme.colors.text }} numberOfLines={1}>
                                            {item.file_name}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1, alignItems: 'center' }}>
                                        <View style={{
                                            paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
                                            backgroundColor: item.score_percentage >= 70 ? '#10B98120' : item.score_percentage >= 40 ? '#F59E0B20' : '#EF444420'
                                        }}>
                                            <Text style={{
                                                fontSize: 13, fontWeight: '700',
                                                color: item.score_percentage >= 70 ? '#10B981' : item.score_percentage >= 40 ? '#F59E0B' : '#EF4444'
                                            }}>
                                                {item.correct_answers}/{item.total_questions} ({Math.round(item.score_percentage)}%)
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={{ flex: 1, fontSize: 12, color: theme.colors.textSecondary, textAlign: 'right' }}>
                                        {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* MCQs Display */}
                {mcqs.length > 0 && (
                    <View style={styles.mcqsContainer}>

                        {getScore().answered > 0 && (
                            <View style={[styles.scoreCard, { backgroundColor: theme.colors.surface }]}>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.scoreLabel, { color: theme.colors.textSecondary }]}>
                                        Your Score
                                    </Text>
                                    <Text style={[styles.scoreValue, { color: theme.colors.text }]}>
                                        {getScore().correct} / {getScore().answered}
                                    </Text>
                                    {hasSavedCurrentTest && (
                                        <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
                                            <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                                            <Text style={{ marginLeft: 4, color: '#10B981', fontWeight: '600', fontSize: 13 }}>
                                                Score Saved
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                <View style={[styles.scorePercentBadge, {
                                    backgroundColor: getScore().correct / getScore().answered >= 0.7
                                        ? '#10B98130'
                                        : getScore().correct / getScore().answered >= 0.4
                                            ? '#F59E0B30'
                                            : '#EF444430'
                                }]}>
                                    <Text style={{
                                        color: getScore().correct / getScore().answered >= 0.7
                                            ? '#10B981'
                                            : getScore().correct / getScore().answered >= 0.4
                                                ? '#F59E0B'
                                                : '#EF4444',
                                        fontWeight: '700',
                                        fontSize: 18,
                                    }}>
                                        {Math.round((getScore().correct / getScore().answered) * 100)}%
                                    </Text>
                                </View>
                            </View>
                        )}

                        {/* Header */}
                        <View style={styles.mcqsHeader}>
                            <Text style={[styles.mcqsHeaderTitle, { color: theme.colors.text }]}>
                                {mcqs.length} MCQs Generated
                            </Text>
                            <TouchableOpacity
                                style={[styles.resetButton, { borderColor: theme.colors.error }]}
                                onPress={handleReset}
                            >
                                <Text style={{ color: theme.colors.error, fontSize: 13 }}>Reset</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Export Buttons */}
                        <View style={styles.exportRow}>
                            <TouchableOpacity
                                style={[styles.exportButton, { backgroundColor: '#EF4444' }]}
                                onPress={() => exportToPDF(mcqs, selectedAnswers)}
                            >
                                <Ionicons name="document-text" size={16} color="#fff" />
                                <Text style={styles.exportButtonText}>PDF Report</Text>
                            </TouchableOpacity>



                            <TouchableOpacity
                                style={[styles.exportButton, { backgroundColor: '#3B82F6' }]}
                                onPress={() => exportToCSV(mcqs, selectedAnswers)}
                            >
                                <Ionicons name="download" size={16} color="#fff" />
                                <Text style={styles.exportButtonText}>CSV</Text>
                            </TouchableOpacity>
                        </View>

                        {/* MCQ Cards */}
                        {mcqs.map((mcq, index) => {
                            const selected = selectedAnswers[mcq.id];
                            const revealed = showResults[mcq.id];
                            const isCorrect = selected === mcq.correctAnswer;

                            return (
                                <View
                                    key={mcq.id}
                                    style={[styles.mcqCard, { backgroundColor: theme.colors.surface }]}
                                >
                                    {/* Question */}
                                    <Text style={[styles.mcqQuestion, { color: theme.colors.text }]}>
                                        {index + 1}. {mcq.question.replace(/\*\*/g, '')}
                                    </Text>

                                    {/* Options */}
                                    {(['A', 'B', 'C', 'D'] as const).map(opt => {
                                        const optionText = mcq[`option${opt}` as keyof MCQ] as string;
                                        const isSelected = selected === opt;
                                        const isCorrectOption = mcq.correctAnswer === opt;

                                        let bgColor = isDark ? '#2A2A2E' : '#F5F5F7';
                                        let borderColor = 'transparent';

                                        if (revealed) {
                                            if (isCorrectOption) {
                                                bgColor = '#10B98125';
                                                borderColor = '#10B981';
                                            } else if (isSelected) {
                                                bgColor = '#EF444425';
                                                borderColor = '#EF4444';
                                            }
                                        } else if (isSelected) {
                                            bgColor = theme.colors.primary + '25';
                                            borderColor = theme.colors.primary;
                                        }

                                        return (
                                            <TouchableOpacity
                                                key={opt}
                                                style={[
                                                    styles.optionButton,
                                                    { backgroundColor: bgColor, borderColor, borderWidth: 2 }
                                                ]}
                                                onPress={() => handleOptionSelect(mcq.id, opt)}
                                                disabled={revealed}
                                                activeOpacity={0.7}
                                            >
                                                <View style={[styles.optionLetter, {
                                                    backgroundColor: revealed && isCorrectOption
                                                        ? '#10B981'
                                                        : revealed && isSelected
                                                            ? '#EF4444'
                                                            : theme.colors.primary
                                                }]}>
                                                    <Text style={styles.optionLetterText}>{opt}</Text>
                                                </View>
                                                <Text style={[styles.optionText, { color: theme.colors.text }]}>
                                                    {optionText.replace(/\*\*/g, '')}
                                                </Text>
                                                {revealed && isCorrectOption && (
                                                    <Ionicons name="checkmark-circle" size={22} color="#10B981" />
                                                )}
                                                {revealed && isSelected && !isCorrect && (
                                                    <Ionicons name="close-circle" size={22} color="#EF4444" />
                                                )}
                                            </TouchableOpacity>
                                        );
                                    })}

                                    {/* Explanation */}
                                    {revealed && mcq.explanation && (
                                        <View style={[styles.explanationBox, { backgroundColor: theme.colors.primary + '10' }]}>
                                            <View style={styles.explanationHeader}>
                                                <Ionicons name="bulb" size={18} color={theme.colors.primary} />
                                                <Text style={[styles.explanationTitle, { color: theme.colors.primary }]}>
                                                    Explanation
                                                </Text>
                                            </View>
                                            <Text style={[styles.explanationText, { color: theme.colors.textSecondary }]}>
                                                {mcq.explanation.replace(/\*\*/g, '')}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            );
                        })}

                        {/* Generate More */}
                        <TouchableOpacity
                            style={[styles.generateMoreButton, { borderColor: theme.colors.primary }]}
                            onPress={startProcess}
                        >
                            <Ionicons name="add-circle" size={22} color={theme.colors.primary} />
                            <Text style={[styles.generateMoreText, { color: theme.colors.primary }]}>
                                Generate More MCQs
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

// ===================== STYLES =====================
const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollView: { flex: 1 },
    content: { paddingBottom: 40 },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },

    // Loading Screen
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
    },
    loadingIcon: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    loadingTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 12,
    },
    loadingStatus: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
    },
    progressContainer: {
        width: '100%',
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 5,
    },
    progressText: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 8,
    },
    timerBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 24,
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 12,
    },
    timerValue: {
        fontSize: 28,
        fontWeight: '800',
    },
    timerLabel: {
        fontSize: 14,
    },
    cancelButton: {
        marginTop: 32,
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 2,
    },

    // Upload Card
    uploadCard: {
        borderRadius: 20,
        marginTop: 20,
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
    uploadIconWrapper: {
        alignItems: 'center',
        paddingTop: 32,
    },
    uploadIcon: {
        width: 88,
        height: 88,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadTitle: {
        fontSize: 26,
        fontWeight: '700',
        textAlign: 'center',
        marginTop: 20,
        letterSpacing: -0.5,
    },
    uploadDesc: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginTop: 8,
        marginBottom: 24,
        paddingHorizontal: 32,
    },
    divider: {
        height: 1,
        marginHorizontal: 24,
    },
    settingsSection: {
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    settingsLabel: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.2,
        marginBottom: 12,
    },
    countCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 14,
        borderWidth: 1,
    },
    countInfo: {
        flex: 1,
    },
    countLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    countHint: {
        fontSize: 12,
        marginTop: 2,
    },
    countInput: {
        width: 72,
        height: 48,
        borderRadius: 12,
        borderWidth: 1.5,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: '700',
    },
    timeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 12,
        borderRadius: 10,
        marginTop: 12,
    },
    timeText: {
        fontSize: 13,
    },
    uploadButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginHorizontal: 24,
        marginTop: 24,
        paddingVertical: 16,
        borderRadius: 14,
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    uploadButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    features: {
        gap: 10,
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 28,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    featureIconBg: {
        width: 28,
        height: 28,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    featureText: {
        fontSize: 14,
        fontWeight: '500',
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 14,
        borderRadius: 12,
        marginHorizontal: 24,
        marginBottom: 24,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    errorText: {
        color: '#DC2626',
        flex: 1,
        fontSize: 14,
    },

    // MCQs Container
    mcqsContainer: {
        marginTop: 20,
    },
    scoreCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderRadius: 16,
        marginBottom: 20,
    },
    scoreLabel: {
        fontSize: 13,
        marginBottom: 4,
    },
    scoreValue: {
        fontSize: 32,
        fontWeight: '800',
    },
    scorePercentBadge: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
    },
    mcqsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    mcqsHeaderTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    resetButton: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1.5,
    },

    // MCQ Card
    mcqCard: {
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
    },
    mcqQuestion: {
        fontSize: 17,
        fontWeight: '600',
        lineHeight: 26,
        marginBottom: 20,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 16,
        borderRadius: 14,
        marginBottom: 10,
    },
    optionLetter: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionLetterText: {
        color: '#FFF',
        fontWeight: '700',
        fontSize: 15,
    },
    optionText: {
        flex: 1,
        fontSize: 15,
        lineHeight: 22,
    },
    explanationBox: {
        marginTop: 16,
        padding: 16,
        borderRadius: 14,
    },
    explanationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 10,
    },
    explanationTitle: {
        fontWeight: '700',
        fontSize: 15,
    },
    explanationText: {
        fontSize: 14,
        lineHeight: 22,
    },
    generateMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        padding: 18,
        borderRadius: 14,
        borderWidth: 2,
        borderStyle: 'dashed',
        marginTop: 8,
    },
    generateMoreText: {
        fontSize: 16,
        fontWeight: '600',
    },

    // Export Buttons
    exportRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginBottom: 16,
        flexWrap: 'wrap',
    },
    exportButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    exportButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },

    // Local storage banner
    storageBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 16
    },
    storageBannerText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 18
    },

    // Saved button
    savedBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
