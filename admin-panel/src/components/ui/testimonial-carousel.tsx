'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

interface Testimonial {
    name: string;
    role: string;
    content: string;
    avatar?: string;
}

interface TestimonialCarouselProps {
    testimonials: Testimonial[];
    autoPlay?: boolean;
    interval?: number;
}

export function TestimonialCarousel({ testimonials, autoPlay = true, interval = 5000 }: TestimonialCarouselProps) {
    const [current, setCurrent] = useState(0);
    const [direction, setDirection] = useState(0);

    useEffect(() => {
        if (!autoPlay) return;
        const timer = setInterval(() => {
            setDirection(1);
            setCurrent((prev) => (prev + 1) % testimonials.length);
        }, interval);
        return () => clearInterval(timer);
    }, [autoPlay, interval, testimonials.length]);

    const next = () => {
        setDirection(1);
        setCurrent((prev) => (prev + 1) % testimonials.length);
    };

    const prev = () => {
        setDirection(-1);
        setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 100 : -100,
            opacity: 0,
        }),
        center: {
            x: 0,
            opacity: 1,
        },
        exit: (direction: number) => ({
            x: direction < 0 ? 100 : -100,
            opacity: 0,
        }),
    };

    return (
        <div className="relative max-w-4xl mx-auto">
            {/* Background decoration */}
            <div className="absolute -top-8 -left-8 text-blue-100">
                <Quote className="w-24 h-24" />
            </div>

            {/* Carousel */}
            <div className="relative overflow-hidden rounded-3xl bg-white border border-gray-100 shadow-xl p-8 md:p-12">
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={current}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="text-center"
                    >
                        {/* Stars */}
                        <div className="flex justify-center gap-1 mb-6">
                            {[...Array(5)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                </motion.div>
                            ))}
                        </div>

                        {/* Quote */}
                        <p className="text-xl md:text-2xl text-gray-700 leading-relaxed mb-8 font-medium">
                            "{testimonials[current].content}"
                        </p>

                        {/* Author */}
                        <div className="flex items-center justify-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                {testimonials[current].name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="text-left">
                                <div className="font-semibold text-gray-900">{testimonials[current].name}</div>
                                <div className="text-gray-500 text-sm">{testimonials[current].role}</div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex justify-center gap-4 mt-8">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={prev}
                        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </motion.button>

                    {/* Dots */}
                    <div className="flex items-center gap-2">
                        {testimonials.map((_, i) => (
                            <motion.button
                                key={i}
                                onClick={() => {
                                    setDirection(i > current ? 1 : -1);
                                    setCurrent(i);
                                }}
                                className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-blue-500 w-6' : 'bg-gray-300'
                                    }`}
                                whileHover={{ scale: 1.2 }}
                            />
                        ))}
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={next}
                        className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                    </motion.button>
                </div>
            </div>
        </div>
    );
}

interface TestimonialGridProps {
    testimonials: Testimonial[];
}

export function TestimonialGrid({ testimonials }: TestimonialGridProps) {
    return (
        <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-lg transition-all"
                >
                    {/* Stars */}
                    <div className="flex gap-1 mb-4">
                        {[...Array(5)].map((_, j) => (
                            <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                    </div>

                    {/* Content */}
                    <p className="text-gray-600 mb-6 leading-relaxed">"{testimonial.content}"</p>

                    {/* Author */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                            {testimonial.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                            <div className="font-semibold text-gray-900 text-sm">{testimonial.name}</div>
                            <div className="text-gray-500 text-xs">{testimonial.role}</div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
