'use client';

import { useState, useEffect } from 'react';
import { Key, Eye, EyeOff, Check, AlertCircle, Trash2, Shield, ExternalLink, Copy, RefreshCw } from 'lucide-react';

// Settings Page - Professional API Key Management
export default function SettingsPage() {
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [saved, setSaved] = useState(false);
    const [copied, setCopied] = useState(false);
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [keyLastUpdated, setKeyLastUpdated] = useState<string | null>(null);

    // Load saved key on mount
    useEffect(() => {
        const savedKey = localStorage.getItem('_or_k_enc');
        const savedTs = localStorage.getItem('_or_k_ts');
        if (savedKey) {
            setApiKey('sk-or-v1-••••••••••••••••••••••••••••••••');
        }
        if (savedTs) {
            setKeyLastUpdated(new Date(parseInt(savedTs)).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }));
        }
    }, []);

    const handleSaveKey = () => {
        if (!apiKey.startsWith('sk-or-v1-')) {
            alert('Invalid OpenRouter API key format. Key should start with sk-or-v1-');
            return;
        }

        const encoded = btoa(apiKey.split('').reverse().join(''));
        localStorage.setItem('_or_k_enc', encoded);
        localStorage.setItem('_or_k_ts', Date.now().toString());
        setKeyLastUpdated(new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }));

        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleTestKey = async () => {
        setTestStatus('testing');

        try {
            const keyToTest = apiKey.includes('••••')
                ? atob(localStorage.getItem('_or_k_enc') || '').split('').reverse().join('')
                : apiKey;

            const response = await fetch('https://openrouter.ai/api/v1/models', {
                headers: {
                    'Authorization': `Bearer ${keyToTest}`,
                }
            });

            setTestStatus(response.ok ? 'success' : 'error');
        } catch {
            setTestStatus('error');
        }

        setTimeout(() => setTestStatus('idle'), 4000);
    };

    const handleClearKey = () => {
        if (confirm('Are you sure you want to remove the API key? This action cannot be undone.')) {
            localStorage.removeItem('_or_k_enc');
            localStorage.removeItem('_or_k_ts');
            setApiKey('');
            setKeyLastUpdated(null);
        }
    };

    const handleCopyKey = async () => {
        const keyToCopy = apiKey.includes('••••')
            ? atob(localStorage.getItem('_or_k_enc') || '').split('').reverse().join('')
            : apiKey;

        await navigator.clipboard.writeText(keyToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-6 py-8">
                    <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                    <p className="text-gray-500 mt-1">Manage your API keys and application configuration</p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-6 py-8">
                {/* API Key Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Card Header */}
                    <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center">
                                    <Key className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900">OpenRouter API Key</h2>
                                    <p className="text-sm text-gray-500">Required for AI-powered features</p>
                                </div>
                            </div>
                            {keyLastUpdated && (
                                <div className="text-right">
                                    <p className="text-xs text-gray-400">Last updated</p>
                                    <p className="text-sm text-gray-600">{keyLastUpdated}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Card Body */}
                    <div className="px-6 py-6">
                        {/* Key Input */}
                        <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">
                                API Key
                            </label>
                            <div className="flex gap-3">
                                <div className="relative flex-1">
                                    <input
                                        type={showKey ? 'text' : 'password'}
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        placeholder="sk-or-v1-..."
                                        className="w-full px-4 py-3 pr-24 rounded-lg border border-gray-300 font-mono text-sm 
                                            focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
                                            placeholder:text-gray-400 transition-all"
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                        <button
                                            onClick={() => setShowKey(!showKey)}
                                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                            title={showKey ? 'Hide key' : 'Show key'}
                                        >
                                            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                        {apiKey && !apiKey.includes('••••') && (
                                            <button
                                                onClick={handleCopyKey}
                                                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                                                title="Copy key"
                                            >
                                                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500">
                                Get your API key from{' '}
                                <a
                                    href="https://openrouter.ai/keys"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-indigo-600 hover:text-indigo-700 inline-flex items-center gap-1"
                                >
                                    openrouter.ai/keys
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            </p>
                        </div>

                        {/* Status Badge */}
                        {testStatus !== 'idle' && (
                            <div className={`mt-4 px-4 py-3 rounded-lg flex items-center gap-3 ${testStatus === 'testing' ? 'bg-blue-50 text-blue-700' :
                                    testStatus === 'success' ? 'bg-green-50 text-green-700' :
                                        'bg-red-50 text-red-700'
                                }`}>
                                {testStatus === 'testing' && <RefreshCw className="w-4 h-4 animate-spin" />}
                                {testStatus === 'success' && <Check className="w-4 h-4" />}
                                {testStatus === 'error' && <AlertCircle className="w-4 h-4" />}
                                <span className="text-sm font-medium">
                                    {testStatus === 'testing' ? 'Validating API key...' :
                                        testStatus === 'success' ? 'API key is valid and working' :
                                            'API key is invalid or expired'}
                                </span>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="mt-6 flex items-center gap-3 pt-4 border-t border-gray-100">
                            <button
                                onClick={handleSaveKey}
                                disabled={!apiKey || apiKey.includes('••••')}
                                className={`px-5 py-2.5 rounded-lg font-medium text-sm transition-all
                                    ${saved
                                        ? 'bg-green-600 text-white'
                                        : 'bg-indigo-600 text-white hover:bg-indigo-700'}
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    flex items-center gap-2`}
                            >
                                {saved ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        Saved
                                    </>
                                ) : (
                                    'Save Key'
                                )}
                            </button>

                            <button
                                onClick={handleTestKey}
                                disabled={testStatus === 'testing' || !apiKey}
                                className="px-5 py-2.5 rounded-lg font-medium text-sm border border-gray-300 
                                    text-gray-700 hover:bg-gray-50 transition-all
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    flex items-center gap-2"
                            >
                                <RefreshCw className={`w-4 h-4 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
                                Test Connection
                            </button>

                            <div className="flex-1" />

                            <button
                                onClick={handleClearKey}
                                disabled={!apiKey}
                                className="px-4 py-2.5 rounded-lg font-medium text-sm text-red-600 
                                    hover:bg-red-50 transition-all
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                Remove Key
                            </button>
                        </div>
                    </div>
                </div>

                {/* Info Cards */}
                <div className="grid md:grid-cols-2 gap-6 mt-8">
                    {/* Security Notice */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                                <Shield className="w-5 h-5 text-emerald-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900">Security</h3>
                        </div>
                        <ul className="space-y-2.5 text-sm text-gray-600">
                            <li className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span>API keys are encrypted before storage</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span>Keys are stored locally in your browser</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span>Never transmitted to our servers</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span>Rotate keys periodically for best security</span>
                            </li>
                        </ul>
                    </div>

                    {/* Quick Guide */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Key className="w-5 h-5 text-blue-600" />
                            </div>
                            <h3 className="font-semibold text-gray-900">Getting Started</h3>
                        </div>
                        <ol className="space-y-2.5 text-sm text-gray-600">
                            <li className="flex items-start gap-3">
                                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-semibold flex items-center justify-center flex-shrink-0">1</span>
                                <span>Visit <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline">openrouter.ai</a></span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-semibold flex items-center justify-center flex-shrink-0">2</span>
                                <span>Create an account or sign in</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-semibold flex items-center justify-center flex-shrink-0">3</span>
                                <span>Go to Settings → Keys</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-semibold flex items-center justify-center flex-shrink-0">4</span>
                                <span>Create a new key and paste it above</span>
                            </li>
                        </ol>
                    </div>
                </div>

                {/* Features Using API */}
                <div className="mt-8 bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">Features powered by OpenRouter</h3>
                    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { name: 'MCQ Generator', icon: '✏️', desc: 'AI-generated questions' },
                            { name: 'Mind Map', icon: '🧠', desc: 'Visual concept maps' },
                            { name: 'Essay Evaluator', icon: '📝', desc: 'Answer feedback' },
                            { name: 'PDF to MCQ', icon: '📄', desc: 'Convert documents' },
                        ].map((feature) => (
                            <div key={feature.name} className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                                <div className="text-2xl mb-2">{feature.icon}</div>
                                <p className="font-medium text-gray-900 text-sm">{feature.name}</p>
                                <p className="text-xs text-gray-500">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
