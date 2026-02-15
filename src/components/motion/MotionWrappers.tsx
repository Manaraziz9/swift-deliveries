import { motion, type HTMLMotionProps, type Variants } from 'framer-motion';
import React from 'react';

// ─── Fade-in from bottom ───
export const FadeIn: React.FC<HTMLMotionProps<'div'> & { delay?: number }> = ({
  delay = 0,
  children,
  ...props
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    {...props}
  >
    {children}
  </motion.div>
);

// ─── Scale-in (cards, modals) ───
export const ScaleIn: React.FC<HTMLMotionProps<'div'> & { delay?: number }> = ({
  delay = 0,
  children,
  ...props
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.92 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.35, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    {...props}
  >
    {children}
  </motion.div>
);

// ─── Stagger container ───
export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06,
    },
  },
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

export const StaggerList: React.FC<HTMLMotionProps<'div'>> = ({
  children,
  ...props
}) => (
  <motion.div
    variants={staggerContainer}
    initial="hidden"
    animate="show"
    {...props}
  >
    {children}
  </motion.div>
);

export const StaggerItem: React.FC<HTMLMotionProps<'div'>> = ({
  children,
  ...props
}) => (
  <motion.div variants={staggerItem} {...props}>
    {children}
  </motion.div>
);

// ─── Slide-in from edge (for bottom sheets, panels) ───
export const SlideUp: React.FC<HTMLMotionProps<'div'>> = ({
  children,
  ...props
}) => (
  <motion.div
    initial={{ opacity: 0, y: 40 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 40 }}
    transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
    {...props}
  >
    {children}
  </motion.div>
);

// ─── Press-scale interaction (for buttons/cards) ───
export const pressScale = {
  whileTap: { scale: 0.97 },
  whileHover: { scale: 1.02 },
  transition: { type: 'spring', stiffness: 400, damping: 17 },
};

// ─── Task completion celebration ───
export const Celebrate: React.FC<HTMLMotionProps<'div'> & { trigger?: boolean }> = ({
  trigger = true,
  children,
  ...props
}) => (
  <motion.div
    initial={false}
    animate={trigger ? { scale: [1, 1.15, 0.95, 1.05, 1] } : {}}
    transition={{ duration: 0.5, ease: 'easeOut' }}
    {...props}
  >
    {children}
  </motion.div>
);

// Re-export motion for direct use
export { motion };
