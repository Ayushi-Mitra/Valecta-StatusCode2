"use client";
import React from "react";


export function BackgroundRippleEffect() {
  // Render several animated ripples for dark backgrounds
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {Array.from({ length: 7 }).map((_, i) => (
        <span
          key={i}
          className="fixed rounded-full bg-white/20 blur-lg animate-ripple"
          style={{
            left: `${10 + i * 12}%`,
            top: `${20 + i * 8}%`,
            width: `${180 + i * 40}px`,
            height: `${180 + i * 40}px`,
            animationDelay: `${i * 0.7}s`,
            boxShadow: '0 0 32px 8px rgba(255,255,255,0.12)',
          }}
        />
      ))}
      <style jsx>{`
        @keyframes ripple {
          0% {
            opacity: 0.5;
            transform: scale(0.8);
          }
          50% {
            opacity: 0.8;
            transform: scale(1.1);
          }
          100% {
            opacity: 0.3;
            transform: scale(1.3);
          }
        }
        .animate-ripple {
          animation: ripple 3.5s infinite linear;
        }
      `}</style>
    </div>
  );
}