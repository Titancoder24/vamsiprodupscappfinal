'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useScroll, useTransform, useInView, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, CheckCircle, Sparkles, Brain, Trophy, Zap, ChevronRight, ChevronLeft,
  Play, Star, Menu, X, Cpu, FileText, BarChart3, Map, Rocket,
  GraduationCap, Target, Award, TrendingUp, BookOpen, Lightbulb,
  Users, Check, Signal, Wifi, Battery
} from 'lucide-react';

// EXACT MATCH ICONS - Ionicons 5
import {
  IoNewspaperOutline,
  IoCreateOutline,
  IoGitNetworkOutline,
  IoDocumentAttachOutline,
  IoDocumentTextOutline,
  IoSparklesOutline,
  IoDocumentsOutline,
  IoStatsChartOutline
} from 'react-icons/io5';

// ============ UTILITY COMPONENTS ============

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

// Animated gradient text with shimmer effect - BLUE Focused
function ShimmerText({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("relative inline-block", className)}>
      <span className="bg-gradient-to-r from-[#2D8CF0] via-[#60A5FA] to-[#2D8CF0] bg-[length:200%_auto] animate-shimmer bg-clip-text text-transparent">
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

// Floating particles background - BLUE & YELLOW
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className={cn(
            "absolute w-2 h-2 rounded-full",
            i % 2 === 0 ? "bg-[#2D8CF0]/20" : "bg-yellow-400/20"
          )}
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

// Grid background pattern - ANIMATED & VISIBLE
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-100 animate-grid-flow" />
    </div>
  );
}

// Premium badge with glow - CLEAN MODERN LOOK
function PremiumBadge({ children, color = 'blue' }: { children: React.ReactNode; color?: 'blue' | 'yellow' }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-100 text-[#2D8CF0]',
    yellow: 'bg-amber-50 border-amber-100 text-amber-700',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={cn(
        "inline-flex items-center gap-2 px-4 py-1.5 rounded-full border backdrop-blur-sm shadow-sm",
        colors[color]
      )}
    >
      <Sparkles className={cn("w-3.5 h-3.5", color === 'blue' ? "text-[#2D8CF0]" : "text-amber-500")} />
      <span className="text-[11px] font-bold tracking-[0.1em] uppercase">{children}</span>
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

// Animated stat counter - REFINED TYPOGRAPHY
function StatCounter({ value, suffix, label }: { value: number; suffix: string; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
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
      whileHover={{ scale: 1.05 }}
      className="text-center p-6 group cursor-pointer"
    >
      <div className="text-5xl md:text-6xl font-black transition-transform duration-300">
        <span className="text-black">{count.toLocaleString()}</span>
        <span className="text-amber-500 drop-shadow-sm">{suffix}</span>
      </div>
      <div className="text-gray-500 font-medium mt-2 uppercase tracking-widest text-xs">{label}</div>
    </motion.div>
  );
}

// Feature card — production-ready
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
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -5, transition: { duration: 0.3, ease: 'easeOut' } }}
      className="group relative h-full"
    >
      <div className="relative h-full rounded-[24px] bg-white border border-gray-100 shadow-[0_1px_2px_rgba(0,0,0,0.05)] overflow-hidden hover:shadow-[0_20px_25px_-5px_rgba(0,0,0,0.05),0_10px_10px_-5px_rgba(0,0,0,0.02)] hover:border-blue-500/20 transition-all duration-500 flex flex-col">


        {/* Header */}
        <div className="px-7 pt-7 pb-5">
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              <div className={cn(
                "relative w-[52px] h-[52px] rounded-xl flex items-center justify-center shadow-sm transition-all duration-300 group-hover:scale-[1.1]",
                gradient.startsWith('from') ? "bg-blue-600" : gradient
              )}>
                <Icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-gray-900 font-bold text-[17px] tracking-tight leading-snug">
              {title}
            </h3>
          </div>
        </div>

        {/* Separator with subtle gradient */}
        <div className="mx-7 h-px bg-gradient-to-r from-gray-100 via-gray-200/60 to-gray-100" />

        {/* Content area */}
        <div className="px-7 pt-5 pb-7 flex flex-col flex-grow">
          <p className="text-gray-600 text-[14px] leading-[1.8] flex-grow">
            {description}
          </p>
        </div>

        {/* Bottom accent bar — scales in on hover */}
        <div className={cn(
          "absolute bottom-0 left-0 right-0 h-[3px] bg-blue-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"
        )} />
      </div>
    </motion.div>
  );
}

