'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedGradientProps {
    children?: ReactNode;
    className?: string;
}

export function AnimatedGradient({ children, className = '' }: AnimatedGradientProps) {
    return (
        <div className={`relative overflow-hidden ${className}`}>
            {/* Animated gradient orbs */}
            <motion.div
                className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-500/30 blur-3xl"
                animate={{
                    x: [0, 50, 0],
                    y: [0, 30, 0],
                    scale: [1, 1.1, 1],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />
            <motion.div
                className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-gradient-to-tr from-cyan-400/30 to-blue-500/30 blur-3xl"
                animate={{
                    x: [0, -30, 0],
                    y: [0, -50, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />
            <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gradient-to-r from-indigo-400/20 to-pink-400/20 blur-3xl"
                animate={{
                    scale: [1, 1.3, 1],
                    rotate: [0, 180, 360],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: 'linear',
                }}
            />
            {/* Content */}
            <div className="relative z-10">{children}</div>
        </div>
    );
}

interface GlowingOrbProps {
    size?: 'sm' | 'md' | 'lg';
    color?: 'blue' | 'purple' | 'cyan' | 'orange';
    className?: string;
}

export function GlowingOrb({ size = 'md', color = 'blue', className = '' }: GlowingOrbProps) {
    const sizes = {
        sm: 'w-32 h-32',
        md: 'w-64 h-64',
        lg: 'w-96 h-96',
    };

    const colors = {
        blue: 'from-blue-400/40 to-blue-600/40',
        purple: 'from-purple-400/40 to-purple-600/40',
        cyan: 'from-cyan-400/40 to-cyan-600/40',
        orange: 'from-orange-400/40 to-orange-600/40',
    };

    return (
        <motion.div
            className={`absolute rounded-full bg-gradient-to-br ${colors[color]} ${sizes[size]} blur-3xl ${className}`}
            animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
            }}
            transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
            }}
        />
    );
}
