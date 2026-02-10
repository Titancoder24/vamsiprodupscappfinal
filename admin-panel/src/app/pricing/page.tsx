'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, X, Zap, Crown, ArrowRight, Sparkles, Shield, ChevronDown, Star } from 'lucide-react';

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
        description: 'For serious aspirants who want comprehensive AI-powered tools.',
        price: '₹399',
        period: '/month',
        icon: Zap,
        gradient: 'from-[#2D8CF0] to-[#1A73E8]',
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
        description: 'Complete preparation suite for the most determined aspirants.',
        price: '₹599',
        period: '/month',
        icon: Crown,
        gradient: 'from-yellow-400 to-amber-500',
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

const comparisonRows = [
    { feature: 'MCQ Generator', pro: 'Advanced', ultimate: 'Advanced' },
    { feature: 'PDF to MCQ', pro: true, ultimate: true },
    { feature: 'AI Mind Maps', pro: true, ultimate: true },
    { feature: 'AI Mains Writing', pro: true, ultimate: true },
    { feature: 'Notes Storage', pro: 'Unlimited', ultimate: 'Unlimited' },
    { feature: 'Knowledge Radar', pro: true, ultimate: true },
    { feature: 'News Feed', pro: true, ultimate: true },
    { feature: 'Mock Tests', pro: false, ultimate: true },
    { feature: 'Interview Prep', pro: false, ultimate: true },
    { feature: 'AI Processing', pro: 'Standard', ultimate: 'Priority' },
    { feature: 'Analytics', pro: 'Basic', ultimate: 'Advanced' },
    { feature: 'Study Plan', pro: false, ultimate: true },
    { feature: 'Support', pro: 'Email', ultimate: '24/7 Priority' },
];


