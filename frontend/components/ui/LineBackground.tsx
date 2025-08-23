'use client';

import '@/app/lineBackground.css';
import { useEffect, useRef } from 'react';

export default function LineBackground() {
  const linesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (linesRef.current) {
      const lines = linesRef.current.querySelectorAll('.line');
      
      lines.forEach(line => {
        // Give each line a random horizontal position
        const randomPosition = Math.random() * 100;
        (line as HTMLElement).style.left = `${randomPosition}%`;
      });
    }
  }, []);

  return (
    <div className="lines-background">
      <div className="lines" ref={linesRef}>
        <div className="line"></div>
        <div className="line"></div>
        <div className="line"></div>
        <div className="line"></div>
        <div className="line"></div>
        <div className="line"></div>
        <div className="line"></div>
        <div className="line"></div>
        <div className="line"></div>
        <div className="line"></div>
      </div>
    </div>
  );
}