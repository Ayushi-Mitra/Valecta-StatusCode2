'use client';

import { FC } from 'react';
import { motion } from 'framer-motion';

// Floating shapes to add visual interest to the hero section
const FloatingShapes: FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Top left shape */}
      <motion.div
        className="absolute top-20 left-10 w-12 h-12 rounded-full bg-primary/10"
        animate={{
          y: [0, 15, 0],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Middle right shape */}
      <motion.div
        className="absolute top-1/2 right-16 w-20 h-20 rounded-lg bg-accent/10 rotate-45"
        animate={{
          y: [0, -20, 0],
          opacity: [0.6, 0.9, 0.6],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Bottom left shape */}
      <motion.div
        className="absolute bottom-24 left-20 w-16 h-16 rounded-md bg-primary/10 rotate-12"
        animate={{
          y: [0, 10, 0],
          rotate: [12, 20, 12],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Small dots */}
      {[...Array(5)].map((_, index) => (
        <motion.div
          key={index}
          className={`absolute w-2 h-2 rounded-full bg-primary/20`}
          style={{
            top: `${20 + index * 15}%`,
            left: `${60 + (index % 3) * 10}%`,
          }}
          animate={{
            y: [0, index % 2 ? 10 : -10, 0],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 3 + index,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      ))}
    </div>
  );
};

export default FloatingShapes;
