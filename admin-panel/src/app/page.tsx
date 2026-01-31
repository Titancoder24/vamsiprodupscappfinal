'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  Mail, Lock, ArrowRight, AlertCircle, CheckCircle,
  Sparkles, Brain, Trophy, Users, Target, Zap, ChevronRight,
  Play, Star, Quote, ArrowUpRight, Menu, X, Cpu, FileText,
  BarChart3, Map, Newspaper, Clock
} from 'lucide-react';

// Intersection Observer Hook for Reveal Animation
function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

// Animated Counter Component
function AnimatedCounter({ end, suffix = '', duration = 2000 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const { ref, isVisible } = useReveal();

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, [isVisible, end, duration]);

  return (
    <span ref={ref} className="text-4xl md:text-5xl font-bold heading-display text-gray-900">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

// PrepAssist Logo Component
function PrepAssistLogo({ size = 'default' }: { size?: 'small' | 'default' | 'large' }) {
  const sizes = {
    small: { container: 'w-8 h-8', hexagon: 24 },
    default: { container: 'w-10 h-10', hexagon: 32 },
    large: { container: 'w-16 h-16', hexagon: 48 },
  };

  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 100 100" className={sizes[size].container} fill="none">
        {/* Orange Left Arrow */}
        <path
          d="M30 70 L30 30 L50 15 L50 35 L40 42 L40 58 L50 65 L50 85 Z"
          fill="#F5A623"
        />
        {/* Blue Right Arrow */}
        <path
          d="M70 30 L70 70 L50 85 L50 65 L60 58 L60 42 L50 35 L50 15 Z"
          fill="#2196F3"
        />
      </svg>
      <span className="font-bold text-gray-900 heading-display" style={{ fontSize: size === 'large' ? '1.5rem' : size === 'small' ? '1rem' : '1.25rem' }}>
        Prep<span className="text-gray-500">Assist</span>
      </span>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ icon: Icon, title, description, iconBg, delay }: {
  icon: any;
  title: string;
  description: string;
  iconBg: string;
  delay: number;
}) {
  const { ref, isVisible } = useReveal();

  return (
    <div
      ref={ref}
      className={`feature-card p-6 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={`icon-box ${iconBg} mb-4`}>
        <Icon className="w-5 h-5" style={{ color: iconBg.includes('orange') ? '#F5A623' : iconBg.includes('green') ? '#10B981' : '#2196F3' }} />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

// Testimonial Card Component
function TestimonialCard({ name, role, content, delay }: {
  name: string;
  role: string;
  content: string;
  delay: number;
}) {
  const { ref, isVisible } = useReveal();

  return (
    <div
      ref={ref}
      className={`testimonial-card transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
      </div>
      <p className="text-gray-600 mb-6 leading-relaxed">"{content}"</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
          {name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <div className="font-semibold text-gray-900 text-sm">{name}</div>
          <div className="text-gray-500 text-xs">{role}</div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('sb-access-token');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      localStorage.setItem('sb-access-token', data.token);
      if (data.refreshToken) {
        localStorage.setItem('sb-refresh-token', data.refreshToken);
      }
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/dashboard');
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Please enter your email address first');
      return;
    }

    try {
      setForgotLoading(true);
      setError('');
      setForgotSuccess('');

      await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      setForgotSuccess('If an account exists with this email, a password reset link has been sent.');
    } catch (err) {
      setForgotSuccess('If an account exists with this email, a password reset link has been sent.');
    } finally {
      setForgotLoading(false);
    }
  };

  const features = [
    { icon: Cpu, title: 'Adaptive Question Engine', description: 'Our AI parses The Hindu, Indian Express, and NCERTs to generate exam-ready MCQs. It adapts difficulty based on your performance history.', iconBg: '' },
    { icon: FileText, title: 'Mains Evaluator', description: 'Get feedback on structure, vocabulary, and relevance in seconds. We grade against topper copies.', iconBg: 'icon-box-orange' },
    { icon: Zap, title: 'Smart News Feed', description: 'Auto-tagged current affairs filtered specifically for syllabus relevance.', iconBg: '' },
    { icon: Map, title: 'Dynamic Roadmap', description: 'Missed a day? Our scheduler automatically adjusts your plan to keep you on track.', iconBg: 'icon-box-orange' },
    { icon: BarChart3, title: 'Progress Analytics', description: 'Track performance with beautiful dashboards, identify weak areas and optimize your study time.', iconBg: 'icon-box-green' },
    { icon: Brain, title: 'AI Study Assistant', description: 'Get instant explanations, summaries, and personalized study recommendations.', iconBg: '' },
  ];

  const testimonials = [
    { name: 'Priya Sharma', role: 'UPSC CSE 2024 - AIR 47', content: 'This platform transformed my preparation. The AI-generated MCQs helped me identify weak areas I never knew existed.' },
    { name: 'Rahul Krishnan', role: 'UPSC CSE 2024 - AIR 156', content: 'The roadmap feature is a game-changer. I could finally see my entire preparation journey mapped out clearly.' },
    { name: 'Ananya Gupta', role: 'UPSC CSE 2024 - AIR 289', content: 'Daily current affairs with smart summaries saved me hours every day. Absolutely essential for serious aspirants.' },
  ];

  const stats = [
    { value: 15000, suffix: '+', label: 'Active Aspirants' },
    { value: 500, suffix: '+', label: 'Success Stories' },
    { value: 98, suffix: '%', label: 'Satisfaction Rate' },
    { value: 2, suffix: 'M+', label: 'MCQs Generated' },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-hidden">
      {/* Background Grid */}
      <div className="fixed inset-0 bg-tech-grid pointer-events-none" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto glass-light rounded-2xl px-6 py-3 flex items-center justify-between">
          <PrepAssistLogo />

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">FEATURES</a>
            <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">TESTIMONIALS</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium">PRICING</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); setShowLogin(true); }}
              className="text-gray-600 hover:text-gray-900 transition-colors text-sm font-medium"
            >
              Admin
            </a>
            <a
              href="https://www.prepassist.in/upsc"
              className="btn-blue text-sm py-3 px-6"
            >
              Sign In
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 glass-light rounded-2xl p-6 space-y-4">
            <a href="#features" className="block text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#testimonials" className="block text-gray-600 hover:text-gray-900 transition-colors">Testimonials</a>
            <a href="#pricing" className="block text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
            <a
              href="https://www.prepassist.in/upsc"
              className="btn-blue w-full text-sm py-3 text-center block"
            >
              Sign In
            </a>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); setShowLogin(true); }}
              className="text-gray-500 text-sm text-center block mt-2"
            >
              Admin Login
            </a>
          </div>
        )}
      </nav>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowLogin(false)} />
          <div className="relative bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <button
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              onClick={() => setShowLogin(false)}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-8 text-center">
              <div className="flex justify-center mb-4">
                <PrepAssistLogo size="large" />
              </div>
              <h2 className="text-2xl font-bold heading-display text-gray-900">Welcome back</h2>
              <p className="text-gray-500 mt-2">Sign in to access the admin dashboard</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {forgotSuccess && (
                <div className="flex items-start gap-3 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm">
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <span>{forgotSuccess}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={forgotLoading}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors disabled:opacity-50"
                >
                  {forgotLoading ? 'Sending...' : 'Forgot password?'}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary py-4"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-32 pb-20 px-6">
        <div className="max-w-6xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="relative z-10">
              {/* Badge */}
              <div className="badge mb-8">
                <span className="badge-dot" />
                <span>NEW: MAINS AI EVALUATOR 2.0</span>
              </div>

              {/* Main Headline */}
              <h1 className="heading-display text-5xl md:text-6xl lg:text-7xl mb-6 text-gray-900">
                Crack UPSC Smarter
                <span className="block text-gradient-blue">With AI Powered Learning.</span>
              </h1>

              {/* Subheadline */}
              <p className="text-lg text-gray-500 max-w-lg mb-10 leading-relaxed">
                The only AI-powered operating system for serious aspirants. Generate quizzes from news, get instant answer feedback, and visualize your progress.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4 mb-12">
                <a href="https://www.prepassist.in/upsc" className="btn-primary">
                  Start Learning Free <ArrowRight className="w-4 h-4" />
                </a>
                <button className="btn-secondary">
                  <Play className="w-4 h-4" /> Watch Demo
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center gap-4">
                <div className="avatar-stack flex">
                  {['👩‍🎓', '👨‍💼', '👩‍💻', '👨‍🎓'].map((emoji, i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                      {emoji}
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    <strong className="text-gray-900">15,000+</strong> aspirants trusting us
                  </span>
                </div>
              </div>
            </div>

            {/* Right - Phone Mockup */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="phone-mockup float">
                <div className="phone-screen p-4">
                  {/* App Header */}
                  <div className="flex items-center justify-between mb-6 pt-6">
                    <ChevronRight className="w-5 h-5 text-gray-400 rotate-180" />
                    <span className="font-semibold text-gray-900">Modern History</span>
                    <span className="text-sm text-blue-600 font-medium">12/20</span>
                  </div>

                  {/* Question Card */}
                  <div className="bg-blue-50 rounded-2xl p-4 mb-4">
                    <div className="text-xs text-blue-600 font-medium mb-2">QUESTION 13</div>
                    <p className="text-gray-900 font-medium text-sm">
                      Which of the following introduced the principle of communal representation in India?
                    </p>
                  </div>

                  {/* Options */}
                  <div className="space-y-3">
                    <div className="border border-gray-200 rounded-xl p-3 flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium">A</span>
                      <span className="text-sm text-gray-700">Indian Councils Act, 1892</span>
                    </div>
                    <div className="border-2 border-green-500 bg-green-50 rounded-xl p-3 flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                      <span className="text-sm text-green-700 font-medium">Indian Councils Act, 1909</span>
                    </div>
                    <div className="border border-gray-200 rounded-xl p-3 flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium">C</span>
                      <span className="text-sm text-gray-700">Government of India Act, 1919</span>
                    </div>
                  </div>

                  {/* Next Button */}
                  <button className="w-full bg-gray-900 text-white rounded-xl py-3 mt-6 font-medium text-sm">
                    Next Question
                  </button>
                </div>

                {/* Floating Notifications */}
                <div className="notification-popup top-20 -right-16 flex items-center gap-3" style={{ animationDelay: '0.5s' }}>
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <Trophy className="w-4 h-4 text-orange-500" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-900">Streak Maintained!</div>
                    <div className="text-xs text-gray-500">12 days in a row 🔥</div>
                  </div>
                </div>

                <div className="notification-popup bottom-32 -left-16 flex items-center gap-3" style={{ animationDelay: '1s' }}>
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-900">AI Analysis Ready</div>
                    <div className="text-xs text-gray-500">Evaluation complete</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                <div className="text-gray-500 mt-2 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="mb-16">
            <h2 className="heading-display text-4xl md:text-5xl mb-4 text-gray-900">
              A complete operating system
              <span className="block text-gray-400">for your preparation.</span>
            </h2>
            <p className="text-gray-500 max-w-xl">
              We combined the best study tools into one cohesive platform. No more switching between apps.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <FeatureCard
                key={i}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                iconBg={feature.iconBg}
                delay={i * 100}
              />
            ))}
          </div>

          {/* View All Features Link */}
          <div className="mt-12 text-center">
            <a href="#" className="inline-flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700 transition-colors">
              View all features <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <h2 className="heading-display text-4xl md:text-5xl mb-4 text-gray-900">
              Loved by India's
              <span className="block text-gradient-blue">top achievers</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Join thousands of aspirants who cleared UPSC with our platform.
            </p>
          </div>

          {/* Testimonials Grid */}
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <TestimonialCard
                key={i}
                {...testimonial}
                delay={i * 100}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="pricing" className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="cta-section p-12 md:p-16 text-center text-white">
            <h2 className="heading-display text-3xl md:text-4xl lg:text-5xl mb-4">
              Ready to streamline your prep?
            </h2>
            <p className="text-gray-300 mb-8 max-w-lg mx-auto">
              Join thousands of serious aspirants using AI to clear the toughest exam in the world.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button className="btn-primary bg-white text-gray-900 hover:bg-gray-100">
                Get Started Free
              </button>
              <button className="btn-secondary border-white/30 text-white hover:bg-white/10">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <PrepAssistLogo size="small" />
          <div className="text-gray-400 text-sm">
            © 2026 PrepAssist. All rights reserved. Built with ❤️ for aspirants.
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors text-sm">Privacy</a>
            <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors text-sm">Terms</a>
            <a href="#" className="text-gray-500 hover:text-gray-900 transition-colors text-sm">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
