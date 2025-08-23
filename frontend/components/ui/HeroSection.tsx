'use client';

import { FC } from 'react';
import Link from 'next/link';
import { ArrowRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import FloatingShapes from './FloatingShapes';

const HeroSection: FC = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.6, ease: "easeOut" as const }
    }
  };

  return (
    <section className="py-20 px-6 relative z-10 overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 z-0"></div>
      <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl"></div>
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/5 blur-3xl"></div>
      
      <FloatingShapes />
      
      <motion.div 
        className="container mx-auto text-center relative z-10"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div variants={itemVariants}>
          <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
            <Zap className="h-4 w-4 mr-2" />
            AI-Powered Job Matching
          </Badge>
        </motion.div>
        
        <motion.h1 
          className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight"
          variants={itemVariants}
        >
          Find Your Dream Job with
          <span className="text-primary block mt-2 relative">
            Intelligent Matching
            <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-primary/40 rounded-full blur-sm"></span>
          </span>
        </motion.h1>
        
        <motion.p 
          className="text-xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed"
          variants={itemVariants}
        >
          Experience the future of job hunting with our AI-powered platform that analyzes your resume, conducts
          intelligent interviews, and matches you with perfect opportunities.
        </motion.p>
        
        <motion.div 
          className="flex flex-col sm:flex-row justify-center items-center gap-4"
          variants={itemVariants}
        >
          <Link href="/auth">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-lg px-8 py-6 rounded-xl shadow-lg shadow-primary/20 transition-all duration-300 hover:shadow-xl hover:shadow-primary/30"
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <div className="mt-6 sm:mt-0 flex items-center gap-1">
            <span className="text-sm text-muted-foreground">Trusted by</span>
            <span className="text-sm font-semibold">1000+</span>
            <span className="text-sm text-muted-foreground">companies</span>
          </div>
        </motion.div>
        
        {/* Simple stats display */}
        <motion.div 
          className="mt-16 grid grid-cols-2 md:grid-cols-3 gap-4 max-w-2xl mx-auto"
          variants={itemVariants}
        >
          <div className="bg-card/30 backdrop-blur-sm p-4 rounded-lg border border-border/30">
            <p className="text-2xl font-bold text-primary">95%</p>
            <p className="text-sm text-muted-foreground">Match Rate</p>
          </div>
          <div className="bg-card/30 backdrop-blur-sm p-4 rounded-lg border border-border/30">
            <p className="text-2xl font-bold text-primary">2x</p>
            <p className="text-sm text-muted-foreground">Faster Hiring</p>
          </div>
          <div className="hidden md:block bg-card/30 backdrop-blur-sm p-4 rounded-lg border border-border/30">
            <p className="text-2xl font-bold text-primary">24/7</p>
            <p className="text-sm text-muted-foreground">AI Support</p>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
