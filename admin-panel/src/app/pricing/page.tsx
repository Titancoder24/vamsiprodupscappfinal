'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Zap, Crown, ArrowRight, Sparkles } from 'lucide-react';

// PrepAssist Logo Component
function PrepAssistLogo({ size = 'default' }: { size?: 'small' | 'default' | 'large' }) {
    const sizes = {
        small: { width: 120, height: 50 },
        default: { width: 150, height: 60 },
        large: { width: 200, height: 80 },
    };

    return (
        <img
            src="/prepassist-logo.png"
            alt="PrepAssist - AI Mentor for Your Preparation"
            width={sizes[size].width}
            height={sizes[size].height}
            style={{ objectFit: 'contain' }}
        />
    );
}

const plans = [
    {
        name: 'Pro',
        description: 'For serious aspirants',
        price: '₹399',
        period: '/month',
        icon: Zap,
        gradient: 'from-blue-500 to-blue-600',
        popular: true,
        features: [
            'Advanced MCQ Generator',
            'PDF to MCQ Conversion',
            'AI Mind Maps',
            'AI Mains Writing Practice',
            'Unlimited Notes Storage',
            'Knowledge Radar Alerts',
            'News Feed Access',
            'Email Support',
        ],
        notIncluded: [
            'Mock Test Series',
            'Priority 24/7 Support',
        ],
        cta: 'Get Started',
        ctaLink: 'https://app.prepassist.in/login',
    },
    {
        name: 'Ultimate',
        description: 'Complete preparation suite',
        price: '₹599',
        period: '/month',
        icon: Crown,
        gradient: 'from-purple-500 to-purple-600',
        popular: false,
        features: [
            'Everything in Pro',
            'Priority AI Processing',
            'Advanced Analytics',
            'Personalized Study Plan',
            'Mock Test Series',
            'Interview Preparation',
            'Priority Support (24/7)',
        ],
        notIncluded: [],
        cta: 'Go Ultimate',
        ctaLink: 'https://app.prepassist.in/login',
    },
];


const faqs = [
    {
        question: 'What features are included in each plan?',
        answer: 'Both plans include our core AI-powered features like MCQ Generator, PDF to MCQ conversion, AI Mind Maps, and Mains Writing Practice. The Ultimate plan adds Mock Tests, Interview Prep, and 24/7 Priority Support.',
    },
    {
        question: 'Can I upgrade or downgrade anytime?',
        answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.',
    },
    {
        question: 'Is there a refund policy?',
        answer: 'We offer a 7-day money-back guarantee if you\'re not satisfied with your plan.',
    },
    {
        question: 'Do you offer student discounts?',
        answer: 'Yes! Students with valid ID can get 20% off on all plans. Contact our support team to avail this offer.',
    },
    {
        question: 'What payment methods do you accept?',
        answer: 'We accept all major credit/debit cards, UPI, net banking, and popular wallets like Paytm and PhonePe.',
    },
];


