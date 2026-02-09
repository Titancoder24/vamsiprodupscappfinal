'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, CheckCircle, Sparkles, Brain, Trophy, Zap, ChevronRight,
  Play, Star, Menu, X, Cpu, FileText, BarChart3, Map, Rocket, 
  GraduationCap, Target, Award, TrendingUp, BookOpen, Lightbulb,
  Users, Clock, Shield, Check, ArrowUpRight, Hexagon
} from 'lucide-react';

// ============ UTILITY COMPONENTS ============

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

// Animated gradient text with shimmer effect
function ShimmerText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("relative inline-block", className)}>
      <span className="bg-gradient-to-r from-blue-600 via-purple-500 to-blue-600 bg-[length:200%_auto] animate-shimmer bg-clip-text text-transparent">
        {children}
      </span>
    </span>
  );
}

// Magnetic button effect
function MagneticButton({ children, className = '', href }: { children: React.ReactNode; className?: string; href?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.15);
    y.set((e.clientY - centerY) * 0.15);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const Component = href ? motion.a : motion.button;

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
    >
      <Component
        href={href}
        className={className}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {children}
      </Component>
    </motion.div>
  );
}

// Floating particles background
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-blue-400/20 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 2,
          }}
        />
      ))}
    </div>
  );
}

// Grid background pattern
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />
    </div>
  );
}

// Premium badge with glow
function PremiumBadge({ children, color = 'blue' }: { children: React.ReactNode; color?: 'blue' | 'purple' | 'green' }) {
  const colors = {
    blue: 'from-blue-500/20 to-cyan-500/20 border-blue-200 text-blue-700',
    purple: 'from-purple-500/20 to-pink-500/20 border-purple-200 text-purple-700',
    green: 'from-green-500/20 to-emerald-500/20 border-green-200 text-green-700',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r border backdrop-blur-sm",
        colors[color]
      )}
    >
      <Sparkles className="w-4 h-4" />
      <span className="text-sm font-semibold tracking-wide">{children}</span>
    </motion.div>
  );
}

// Reveal on scroll wrapper
function RevealOnScroll({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============ SECTION COMPONENTS ============

// PrepAssist Logo
function PrepAssistLogo({ size = 'default' }: { size?: 'small' | 'default' | 'large' }) {
  const sizes = {
    small: { width: 120, height: 50 },
    default: { width: 150, height: 60 },
    large: { width: 200, height: 80 },
  };

  return (
    <img
      src="/prepassist-logo.png"
      alt="PrepAssist"
      width={sizes[size].width}
      height={sizes[size].height}
      style={{ objectFit: 'contain' }}
    />
  );
}

// Animated stat counter
function StatCounter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    let start = 0;
    const duration = 2000;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [isInView, value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5 }}
      className="text-center p-6"
    >
      <div className="text-5xl md:text-6xl font-black">
        <span className="bg-gradient-to-b from-gray-900 to-gray-600 bg-clip-text text-transparent">{count.toLocaleString()}</span>
        <span className="text-gray-700">{suffix}</span>
      </div>
      <div className="text-gray-500 font-medium mt-2">{label}</div>
    </motion.div>
  );
}