export default function PricingPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    return (
        <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', 'system-ui', sans-serif" }}>
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
                            className="bg-gray-900 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-gray-800 transition-all shadow-sm hover:shadow-md"
                        >
                            Sign Up
                        </a>
                    </div>
                </div>
            </nav>

            {/* ===== HERO SECTION ===== */}
            <section className="relative overflow-hidden pt-40 pb-16 px-6">
                {/* Background — full-width gradient wash */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#f0f6ff] via-white to-white" />
                <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-gradient-to-br from-[#2D8CF0]/10 via-yellow-400/5 to-transparent rounded-full blur-[80px] pointer-events-none" />
                <div className="absolute top-16 right-[10%] w-[200px] h-[200px] bg-yellow-400/8 rounded-full blur-[60px] pointer-events-none" />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    {/* Badge — strong contrast */}
                    <div className="inline-flex items-center gap-2 bg-[#2D8CF0] text-white px-5 py-2.5 rounded-full text-sm font-bold mb-8 shadow-lg shadow-[#2D8CF0]/20">
                        <Sparkles className="w-4 h-4" />
                        Simple, Transparent Pricing
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-[3.75rem] font-black text-gray-900 mb-6 tracking-tight leading-[1.08]">
                        Invest in Your{' '}
                        <span className="relative inline-block">
                            <span className="bg-gradient-to-r from-[#2D8CF0] to-[#1A73E8] bg-clip-text text-transparent">Success</span>
                            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 8" fill="none">
                                <path d="M2 6C50 2 150 2 198 6" stroke="#2D8CF0" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
                            </svg>
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl text-gray-500 max-w-xl mx-auto font-medium leading-relaxed">
                        All plans include access to our AI-powered preparation tools. Pick the one that suits your needs.
                    </p>
                </div>
            </section>

            {/* ===== PRICING CARDS ===== */}
            <section className="py-8 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-8 items-start">
                        {plans.map((plan) => {
                            const IconComponent = plan.icon;
                            const isPopular = plan.popular;
                            return (
                                <div
                                    key={plan.name}
                                    className={`relative rounded-[24px] overflow-hidden transition-all duration-500 hover:-translate-y-1.5 ${isPopular
                                        ? 'bg-white shadow-[0_8px_48px_-8px_rgba(45,140,240,0.22)] ring-2 ring-[#2D8CF0]/20'
                                        : 'bg-white shadow-[0_2px_20px_-6px_rgba(0,0,0,0.08)] border border-gray-200/50 hover:shadow-[0_8px_48px_-8px_rgba(0,0,0,0.12)]'
                                        }`}
                                >
                                    {/* Top gradient strip for popular */}
                                    {isPopular && (
                                        <div className="h-1.5 bg-gradient-to-r from-[#2D8CF0] via-blue-400 to-[#2D8CF0]" />
                                    )}

                                    <div className="p-9 md:p-10">
                                        {/* Badge */}
                                        {isPopular && (
                                            <div className="inline-flex items-center gap-1.5 bg-[#2D8CF0] text-white px-3.5 py-1.5 rounded-full text-xs font-bold mb-7 shadow-sm">
                                                <Sparkles className="w-3 h-3" />
                                                MOST POPULAR
                                            </div>
                                        )}

                                        {/* Plan Header */}
                                        <div className="flex items-center gap-4 mb-2">
                                            <div className={`flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.gradient} shadow-lg`}>
                                                <IconComponent className="w-7 h-7 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">{plan.name}</h3>
                                            </div>
                                        </div>
                                        <p className="text-gray-500 text-sm mb-8 leading-relaxed">{plan.description}</p>

                                        {/* Price */}
                                        <div className="mb-8 pb-8 border-b border-gray-100">
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-[52px] font-black text-gray-900 tracking-tight leading-none">{plan.price}</span>
                                                <span className="text-gray-400 font-medium text-lg">{plan.period}</span>
                                            </div>
                                            <p className="text-gray-400 text-xs mt-2">Billed monthly. Cancel anytime.</p>
                                        </div>

                                        {/* Features */}
                                        <div className="space-y-3.5 mb-9">
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.12em] mb-5">What&apos;s included</p>
                                            {plan.features.map((feature, i) => (
                                                <div key={i} className="flex items-center gap-3">
                                                    <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${isPopular ? 'bg-[#2D8CF0]/10' : 'bg-yellow-50'}`}>
                                                        <Check className={`w-3 h-3 ${isPopular ? 'text-[#2D8CF0]' : 'text-amber-500'}`} />
                                                    </div>
                                                    <span className="text-gray-700 text-[14px] font-medium">{feature}</span>
                                                </div>
                                            ))}
                                            {plan.notIncluded.map((feature, i) => (
                                                <div key={i} className="flex items-center gap-3">
                                                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                                                        <X className="w-3 h-3 text-gray-300" />
                                                    </div>
                                                    <span className="text-gray-400 text-[14px]">{feature}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* CTA */}
                                        <a
                                            href={plan.ctaLink}
                                            className={`w-full flex items-center justify-center gap-2.5 py-4 rounded-[14px] font-bold text-[15px] transition-all duration-300 ${isPopular
                                                ? 'bg-gradient-to-r from-[#2D8CF0] to-[#1A73E8] text-white hover:shadow-[0_8px_30px_-4px_rgba(45,140,240,0.45)] hover:-translate-y-0.5'
                                                : 'bg-gradient-to-r from-yellow-400 to-amber-500 text-gray-900 hover:shadow-[0_8px_30px_-4px_rgba(245,158,11,0.4)] hover:-translate-y-0.5'
                                                }`}
                                        >
                                            {plan.cta}
                                            <ArrowRight className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Trust indicators */}
                    <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8 mt-14">
                        {[
                            { icon: Shield, text: '7-day money-back guarantee' },
                            { icon: Check, text: 'Cancel anytime' },
                            { icon: Zap, text: 'Instant access' },
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-gray-400">
                                <item.icon className="w-4 h-4 text-green-500" />
                                <span className="font-medium">{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== FEATURES COMPARISON ===== */}
            <section className="py-28 px-6 bg-gradient-to-b from-gray-50/80 to-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#2D8CF0]/4 rounded-full blur-[100px] pointer-events-none" />

                <div className="max-w-3xl mx-auto relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight">
                            Compare Plans
                        </h2>
                        <p className="text-gray-500 text-lg font-medium">
                            See exactly what you get with each plan
                        </p>
                    </div>

                    <div className="bg-white rounded-[20px] border border-gray-200/50 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.04)] overflow-hidden">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b-2 border-gray-100">
                                    <th className="text-left p-5 md:p-6 text-gray-900 font-bold text-sm">Feature</th>
                                    <th className="p-5 md:p-6 text-center">
                                        <div className="inline-flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2D8CF0] to-[#1A73E8] flex items-center justify-center shadow-md">
                                                <Zap className="w-5 h-5 text-white" />
                                            </div>
                                            <span className="text-[#2D8CF0] font-bold text-sm">Pro</span>
                                            <span className="text-gray-400 text-xs font-medium">₹399/mo</span>
                                        </div>
                                    </th>
                                    <th className="p-5 md:p-6 text-center">
                                        <div className="inline-flex flex-col items-center gap-2">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-md">
                                                <Crown className="w-5 h-5 text-white" />
                                            </div>
                                            <span className="text-amber-600 font-bold text-sm">Ultimate</span>
                                            <span className="text-gray-400 text-xs font-medium">₹599/mo</span>
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {comparisonRows.map((row, i) => (
                                    <tr key={i} className={`border-b border-gray-50 last:border-0 transition-colors hover:bg-blue-50/20 ${i % 2 === 0 ? 'bg-gray-50/30' : ''}`}>
                                        <td className="p-4 md:p-5 text-gray-700 text-sm font-medium">{row.feature}</td>
                                        <td className="p-4 md:p-5 text-center">
                                            {typeof row.pro === 'boolean' ? (
                                                row.pro ? (
                                                    <div className="inline-flex w-7 h-7 rounded-full bg-green-50 items-center justify-center">
                                                        <Check className="w-4 h-4 text-green-500" />
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex w-7 h-7 rounded-full bg-gray-50 items-center justify-center">
                                                        <X className="w-4 h-4 text-gray-300" />
                                                    </div>
                                                )
                                            ) : (
                                                <span className="text-gray-700 text-sm font-semibold">{row.pro}</span>
                                            )}
                                        </td>
                                        <td className="p-4 md:p-5 text-center">
                                            {typeof row.ultimate === 'boolean' ? (
                                                row.ultimate ? (
                                                    <div className="inline-flex w-7 h-7 rounded-full bg-green-50 items-center justify-center">
                                                        <Check className="w-4 h-4 text-green-500" />
                                                    </div>
                                                ) : (
                                                    <div className="inline-flex w-7 h-7 rounded-full bg-gray-50 items-center justify-center">
                                                        <X className="w-4 h-4 text-gray-300" />
                                                    </div>
                                                )
                                            ) : (
                                                <span className="text-gray-700 text-sm font-semibold">{row.ultimate}</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* ===== FAQ SECTION ===== */}
            <section className="py-28 px-6">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4 tracking-tight">
                            Frequently Asked Questions
                        </h2>
                        <p className="text-gray-500 text-lg font-medium">
                            Got questions? We&apos;ve got answers.
                        </p>
                    </div>

                    <div className="space-y-3">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className={`rounded-[16px] border transition-all duration-300 overflow-hidden ${openFaq === index
                                    ? 'border-[#2D8CF0]/20 bg-gradient-to-br from-blue-50/40 to-white shadow-[0_4px_20px_-4px_rgba(45,140,240,0.1)]'
                                    : 'border-gray-200/60 bg-white hover:border-gray-300/60 hover:shadow-sm'
                                    }`}
                            >
                                <button
                                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                                    className="w-full flex items-center justify-between p-5 md:p-6 text-left group"
                                >
                                    <span className="font-semibold text-gray-900 text-[15px] pr-4">{faq.question}</span>
                                    <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 ${openFaq === index
                                        ? 'bg-[#2D8CF0] rotate-180 shadow-md shadow-[#2D8CF0]/20'
                                        : 'bg-gray-100 group-hover:bg-gray-200'
                                        }`}>
                                        <ChevronDown className={`w-4 h-4 transition-colors ${openFaq === index ? 'text-white' : 'text-gray-500'}`} />
                                    </div>
                                </button>
                                <div
                                    className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] ${openFaq === index ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'}`}
                                >
                                    <div className="px-5 md:px-6 pb-6 text-gray-600 text-[14px] leading-[1.75]">
                                        {faq.answer}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== CTA SECTION ===== */}
            <section className="py-20 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="relative rounded-[24px] overflow-hidden">
                        {/* Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#0a2547] via-[#0f3d6e] to-[#0a2547]" />
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#2D8CF0]/20 rounded-full blur-[130px]" />
                        <div className="absolute bottom-0 right-0 w-[300px] h-[200px] bg-yellow-500/10 rounded-full blur-[80px]" />
                        <div className="absolute top-1/2 left-0 w-[200px] h-[200px] bg-yellow-400/8 rounded-full blur-[60px]" />

                        {/* Dot pattern overlay */}
                        <div className="absolute inset-0 opacity-[0.03]" style={{
                            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
                            backgroundSize: '24px 24px',
                        }} />

                        <div className="relative z-10 p-12 md:p-20 text-center">
                            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-5 tracking-tight leading-[1.1]">
                                Ready to Ace Your{' '}
                                <span className="bg-gradient-to-r from-blue-300 to-yellow-300 bg-clip-text text-transparent">UPSC Prep?</span>
                            </h2>
                            <p className="text-blue-200/60 mb-10 max-w-lg mx-auto text-lg font-medium leading-relaxed">
                                Join thousands of aspirants using AI to prepare smarter, not harder.
                            </p>
                            <div className="flex flex-wrap gap-4 justify-center">
                                <a
                                    href="https://app.prepassist.in/login"
                                    className="inline-flex items-center gap-2.5 bg-white text-gray-900 px-8 py-4 rounded-[14px] font-bold text-[15px] hover:bg-gray-50 transition-all hover:shadow-[0_8px_30px_rgba(255,255,255,0.15)] hover:-translate-y-0.5"
                                >
                                    Get Started Now
                                    <ArrowRight className="w-4 h-4" />
                                </a>
                                <a
                                    href="mailto:support@prepassist.in"
                                    className="inline-flex items-center gap-2 border border-white/20 text-white px-8 py-4 rounded-[14px] font-semibold hover:bg-white/10 transition-all"
                                >
                                    Contact Sales
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== FOOTER ===== */}
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