export default function PricingPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    return (
        <div className="min-h-screen bg-white">
            {/* Navigation */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
                <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link href="/">
                        <PrepAssistLogo />
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
                        >
                            Home
                        </Link>
                        <a
                            href="https://app.prepassist.in/login"
                            className="bg-gray-900 text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
                        >
                            Sign Up
                        </a>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-16 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-medium mb-6">
                        <Sparkles className="w-4 h-4" />
                        Simple, Transparent Pricing
                    </div>
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6" style={{ fontFamily: 'var(--font-display)' }}>
                        Choose Your <span className="text-blue-600">Success Plan</span>
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        All plans include access to our AI-powered preparation tools. Pick the one that suits your needs.
                    </p>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="py-12 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-8">
                        {plans.map((plan) => {
                            const IconComponent = plan.icon;
                            return (
                                <div
                                    key={plan.name}
                                    className={`relative bg-white rounded-3xl p-8 border-2 transition-all duration-300 hover:shadow-xl ${plan.popular
                                        ? 'border-blue-500 shadow-lg'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    {plan.popular && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-medium">
                                                Most Popular
                                            </div>
                                        </div>
                                    )}

                                    {/* Plan Header */}
                                    <div className="text-center mb-8">
                                        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${plan.gradient} mb-4`}>
                                            <IconComponent className="w-8 h-8 text-white" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                        <p className="text-gray-500 text-sm">{plan.description}</p>
                                    </div>

                                    {/* Price */}
                                    <div className="text-center mb-8">
                                        <div className="flex items-baseline justify-center gap-1">
                                            <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                                            <span className="text-gray-500">{plan.period}</span>
                                        </div>
                                    </div>

                                    {/* Features */}
                                    <div className="space-y-4 mb-8">
                                        {plan.features.map((feature, i) => (
                                            <div key={i} className="flex items-start gap-3">
                                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                                                    <Check className="w-3 h-3 text-green-600" />
                                                </div>
                                                <span className="text-gray-700 text-sm">{feature}</span>
                                            </div>
                                        ))}
                                        {plan.notIncluded.map((feature, i) => (
                                            <div key={i} className="flex items-start gap-3 opacity-40">
                                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center mt-0.5">
                                                    <span className="text-gray-400 text-xs">✕</span>
                                                </div>
                                                <span className="text-gray-500 text-sm">{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* CTA */}
                                    <a
                                        href={plan.ctaLink}
                                        className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-medium transition-all ${plan.popular
                                            ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:shadow-lg hover:shadow-blue-500/30'
                                            : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-lg hover:shadow-purple-500/30'
                                            }`}
                                    >
                                        {plan.cta}
                                        <ArrowRight className="w-4 h-4" />
                                    </a>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Features Comparison */}
            <section className="py-20 px-6 bg-gray-50">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
                        Compare Plans
                    </h2>
                    <p className="text-gray-600 text-center mb-12">
                        Choose the plan that fits your preparation needs
                    </p>

                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left p-6 text-gray-900 font-semibold">Feature</th>
                                    <th className="p-6 text-center text-blue-600 font-semibold bg-blue-50/50">Pro</th>
                                    <th className="p-6 text-center text-purple-600 font-semibold">Ultimate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    ['MCQ Generator', 'Advanced', 'Advanced'],
                                    ['PDF to MCQ', '✅', '✅'],
                                    ['AI Mind Maps', '✅', '✅'],
                                    ['AI Mains Writing', '✅', '✅'],
                                    ['Notes Storage', 'Unlimited', 'Unlimited'],
                                    ['Knowledge Radar', '✅', '✅'],
                                    ['Mock Tests', '❌', '✅'],
                                    ['Interview Prep', '❌', '✅'],
                                    ['Support', 'Email', 'Priority 24/7'],
                                ].map(([feature, pro, ultimate], i) => (
                                    <tr key={i} className="border-b border-gray-100 last:border-0">
                                        <td className="p-4 text-gray-700 font-medium">{feature}</td>
                                        <td className="p-4 text-center text-gray-900 bg-blue-50/30">{pro}</td>
                                        <td className="p-4 text-center text-gray-600">{ultimate}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="py-20 px-6">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
                        Frequently Asked Questions
                    </h2>
                    <p className="text-gray-600 text-center mb-12">
                        Got questions? We've got answers.
                    </p>

                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className="border border-gray-200 rounded-xl overflow-hidden"
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                    className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                                >
                                    <span className="font-medium text-gray-900">{faq.question}</span>
                                    <span className={`transition-transform ${openFaq === index ? 'rotate-180' : ''}`}>
                                        ▼
                                    </span>
                                </button>
                                {openFaq === index && (
                                    <div className="px-5 pb-5 text-gray-600">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-12 text-center text-white">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            Ready to Ace Your UPSC Prep?
                        </h2>
                        <p className="text-gray-300 mb-8 max-w-lg mx-auto">
                            Join thousands of aspirants using AI to prepare smarter, not harder.
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center">
                            <a
                                href="https://app.prepassist.in/login"
                                className="inline-flex items-center gap-2 bg-white text-gray-900 px-8 py-3.5 rounded-xl font-medium hover:bg-gray-100 transition-colors"
                            >
                                Get Started Now
                                <ArrowRight className="w-4 h-4" />
                            </a>
                            <a
                                href="mailto:support@prepassist.in"
                                className="inline-flex items-center gap-2 border border-white/30 text-white px-8 py-3.5 rounded-xl font-medium hover:bg-white/10 transition-colors"
                            >
                                Contact Sales
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-6 border-t border-gray-100">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <PrepAssistLogo size="small" />
                    <div className="text-gray-400 text-sm">
                        © 2026 PrepAssist. All rights reserved.
                    </div>
                    <div className="flex items-center gap-6">
                        <Link href="/" className="text-gray-500 hover:text-gray-900 transition-colors text-sm">Home</Link>
                        <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors text-sm">Privacy</a>
                        <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors text-sm">Terms</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
