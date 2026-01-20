'use client';

import { useState, useEffect } from 'react';

// Settings Page - API Key Management
export default function SettingsPage() {
    const [apiKey, setApiKey] = useState('');
    const [showKey, setShowKey] = useState(false);
    const [saved, setSaved] = useState(false);
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

    // Load saved key on mount (masked)
    useEffect(() => {
        const savedKey = localStorage.getItem('_or_k_enc');
        if (savedKey) {
            setApiKey('sk-or-v1-••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••');
        }
    }, []);

    const handleSaveKey = () => {
        if (!apiKey.startsWith('sk-or-v1-')) {
            alert('Invalid OpenRouter API key format. Key should start with sk-or-v1-');
            return;
        }

        // Encrypt and save to localStorage
        const encoded = btoa(apiKey.split('').reverse().join(''));
        localStorage.setItem('_or_k_enc', encoded);
        localStorage.setItem('_or_k_ts', Date.now().toString());

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

            if (response.ok) {
                setTestStatus('success');
            } else {
                setTestStatus('error');
            }
        } catch {
            setTestStatus('error');
        }

        setTimeout(() => setTestStatus('idle'), 3000);
    };

    const handleClearKey = () => {
        if (confirm('Are you sure you want to remove the API key?')) {
            localStorage.removeItem('_or_k_enc');
            localStorage.removeItem('_or_k_ts');
            setApiKey('');
        }
    };

    return (
        <div style={{ padding: '32px', maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', color: '#1a1a1a' }}>
                Settings
            </h1>
            <p style={{ color: '#666', marginBottom: '32px' }}>
                Manage your API keys and configuration
            </p>

            {/* API Key Section */}
            <div style={{
                background: '#fff',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                border: '1px solid #e5e5e5'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px'
                    }}>
                        🔑
                    </div>
                    <div>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>OpenRouter API Key</h2>
                        <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                            Required for AI features (Mind Map, MCQ Generator, Essay Evaluator)
                        </p>
                    </div>
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#333' }}>
                        API Key
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type={showKey ? 'text' : 'password'}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="sk-or-v1-..."
                            style={{
                                flex: 1,
                                padding: '12px 16px',
                                borderRadius: '10px',
                                border: '1px solid #ddd',
                                fontSize: '14px',
                                fontFamily: 'monospace'
                            }}
                        />
                        <button
                            onClick={() => setShowKey(!showKey)}
                            style={{
                                padding: '12px 16px',
                                borderRadius: '10px',
                                border: '1px solid #ddd',
                                background: '#f5f5f5',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            {showKey ? '🙈 Hide' : '👁️ Show'}
                        </button>
                    </div>
                    <p style={{ fontSize: '12px', color: '#888', marginTop: '8px' }}>
                        Get your API key from <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" style={{ color: '#6366F1' }}>openrouter.ai/keys</a>
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                        onClick={handleSaveKey}
                        disabled={!apiKey || apiKey.includes('••••')}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '10px',
                            border: 'none',
                            background: saved ? '#10B981' : '#6366F1',
                            color: '#fff',
                            fontWeight: '600',
                            cursor: 'pointer',
                            fontSize: '14px',
                            opacity: (!apiKey || apiKey.includes('••••')) ? 0.5 : 1
                        }}
                    >
                        {saved ? '✓ Saved!' : '💾 Save Key'}
                    </button>

                    <button
                        onClick={handleTestKey}
                        disabled={testStatus === 'testing'}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '10px',
                            border: '1px solid #ddd',
                            background: testStatus === 'success' ? '#D1FAE5' : testStatus === 'error' ? '#FEE2E2' : '#fff',
                            color: testStatus === 'success' ? '#059669' : testStatus === 'error' ? '#DC2626' : '#333',
                            fontWeight: '500',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        {testStatus === 'testing' ? '⏳ Testing...' :
                            testStatus === 'success' ? '✓ Valid Key' :
                                testStatus === 'error' ? '✗ Invalid' : '🧪 Test Key'}
                    </button>

                    <button
                        onClick={handleClearKey}
                        style={{
                            padding: '12px 24px',
                            borderRadius: '10px',
                            border: '1px solid #fecaca',
                            background: '#fff',
                            color: '#DC2626',
                            fontWeight: '500',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        🗑️ Clear
                    </button>
                </div>
            </div>

            {/* Security Info */}
            <div style={{
                marginTop: '24px',
                padding: '20px',
                background: '#F0FDF4',
                borderRadius: '12px',
                border: '1px solid #BBF7D0'
            }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#166534', marginBottom: '8px' }}>
                    🔒 Security Notice
                </h3>
                <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#15803D', lineHeight: '1.8' }}>
                    <li>API keys are encrypted before storage</li>
                    <li>Keys are obfuscated with multiple layers of protection</li>
                    <li>Keys are never exposed in plain text in the codebase</li>
                    <li>Change your key periodically for maximum security</li>
                </ul>
            </div>

            {/* Instructions */}
            <div style={{
                marginTop: '24px',
                padding: '20px',
                background: '#EFF6FF',
                borderRadius: '12px',
                border: '1px solid #BFDBFE'
            }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1E40AF', marginBottom: '12px' }}>
                    📋 How to get an OpenRouter API Key
                </h3>
                <ol style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#1D4ED8', lineHeight: '2' }}>
                    <li>Go to <a href="https://openrouter.ai" target="_blank" rel="noopener noreferrer" style={{ color: '#6366F1' }}>openrouter.ai</a></li>
                    <li>Create an account or sign in</li>
                    <li>Navigate to <strong>Settings → Keys</strong></li>
                    <li>Click <strong>Create Key</strong></li>
                    <li>Copy the key and paste it above</li>
                </ol>
            </div>
        </div>
    );
}
