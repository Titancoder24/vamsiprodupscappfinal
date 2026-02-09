'use client';

import { motion, useInView } from 'framer-motion';
import { useRef, ReactNode } from 'react';

interface TextRevealProps {
    children: ReactNode;
    className?: string;
    delay?: number;
}

export function TextReveal({ children, className = '', delay = 0 }: TextRevealProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

interface WordRevealProps {
    text: string;
    className?: string;
    delay?: number;
}

export function WordReveal({ text, className = '', delay = 0 }: WordRevealProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });
    const words = text.split(' ');

    return (
        <motion.div ref={ref} className={`flex flex-wrap ${className}`}>
            {words.map((word, i) => (
                <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{
                        duration: 0.5,
                        delay: delay + i * 0.1,
                        ease: [0.22, 1, 0.36, 1],
                    }}
                    className="mr-2"
                >
                    {word}
                </motion.span>
            ))}
        </motion.div>
    );
}

interface CharacterRevealProps {
    text: string;
    className?: string;
    delay?: number;
}

export function CharacterReveal({ text, className = '', delay = 0 }: CharacterRevealProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });
    const characters = text.split('');

    return (
        <motion.span ref={ref} className={className}>
            {characters.map((char, i) => (
                <motion.span
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                    transition={{
                        duration: 0.3,
                        delay: delay + i * 0.02,
                        ease: 'easeOut',
                    }}
                >
                    {char}
                </motion.span>
            ))}
        </motion.span>
    );
}

interface FadeInProps {
    children: ReactNode;
    className?: string;
    delay?: number;
    direction?: 'up' | 'down' | 'left' | 'right';
}

export function FadeIn({ children, className = '', delay = 0, direction = 'up' }: FadeInProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-50px' });

    const directions = {
        up: { y: 40, x: 0 },
        down: { y: -40, x: 0 },
        left: { y: 0, x: 40 },
        right: { y: 0, x: -40 },
    };

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, ...directions[direction] }}
            animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...directions[direction] }}
            transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
            className={className}
        >
            {children}
        </motion.div>
    );
}