// Testimonial card — editorial, magazine-quality design
function TestimonialCard({ name, role, content, index, verified = true }: {
  name: string;
  role: string;
  content: string;
  index: number;
  verified?: boolean;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="relative group h-full"
    >
      <div className="relative rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-md transition-all duration-500 h-full flex overflow-hidden bg-white">

        {/* Left deep accent */}
        <div className="w-1.5 flex-shrink-0 bg-blue-600" />

        <div className="flex-1 p-10 md:p-12 flex flex-col relative">
          {/* Large decorative quote */}
          <svg className="absolute top-6 right-8 w-20 h-20 text-[#2D8CF0]/[0.06]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M14.017 21V18c0-1.1.3-1.93.91-2.49.61-.56 1.79-.98 3.53-1.26V9.93c-1.44.1-2.32.23-2.63.38-.32.15-.72.69-1.19 1.61l-1.48-.92c.76-1.82 1.71-3.27 2.88-4.35 1.17-1.08 2.81-1.74 4.92-1.98v2.88c-1.18.1-2.07.47-2.68 1.1-.61.64-.92 1.63-.92 2.97v2.18c1.32.18 1.98 1.18 1.98 3v5.2h-5.32zM5.017 21V18c0-1.1.3-1.93.91-2.49.61-.56 1.79-.98 3.53-1.26V9.93c-1.44.1-2.32.23-2.63.38-.32.15-.72.69-1.19 1.61l-1.48-.92c.76-1.82 1.71-3.27 2.88-4.35 1.17-1.08 2.81-1.74 4.92-1.98v2.88c-1.18.1-2.07.47-2.68 1.1-.61.64-.92 1.63-.92 2.97v2.18c1.32.18 1.98 1.18 1.98 3v5.2H5.017z" />
          </svg>

          {/* Stars */}
          <div className="flex gap-1 mb-6">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
            ))}
          </div>

          {/* Quote text — larger, punchier */}
          <p className="text-lg md:text-xl text-gray-800 leading-[1.8] flex-grow font-medium relative z-10">
            &ldquo;{content}&rdquo;
          </p>

          {/* Author */}
          <div className="flex items-center gap-4 mt-8 pt-7 border-t border-gray-100">
            <div className="relative">
              <div className="w-13 h-13 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-base shadow-sm" style={{ width: 52, height: 52 }}>
                {name.split(' ').map(n => n[0]).join('')}
              </div>
              {verified && (
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <CheckCircle className="w-4 h-4 text-[#2D8CF0]" />
                </div>
              )}
            </div>
            <div>
              <div className="font-bold text-gray-900 text-base">{name}</div>
              <div className="text-gray-400 text-sm font-medium">{role}</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// PREMIUM Phone Mockup - Thinner bezel, Status Bar, Fixed button overlap
function PhoneMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, rotateY: -10 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{ duration: 1, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="relative perspective-1000"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-yellow-500/20 to-blue-500/30 rounded-[4rem] blur-3xl scale-90 animate-pulse" />

      {/* Phone Frame — THINNER BEZEL */}
      <div className="relative w-[310px] h-[660px] bg-gradient-to-b from-[#1c1c1e] to-[#0a0a0a] rounded-[3rem] p-[6px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.35)] ring-1 ring-white/10">

        {/* Dynamic Island — iPhone 15 Pro style pill */}
        <div className="absolute top-[10px] left-1/2 -translate-x-1/2 z-30 flex items-center justify-center">
          <div className="w-[100px] h-[28px] bg-black rounded-full flex items-center justify-end pr-[9px]">
            <div className="w-[10px] h-[10px] rounded-full bg-[#1a1a2e] ring-1 ring-[#2a2a3e]" />
          </div>
        </div>

        {/* Inner Screen */}
        <div className="w-full h-full bg-slate-50 rounded-[2.6rem] overflow-hidden relative flex flex-col">

          {/* ── Status Bar ── */}
          <div className="flex items-end justify-between px-7 pt-3 pb-1 z-20 shrink-0">
            <span className="text-[13px] font-semibold text-gray-900 tracking-tight">9:41</span>
            <div className="flex items-center gap-[5px]">
              <Signal className="w-[14px] h-[14px] text-gray-900 fill-gray-900" />
              <Wifi className="w-[15px] h-[15px] text-gray-900" />
              <Battery className="w-[18px] h-[18px] text-gray-900 fill-gray-900" />
            </div>
          </div>

          {/* ── App Header ── Premium frosted bar */}
          <div className="flex items-center justify-between px-5 py-3 bg-white/70 backdrop-blur-md border-b border-gray-100/50 shrink-0">
            <div className="w-8 h-8 rounded-full bg-gray-100/80 flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-gray-600 rotate-180" />
            </div>
            <div className="flex flex-col items-center">
              <span className="font-bold text-gray-900 text-[15px] tracking-tight">Modern History</span>
              <span className="text-[10px] font-semibold text-[#2D8CF0] mt-0.5">MCQ Practice</span>
            </div>
            <div className="px-2.5 py-1 bg-[#2D8CF0] text-white text-[11px] font-bold rounded-lg shadow-sm">13/20</div>
          </div>

          {/* ── Progress Bar ── */}
          <div className="px-5 py-3 shrink-0">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Progress</span>
              <span className="text-[10px] font-bold text-[#2D8CF0]">65%</span>
            </div>
            <div className="h-[4px] bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[#2D8CF0] to-[#1A73E8] rounded-full"
                initial={{ width: 0 }}
                animate={{ width: '65%' }}
                transition={{ duration: 1.2, delay: 0.6 }}
              />
            </div>
          </div>

          {/* ── Scrollable Quiz Content ── */}
          <div className="flex-1 overflow-y-auto px-5 pb-[90px]">
            {/* Question Card — with left accent */}
            <motion.div
              className="bg-white rounded-2xl p-5 mb-5 border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.04)] relative overflow-hidden"
              animate={{ boxShadow: ["0 2px 12px rgba(45,140,240,0.04)", "0 4px 20px rgba(45,140,240,0.08)", "0 2px 12px rgba(45,140,240,0.04)"] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              {/* Left accent bar */}
              <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b from-[#2D8CF0] to-[#1A73E8] rounded-l-2xl" />
              <div className="flex items-center gap-2 mb-3 ml-2">
                <div className="w-6 h-6 rounded-md bg-[#2D8CF0] flex items-center justify-center">
                  <Lightbulb className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-[10px] font-bold text-[#2D8CF0] tracking-wider uppercase">Question 13 of 20</span>
                <span className="ml-auto text-[9px] font-semibold text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">+2 marks</span>
              </div>
              <p className="text-gray-800 font-semibold text-[14px] leading-[1.6] ml-2">
                Which of the following introduced the principle of communal representation in India?
              </p>
            </motion.div>

            {/* Answer Options — refined cards */}
            <div className="space-y-2">
              {[
                { id: 'A', text: 'Indian Councils Act, 1892', selected: false },
                { id: 'B', text: 'Indian Councils Act, 1909', selected: true },
                { id: 'C', text: 'Government of India Act, 1919', selected: false },
                { id: 'D', text: 'Government of India Act, 1935', selected: false },
              ].map((opt, i) => (
                <motion.div
                  key={opt.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + i * 0.08 }}
                  className={`rounded-xl p-3.5 flex items-center gap-3 transition-all border-2 ${opt.selected
                    ? 'bg-green-50 border-green-400 shadow-sm'
                    : 'bg-white border-gray-100 hover:border-gray-200 cursor-pointer'
                    }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${opt.selected
                    ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-500'
                    }`}>
                    {opt.selected ? <Check className="w-3.5 h-3.5" /> : opt.id}
                  </div>
                  <span className={`text-[13px] font-medium ${opt.selected ? 'text-green-700 font-bold' : 'text-gray-700'
                    }`}>
                    {opt.text}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* ── Floating "Next Question" — brand blue, pinned above bezel ── */}
          <div className="absolute bottom-0 inset-x-0 p-4 pb-7 bg-gradient-to-t from-slate-50 via-slate-50/95 to-transparent z-10">
            <motion.button
              className="w-full bg-gradient-to-r from-[#2D8CF0] to-[#1A73E8] text-white rounded-2xl py-3.5 font-bold text-sm shadow-lg shadow-[#2D8CF0]/25 relative overflow-hidden"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Shine overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent rounded-2xl" />
              <span className="relative z-10">Next Question →</span>
            </motion.button>
          </div>

        </div>
      </div>

      {/* Floating Stats — Streak */}
      <motion.div
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 1 }}
        className="absolute top-16 -right-20 bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] border border-gray-100/80"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">12 Day Streak!</div>
            <div className="text-xs text-gray-500">You're on fire! 🔥</div>
          </div>
        </div>
      </motion.div>

      {/* Floating Stats — Accuracy */}
      <motion.div
        initial={{ opacity: 0, x: -60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, delay: 1.2 }}
        className="absolute bottom-28 -left-24 bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.12)] border border-gray-100/80"
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
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [isHoveringTestimonial, setIsHoveringTestimonial] = useState(false);
  const [slideDirection, setSlideDirection] = useState(1); // 1 = right, -1 = left
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('sb-access-token');
    if (token) router.push('/dashboard');
  }, [router]);

  // Auto-advance testimonial carousel
  useEffect(() => {
    if (isHoveringTestimonial) return;
    const timer = setInterval(() => {
      setSlideDirection(1);
      setActiveTestimonial((prev: number) => (prev + 1) % 3);
    }, 5000);
    return () => clearInterval(timer);
  }, [isHoveringTestimonial]);

  // UPDATED 9 FEATURES - EXACT ICON MATCH from Ionicons (matching my-app source)
  const features = [
    {
      icon: IoNewspaperOutline,
      title: 'News Feed',
      description: 'Stay ahead with AI-curated daily current affairs, auto-tagged by syllabus topic. Never miss a critical update from The Hindu or Indian Express.',
      gradient: 'from-[#2D8CF0] to-[#1A73E8]'
    },
    {
      icon: IoCreateOutline,
      title: 'AI MCQs Generate',
      description: 'Generate unlimited, exam-level multiple choice questions from any topic. Master your weak areas with adaptive difficulty levels.',
      gradient: 'from-[#2D8CF0] to-cyan-500'
    },
    {
      icon: IoGitNetworkOutline,
      title: 'AI Mind Map',
      description: 'Transform complex topics into intuitive, memorable visual hierarchies. Perfect for quick revision and connecting the dots between concepts.',
      gradient: 'from-indigo-500 to-purple-500'
    },
    {
      icon: IoDocumentAttachOutline,
      title: 'Generate MCQs from PDF',
      description: 'Turn standard books and NCERTs into active learning quizzes. Upload any PDF and let our AI create a custom test suite in seconds.',
      gradient: 'from-red-400 to-pink-500'
    },
    {
      icon: IoDocumentTextOutline,
      title: 'Mains Answer Evaluation',
      description: 'Get world-class feedback from an AI examiner trained on topper scripts. Receive detailed scoring on structure, content, and relevance.',
      gradient: 'from-orange-400 to-yellow-500'
    },
    {
      icon: IoCreateOutline,
      title: 'Upload Notes',
      description: 'Digitize your preparation. Organize handwritten notes, PDFs, and web clippings in one searchable, intelligent knowledge base.',
      gradient: 'from-purple-500 to-indigo-500'
    },
    {
      icon: IoSparklesOutline,
      title: 'AI Notes Maker',
      description: 'Stop copying, start understanding. Instantly generate concise, high-yield notes and summaries from any text or article.',
      gradient: 'from-emerald-400 to-green-500'
    },
    {
      icon: IoDocumentsOutline,
      title: 'Question Bank',
      description: 'Access a vast repository of previous years\' questions and premium mock tests, detailed with solutions and performance analytics.',
      gradient: 'from-amber-400 to-yellow-500'
    },
    {
      icon: IoStatsChartOutline,
      title: 'Progress',
      description: 'Track your journey with precision. Visualize your strengths, identify gaps, and get AI-driven recommendations to optimize your study plan.',
      gradient: 'from-[#1A73E8] to-[#115EA3]'
    },
  ];

  const testimonials = [
    { name: 'Priya Sharma', role: 'UPSC Aspirant', content: 'The AI Mains Evaluation is startlingly accurate. It caught structural issues in my essays that I missed for months. A game changer.' },
    { name: 'Rahul Krishnan', role: 'UPSC Aspirant', content: 'Mind maps turned my chaotic history notes into a visual timeline. I could revise the entire Modern History syllabus in 2 hours before the Prelims.' },
    { name: 'Ananya Gupta', role: 'UPSC Aspirant', content: 'The News Feed saves me at least 90 minutes every morning. Relevant, tagged, and concise - exactly what a serious aspirant needs.' },
  ];

  const stats = [
    { value: 15000, suffix: '+', label: 'Active Aspirants' },
    { value: 500, suffix: '+', label: 'Success Stories' },
    { value: 98, suffix: '%', label: 'Satisfaction' },
    { value: 2, suffix: 'M+', label: 'Questions Solved' },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-hidden font-sans selection:bg-yellow-100 selection:text-yellow-900">
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-shimmer { animation: shimmer 3s ease-in-out infinite; }
        @keyframes grid-flow {
          0% { background-position: 0 0; }
          100% { background-position: 4rem 4rem; }
        }
        .animate-grid-flow { animation: grid-flow 20s linear infinite; }
        .perspective-1000 { perspective: 1000px; }
      `}</style>

      {/* Background layers */}
      <GridBackground />
      <FloatingParticles />

      {/* Gradient orbs - REFINED for Premium look */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-gradient-to-br from-[#2D8CF0]/10 to-[#2D8CF0]/15 blur-[120px]"
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
        />
        <motion.div
          className="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-gradient-to-br from-yellow-100/30 to-[#2D8CF0]/10 blur-[120px]"
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
        <div className="max-w-6xl mx-auto backdrop-blur-2xl bg-white/85 border border-gray-200/60 rounded-[1.25rem] px-8 py-4 flex items-center justify-between shadow-lg shadow-gray-200/30">
          <PrepAssistLogo />

          <div className="hidden md:flex items-center gap-10">
            {['Features', 'Testimonials', 'Pricing'].map((item) => (
              <motion.a
                key={item}
                href={item === 'Pricing' ? '/pricing' : `#${item.toLowerCase()}`}
                className="text-gray-600 hover:text-[#2D8CF0] text-sm font-semibold tracking-wide uppercase transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                {item}
              </motion.a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <motion.a
              href="https://app.prepassist.in/login"
              className="text-gray-900 border border-gray-200 hover:bg-gray-50 text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm"
              whileHover={{ scale: 1.05 }}
            >
              Sign In
            </motion.a>
            <MagneticButton
              href="https://app.prepassist.in/login"
              className="bg-[#2D8CF0] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:bg-[#1A73E8] transition-all inline-block"
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
              <a href="#features" className="block text-gray-700 hover:text-[#2D8CF0] text-lg font-semibold py-2">Features</a>
              <a href="#testimonials" className="block text-gray-700 hover:text-[#2D8CF0] text-lg font-semibold py-2">Testimonials</a>
              <a href="/pricing" className="block text-gray-700 hover:text-[#2D8CF0] text-lg font-semibold py-2">Pricing</a>
              <div className="pt-4 space-y-3">
                <a href="https://app.prepassist.in/login" className="block bg-[#2D8CF0] text-white px-6 py-4 rounded-xl font-bold text-center shadow-lg shadow-blue-500/20">
                  Start Free Trial
                </a>
                <a href="https://app.prepassist.in/login" className="block border border-gray-200 text-gray-900 px-6 py-4 rounded-xl font-bold text-center">
                  Sign In
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-48 pb-24 px-6 md:px-10">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left Content */}
            <div className="relative z-10">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-[1.05] tracking-tight text-black">
                  Your Personal
                  <br />
                  <ShimmerText>AI Mentor</ShimmerText>
                  <br />
                  for UPSC
                </h1>

                <p className="text-xl text-gray-500 max-w-lg mb-10 leading-relaxed font-medium tracking-wide">
                  Join <span className="font-bold text-gray-900 border-b-2 border-blue-400">15,000+ aspirants</span> engaging with the most advanced AI preparation ecosystem.
                </p>

                <div className="flex flex-wrap gap-4 mb-12">
                  <MagneticButton
                    href="https://app.prepassist.in/login"
                    className="inline-flex items-center gap-3 bg-[#2D8CF0] text-white px-8 py-4 rounded-2xl font-bold text-lg shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 hover:bg-[#1A73E8] transition-all"
                  >
                    Start Learning Free <ArrowRight className="w-5 h-5" />
                  </MagneticButton>
                  <MagneticButton
                    href="https://app.prepassist.in/login"
                    className="inline-flex items-center gap-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-900 px-8 py-4 rounded-2xl font-bold text-lg transition-all shadow-sm"
                  >
                    Login
                  </MagneticButton>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex -space-x-3">
                    {[Users, GraduationCap, Award, BookOpen, Target].map((Icon, i) => (
                      <motion.div
                        key={i}
                        className="w-12 h-12 rounded-full bg-white border-4 border-white flex items-center justify-center text-xl shadow-md"
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                      >
                        <Icon className="w-5 h-5 text-gray-600" />
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

            {/* Phone Mockup - RESTORED ORIGINAL */}
            <div className="relative flex justify-center lg:justify-end">
              <PhoneMockup />
            </div>
          </div>
        </div>
      </section>



      {/* Stats Section */}
      <section className="py-24 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {stats.map((stat, i) => (
              <StatCounter key={i} {...stat} />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - PREMIUM & REALISTIC */}
      <section id="features" className="py-32 px-6 bg-gradient-to-b from-gray-50/80 to-white relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#2D8CF0]/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-yellow-50/40 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto relative z-10">
          <RevealOnScroll className="text-center mb-24">
            <PremiumBadge color="yellow">POWERFUL FEATURES</PremiumBadge>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mt-6 mb-6 tracking-tight text-gray-900">
              Everything you need to
              <br />
              <ShimmerText>crack the exam</ShimmerText>
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
              Replace scattered books and outdated websites with one unified, intelligent platform specifically designed for the modern aspirant.
            </p>
          </RevealOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <FeatureCard key={i} {...feature} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section — Single Card Carousel */}
      <section id="testimonials" className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <RevealOnScroll className="text-center mb-20">
            <PremiumBadge color="blue">SUCCESS STORIES</PremiumBadge>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mt-6 mb-6 tracking-tight">
              Loved by
              <br />
              <ShimmerText>toppers & aspirants</ShimmerText>
            </h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto font-medium">
              Real results from serious candidates who switched to smart preparation.
            </p>
          </RevealOnScroll>

          {/* Carousel */}
          <div
            className="relative"
            onMouseEnter={() => setIsHoveringTestimonial(true)}
            onMouseLeave={() => setIsHoveringTestimonial(false)}
          >
            {/* Left Arrow */}
            <button
              onClick={() => { setSlideDirection(-1); setActiveTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length); }}
              className="absolute left-0 md:-left-16 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white border border-gray-200 shadow-md hover:shadow-lg hover:border-[#2D8CF0]/30 flex items-center justify-center transition-all group"
            >
              <ChevronLeft className="w-5 h-5 text-gray-400 group-hover:text-[#2D8CF0] transition-colors" />
            </button>

            {/* Right Arrow */}
            <button
              onClick={() => { setSlideDirection(1); setActiveTestimonial((prev) => (prev + 1) % testimonials.length); }}
              className="absolute right-0 md:-right-16 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full bg-white border border-gray-200 shadow-md hover:shadow-lg hover:border-[#2D8CF0]/30 flex items-center justify-center transition-all group"
            >
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#2D8CF0] transition-colors" />
            </button>

            {/* Card Container — classic slider */}
            <div className="overflow-hidden px-4 md:px-0">
              <div
                className="flex transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
                style={{ transform: `translateX(-${activeTestimonial * 100}%)` }}
              >
                {testimonials.map((t, i) => (
                  <div key={i} className="w-full flex-shrink-0">
                    <TestimonialCard {...t} index={0} />
                  </div>
                ))}
              </div>
            </div>

            {/* Dot indicators */}
            <div className="flex items-center justify-center gap-2 mt-10">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTestimonial(i)}
                  className={`rounded-full transition-all duration-300 ${i === activeTestimonial
                    ? 'w-8 h-2.5 bg-[#2D8CF0]'
                    : 'w-2.5 h-2.5 bg-gray-200 hover:bg-gray-300'
                    }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section — Premium */}
      <section className="py-28 px-6 md:px-10">
        <div className="max-w-6xl mx-auto">
          <RevealOnScroll>
            <div className="relative overflow-hidden rounded-[2rem] bg-[#0c2d5a] p-[2px]">
              {/* Animated gradient border */}
              <div className="absolute inset-0 bg-gradient-to-r from-[#2D8CF0] via-yellow-400/50 to-[#2D8CF0] opacity-70 rounded-[2rem] animate-shimmer" style={{ backgroundSize: '200% 200%' }} />

              {/* Inner container */}
              <div className="relative bg-[#0F172A] rounded-[calc(2rem-2px)] p-12 md:p-20 overflow-hidden">
                {/* Subtle static globs instead of moving gradients */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-blue-600/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-amber-500/5 rounded-full blur-[100px]" />

                {/* Grid pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-20" />

                <div className="relative z-10 text-center">
                  {/* Badge */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-8"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white tracking-[0.15em] uppercase">Start Today</span>
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 text-white leading-[1.1] tracking-tight"
                  >
                    Ready to transform
                    <br />
                    your preparation?
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-lg text-slate-400 mb-12 max-w-xl mx-auto font-medium leading-relaxed"
                  >
                    Join thousands of serious aspirants using AI to prepare smarter, not harder.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-wrap gap-4 justify-center"
                  >
                    <MagneticButton
                      href="https://app.prepassist.in/login"
                      className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-xl font-bold text-base shadow-xl hover:bg-gray-100 transition-all relative overflow-hidden"
                    >
                      <span className="relative z-10 flex items-center gap-3">Start Your Free Trial <ArrowRight className="w-5 h-5" /></span>
                    </MagneticButton>
                    <MagneticButton className="inline-flex items-center gap-3 border border-white/20 bg-white/5 backdrop-blur-sm text-white px-8 py-4 rounded-xl font-bold text-base hover:bg-white/10 transition-all">
                      Talk to a Mentor
                    </MagneticButton>
                  </motion.div>


                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center justify-center gap-6 mt-10"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-white/45 font-medium">No credit card required</span>
                    </div>
                    <div className="w-1 h-1 rounded-full bg-white/20" />
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-white/45 font-medium">Free forever plan available</span>
                    </div>
                  </motion.div>
                </div>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* Footer — White Theme */}
      <footer className="relative bg-white border-t border-gray-100">
        {/* Top accent line */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-[#2D8CF0] to-transparent opacity-20" />

        <div className="max-w-6xl mx-auto px-6 md:px-10 pt-16 pb-8">
          {/* Main footer grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 pb-12 border-b border-gray-100">
            {/* Brand */}
            <div className="md:col-span-2">
              <PrepAssistLogo size="small" />
              <p className="text-gray-400 text-sm mt-4 max-w-xs leading-relaxed font-medium">
                India&apos;s most advanced AI-powered platform for UPSC Civil Services Examination preparation.
              </p>
              <div className="flex items-center gap-3 mt-6">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-gray-400 text-xs font-medium">4.9/5 from 2,000+ reviews</span>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xs font-bold text-[#2D8CF0] uppercase tracking-widest mb-4">Product</h4>
              <div className="space-y-3">
                {['Features', 'Pricing', 'Testimonials', 'FAQ'].map((item) => (
                  <a key={item} href={item === 'Pricing' ? '/pricing' : `#${item.toLowerCase()}`} className="block text-gray-400 hover:text-gray-700 text-sm font-medium transition-colors">
                    {item}
                  </a>
                ))}
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-xs font-bold text-[#2D8CF0] uppercase tracking-widest mb-4">Legal</h4>
              <div className="space-y-3">
                {['Privacy Policy', 'Terms of Service', 'Support', 'Contact'].map((item) => (
                  <a key={item} href="#" className="block text-gray-400 hover:text-gray-700 text-sm font-medium transition-colors">
                    {item}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col md:flex-row items-center justify-between pt-8 gap-4">
            <p className="text-gray-300 text-xs font-medium">
              &copy; 2026 PrepAssist. All rights reserved.
            </p>
            <p className="text-gray-300 text-xs font-medium">
              Built with <span className="text-yellow-400">❤️</span> for aspirants across India
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