// Premium feature card with hover effects
function FeatureCard({ icon: Icon, title, description, gradient, index }: {
  icon: any;
  title: string;
  description: string;
  gradient: string;
  index: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="group relative"
    >
      {/* Glow effect */}
      <div className={cn(
        "absolute -inset-0.5 rounded-3xl bg-gradient-to-r opacity-0 blur-xl transition-opacity duration-500 group-hover:opacity-70",
        gradient
      )} />
      
      {/* Card */}
      <div className="relative bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 h-full">
        {/* Icon */}
        <motion.div
          className={cn("w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center mb-6", gradient)}
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          <Icon className="w-7 h-7 text-white" />
        </motion.div>
        
        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-500 leading-relaxed">{description}</p>

        {/* Arrow on hover */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          whileHover={{ opacity: 1, x: 0 }}
          className="absolute bottom-8 right-8 text-gray-400"
        >
          <ArrowUpRight className="w-5 h-5" />
        </motion.div>
      </div>
    </motion.div>
  );
}

// Testimonial card with premium styling
function TestimonialCard({ name, role, content, index }: {
  name: string;
  role: string;
  content: string;
  index: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.15 }}
      className="relative group"
    >
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl transition-all">
        {/* Stars */}
        <div className="flex gap-1 mb-6">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
          ))}
        </div>

        {/* Quote */}
        <p className="text-lg text-gray-700 leading-relaxed mb-8 font-medium">"{content}"</p>

        {/* Author */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
            {name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="font-bold text-gray-900">{name}</div>
            <div className="text-gray-500 text-sm">{role}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Premium phone mockup
function PhoneMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, rotateY: -10 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="relative perspective-1000"
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 rounded-[4rem] blur-3xl scale-90 animate-pulse" />
      
      {/* Phone frame */}
      <div className="relative w-80 h-[640px] bg-gradient-to-b from-gray-800 via-gray-900 to-black rounded-[3.5rem] p-3 shadow-2xl border border-gray-700">
        {/* Dynamic Island */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-8 bg-black rounded-full z-20" />
        
        {/* Screen */}
        <div className="w-full h-full bg-gradient-to-b from-slate-50 to-white rounded-[3rem] overflow-hidden">
          <div className="p-5 pt-14">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <ChevronRight className="w-6 h-6 text-gray-400 rotate-180" />
              <span className="font-bold text-gray-900">Modern History</span>
              <div className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-bold rounded-full shadow-lg">
                12/20
              </div>
            </div>

            {/* Question Card */}
            <motion.div 
              className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-3xl p-5 mb-5 border border-blue-100/50 shadow-inner"
              animate={{ boxShadow: ["0 0 20px rgba(99,102,241,0.1)", "0 0 40px rgba(99,102,241,0.2)", "0 0 20px rgba(99,102,241,0.1)"] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center">
                  <Lightbulb className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-xs font-bold text-blue-600 tracking-wider">QUESTION 13</span>
              </div>
              <p className="text-gray-800 font-semibold text-sm leading-relaxed">
                Which of the following introduced the principle of communal representation in India?
              </p>
            </motion.div>

            {/* Options */}
            <div className="space-y-3">
              <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 flex items-center gap-4 hover:border-gray-200 transition-all cursor-pointer">
                <span className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">A</span>
                <span className="text-sm font-medium text-gray-700">Indian Councils Act, 1892</span>
              </div>
              <motion.div 
                className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-400 rounded-2xl p-4 flex items-center gap-4"
                layoutId="correct"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                  <Check className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-bold text-green-700">Indian Councils Act, 1909</span>
              </motion.div>
              <div className="bg-white border-2 border-gray-100 rounded-2xl p-4 flex items-center gap-4 hover:border-gray-200 transition-all cursor-pointer">
                <span className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-600">C</span>
                <span className="text-sm font-medium text-gray-700">Government of India Act, 1919</span>
              </div>
            </div>

            {/* Next button */}
            <motion.button 
              className="w-full bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white rounded-2xl py-4 mt-6 font-bold text-sm shadow-xl"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Next Question →
            </motion.button>
          </div>
        </div>
      </div>

      {/* Floating elements */}
      <motion.div
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 1 }}
        className="absolute top-16 -right-20 bg-white rounded-2xl p-4 shadow-2xl border border-gray-100 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">12 Day Streak! 🔥</div>
            <div className="text-xs text-gray-500">You're on fire!</div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="absolute bottom-24 -left-24 bg-white rounded-2xl p-4 shadow-2xl border border-gray-100 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">+15% This Week</div>
            <div className="text-xs text-gray-500">Accuracy improved</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============ MAIN COMPONENT ============

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('sb-access-token');
    if (token) router.push('/dashboard');
  }, [router]);

  const features = [
    { icon: Brain, title: 'AI-Powered Learning', description: 'Adaptive algorithms understand your learning style and optimize your study path in real-time for maximum retention.', gradient: 'from-purple-500 to-indigo-600' },
    { icon: Cpu, title: 'Smart Question Engine', description: 'Generate exam-ready MCQs from current affairs. Our AI parses The Hindu, Indian Express, and NCERTs daily.', gradient: 'from-blue-500 to-cyan-500' },
    { icon: FileText, title: 'Answer Evaluation', description: 'Get detailed feedback on structure, vocabulary, and relevance. Benchmarked against top scorer answer scripts.', gradient: 'from-orange-500 to-red-500' },
    { icon: Map, title: 'Dynamic Roadmaps', description: 'Never fall behind. Our AI scheduler automatically adjusts your plan based on your progress and goals.', gradient: 'from-green-500 to-emerald-500' },
    { icon: BarChart3, title: 'Deep Analytics', description: 'Beautiful dashboards reveal your strengths and weaknesses. Know exactly what to focus on next.', gradient: 'from-pink-500 to-rose-500' },
    { icon: Zap, title: 'Smart News Feed', description: 'Auto-tagged current affairs filtered for UPSC syllabus. Never miss what matters for your exam.', gradient: 'from-yellow-500 to-orange-500' },
  ];

  const testimonials = [
    { name: 'Priya Sharma', role: 'UPSC Aspirant', content: 'This platform transformed my preparation. The AI-generated MCQs helped me identify weak areas I never knew existed.' },
    { name: 'Rahul Krishnan', role: 'UPSC Aspirant', content: 'The roadmap feature is a game-changer. I could finally see my entire preparation journey mapped out clearly.' },
    { name: 'Ananya Gupta', role: 'UPSC Aspirant', content: 'Daily current affairs with smart summaries saved me hours. The AI knows exactly what\'s relevant for the exam.' },
  ];

  const stats = [
    { value: 15000, suffix: '+', label: 'Active Aspirants' },
    { value: 500, suffix: '+', label: 'Success Stories' },
    { value: 98, suffix: '%', label: 'Satisfaction' },
    { value: 2, suffix: 'M+', label: 'Questions Solved' },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-hidden">
      {/* Global styles */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-shimmer { animation: shimmer 3s ease-in-out infinite; }
        .perspective-1000 { perspective: 1000px; }
      `}</style>

      {/* Background layers */}
      <GridBackground />
      <FloatingParticles />
      
      {/* Gradient orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-gradient-to-br from-blue-200/40 to-purple-200/40 blur-3xl"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-gradient-to-br from-cyan-200/40 to-blue-200/40 blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], rotate: [0, -90, 0] }}
          transition={{ duration: 25, repeat: Infinity }}
        />
      </div>

      {/* Navigation */}
      <motion.nav 
        className="fixed top-0 left-0 right-0 z-50 px-4 md:px-6 py-4"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="max-w-6xl mx-auto backdrop-blur-2xl bg-white/80 border border-gray-200/50 rounded-2xl px-8 py-4 flex items-center justify-between shadow-xl shadow-gray-200/40">
          <PrepAssistLogo />

          <div className="hidden md:flex items-center gap-10">
            {['Features', 'Testimonials', 'Pricing'].map((item) => (
              <motion.a
                key={item}
                href={item === 'Pricing' ? '/pricing' : `#${item.toLowerCase()}`}
                className="text-gray-700 hover:text-gray-900 text-base font-semibold relative group"
                whileHover={{ scale: 1.05 }}
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:w-full transition-all duration-300" />
              </motion.a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <motion.a 
              href="https://app.prepassist.in/login" 
              className="text-gray-700 hover:text-gray-900 text-base font-semibold px-4 py-2"
              whileHover={{ scale: 1.05 }}
            >
              Log in
            </motion.a>
            <MagneticButton
              href="https://app.prepassist.in/login"
              className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white px-7 py-3 rounded-xl text-base font-bold shadow-xl hover:shadow-2xl transition-all inline-block"
            >
              Start Free Trial
            </MagneticButton>
          </div>

          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              className="md:hidden mt-4 backdrop-blur-2xl bg-white/95 border border-gray-200/50 rounded-2xl p-6 space-y-4 shadow-xl"
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
            >
              <a href="#features" className="block text-gray-700 hover:text-gray-900 text-lg font-semibold py-2">Features</a>
              <a href="#testimonials" className="block text-gray-700 hover:text-gray-900 text-lg font-semibold py-2">Testimonials</a>
              <a href="/pricing" className="block text-gray-700 hover:text-gray-900 text-lg font-semibold py-2">Pricing</a>
              <a href="https://app.prepassist.in/login" className="block bg-gradient-to-r from-gray-900 to-gray-800 text-white px-6 py-4 rounded-xl font-bold text-center">
                Start Free Trial
              </a>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-48 pb-24 px-6">
        <div className="max-w-6xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left Content */}
            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <PremiumBadge>THE FUTURE OF UPSC PREPARATION</PremiumBadge>
                
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mt-8 mb-6 leading-[1.05] tracking-tight">
                  Your Personal
                  <br />
                  <ShimmerText>AI Mentor</ShimmerText>
                  <br />
                  for UPSC
                </h1>

                <p className="text-xl text-gray-500 max-w-lg mb-10 leading-relaxed">
                  Join <span className="font-bold text-gray-900">15,000+ aspirants</span> who are preparing smarter with AI-powered quizzes, personalized roadmaps, and real-time analytics.
                </p>

                <div className="flex flex-wrap gap-4 mb-12">
                  <MagneticButton
                    href="https://app.prepassist.in/login"
                    className="inline-flex items-center gap-3 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white px-8 py-5 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all"
                  >
                    Start Learning Free <ArrowRight className="w-5 h-5" />
                  </MagneticButton>
                  <MagneticButton className="inline-flex items-center gap-3 bg-gray-100 hover:bg-gray-200 px-8 py-5 rounded-2xl font-bold text-lg transition-all">
                    <Play className="w-5 h-5" /> Watch Demo
                  </MagneticButton>
                </div>

                {/* Social proof */}
                <div className="flex items-center gap-6">
                  <div className="flex -space-x-3">
                    {['👩‍🎓', '👨‍💼', '👩‍💻', '👨‍🎓', '👩‍🏫'].map((emoji, i) => (
                      <motion.div 
                        key={i} 
                        className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-3 border-white flex items-center justify-center text-xl shadow-md"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                      >
                        {emoji}
                      </motion.div>
                    ))}
                  </div>
                  <div>
                    <div className="flex gap-0.5 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      <span className="font-bold text-gray-900">4.9/5</span> from 2,000+ reviews
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Phone Mockup */}
            <div className="relative flex justify-center lg:justify-end">
              <PhoneMockup />
            </div>
          </div>
        </div>
      </section>

      {/* Trusted by section */}
      <section className="py-12 border-y border-gray-100 bg-gray-50/50 overflow-hidden">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div 
            className="flex items-center justify-center gap-12 md:gap-20 flex-wrap"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {['Ranked #1 UPSC App', '4.9★ App Store', 'Featured in ET', '24/7 AI Support'].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-2 text-gray-500 font-medium"
              >
                <CheckCircle className="w-5 h-5 text-green-500" />
                {item}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {stats.map((stat, i) => (
              <StatCounter key={i} {...stat} />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <RevealOnScroll className="text-center mb-20">
            <PremiumBadge color="blue">POWERFUL FEATURES</PremiumBadge>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mt-6 mb-6">
              Everything you need to
              <br />
              <ShimmerText>crack the exam</ShimmerText>
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              A complete AI-powered ecosystem built specifically for UPSC aspirants.
            </p>
          </RevealOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <FeatureCard key={i} {...feature} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <RevealOnScroll className="text-center mb-20">
            <PremiumBadge color="purple">SUCCESS STORIES</PremiumBadge>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mt-6 mb-6">
              Loved by
              <br />
              <ShimmerText>ambitious aspirants</ShimmerText>
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto">
              See what our community has to say about their journey.
            </p>
          </RevealOnScroll>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
              <TestimonialCard key={i} {...testimonial} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <RevealOnScroll>
            <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-12 md:p-20">
              {/* Background effects */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-blue-500/30 blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-purple-500/30 blur-3xl" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBtLTEgMGExIDEgMCAxIDEgMiAwYTEgMSAwIDEgMS0yIDB6IiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiLz48L2c+PC9zdmc+')] opacity-50" />
              </div>

              <div className="relative z-10 text-center">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 text-white leading-tight">
                  Ready to transform
                  <br />
                  your preparation?
                </h2>
                <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
                  Join thousands of serious aspirants using AI to prepare smarter.
                </p>
                
                <div className="flex flex-wrap gap-4 justify-center">
                  <MagneticButton
                    href="https://app.prepassist.in/login"
                    className="inline-flex items-center gap-3 bg-white text-gray-900 px-8 py-5 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all"
                  >
                    Start Your Free Trial <Rocket className="w-5 h-5" />
                  </MagneticButton>
                  <MagneticButton className="inline-flex items-center gap-3 border-2 border-white/30 text-white px-8 py-5 rounded-2xl font-bold text-lg hover:bg-white/10 transition-all">
                    Talk to Us
                  </MagneticButton>
                </div>
                
                <p className="text-sm text-gray-400 mt-8">No credit card required • Free forever plan available</p>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-6 border-t border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <PrepAssistLogo size="small" />
            <div className="text-gray-400 text-sm text-center">
              © 2026 PrepAssist. Built with ❤️ for aspirants who dream big.
            </div>
            <div className="flex items-center gap-8">
              {['Privacy', 'Terms', 'Contact'].map((item) => (
                <a key={item} href="#" className="text-gray-500 hover:text-gray-900 transition-colors text-sm font-medium">
                  {item}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
