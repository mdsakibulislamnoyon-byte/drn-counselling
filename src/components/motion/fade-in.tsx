'use client';

import { motion, type Variants } from 'framer-motion';

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  duration?: number;
}

const OFFSET = 28;

function getVariants(direction: FadeInProps['direction'], duration: number): Variants {
  const offset =
    direction === 'up'
      ? { y: OFFSET }
      : direction === 'down'
        ? { y: -OFFSET }
        : direction === 'left'
          ? { x: OFFSET }
          : direction === 'right'
            ? { x: -OFFSET }
            : {};

  return {
    hidden: { opacity: 0, ...offset },
    show: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration, ease: [0.21, 0.47, 0.32, 0.98] },
    },
  };
}

/** Fades + slides content in once, the moment it scrolls into view. */
export function FadeIn({ children, className, delay = 0, direction = 'up', duration = 0.6 }: FadeInProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      variants={getVariants(direction, duration)}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Wraps a list of children so each one fades in slightly after the last —
 * pass items as an array of React nodes rather than a single child.
 */
export function StaggerGroup({
  children,
  className,
  staggerDelay = 0.08,
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}) {
  const containerVariants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: staggerDelay } },
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-80px' }}
      variants={containerVariants}
    >
      {children}
    </motion.div>
  );
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.21, 0.47, 0.32, 0.98] } },
};

/** A single item inside a <StaggerGroup>. */
export function StaggerItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}
