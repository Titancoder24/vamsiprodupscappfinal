'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    gradient?: string;
    delay?: number;
}

export function FeatureCard({ icon: Icon, title, description, gradient = 'from-blue-500 to-blue-600', delay = 0 }: FeatureCardProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
            whileHover={{ y: -8, transition: { duration: 0.3 } }}
            className="group relative"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />
            <div className="relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300">
                {/* Icon */}
                <motion.div
                    className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.2 }}
                >
                    <Icon className="w-6 h-6 text-white" />
                </motion.div>

                {/* Content */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{description}</p>

                {/* Hover indicator */}
                <motion.div
                    className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-b-2xl"
                    initial={{ scaleX: 0 }}
                    whileHover={{ scaleX: 1 }}
                    transition={{ duration: 0.3 }}
                />
            </div>
        </motion.div>
    );
}

interface FeatureSectionProps {
    title: string;
    subtitle?: string;
    features: Array<{
        icon: LucideIcon;
        title: string;
        description: string;
        gradient?: string;
    }>;
}

export function FeatureSection({ title, subtitle, features }: FeatureSectionProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    return (
        <section ref={ref} className="py-24 px-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{title}</h2>
                    {subtitle && <p className="text-gray-500 text-lg max-w-2xl mx-auto">{subtitle}</p>}
                </motion.div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {features.map((feature, i) => (
                        <FeatureCard
                            key={i}
                            icon={feature.icon}
                            title={feature.title}
                            description={feature.description}
                            gradient={feature.gradient}
                            delay={i * 0.1}
                        />
                    ))}
                </div>
            </div>
        </section>
    );
}

interface BentoCardProps {
    children: ReactNode;
    className?: string;
    delay?: number;
}

export function BentoCard({ children, className = '', delay = 0 }: BentoCardProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
            className={`bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden ${className}`}
        >
            {children}
        </motion.div>
    );
}
