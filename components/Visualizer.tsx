import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  analyser: AnalyserNode | null;
  isActive: boolean;
}

const Visualizer: React.FC<VisualizerProps> = ({ analyser, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | null>(null);
  const rotationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High DPI scaling
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const bufferLength = analyser ? analyser.frequencyBinCount : 0;
    const dataArray = analyser ? new Uint8Array(bufferLength) : new Uint8Array(0);

    const draw = () => {
      ctx.clearRect(0, 0, rect.width, rect.height);
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      if (analyser && isActive) {
        analyser.getByteFrequencyData(dataArray);
      }

      // Calculate Energy
      let sum = 0;
      if (isActive && dataArray.length > 0) {
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
      }
      const average = sum / (dataArray.length || 1);
      const pulse = isActive ? (average / 255) * 60 : 5;
      
      // Rotate the divine ring
      rotationRef.current += 0.005 + (pulse * 0.001);

      // --- LAYER 1: The Divine Glow (Back) ---
      const glowRadius = rect.width * 0.25 + pulse;
      const gradient = ctx.createRadialGradient(centerX, centerY, glowRadius * 0.5, centerX, centerY, glowRadius + 50);
      gradient.addColorStop(0, 'rgba(251, 191, 36, 0.2)'); // Amber
      gradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.1)'); // Orange
      gradient.addColorStop(1, 'rgba(0,0,0,0)');
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, glowRadius + 50, 0, 2 * Math.PI);
      ctx.fillStyle = gradient;
      ctx.fill();

      // --- LAYER 2: The Chakra Rings (DI Side) ---
      const ringRadius = rect.width * 0.22;
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(rotationRef.current);
      
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius + pulse * 0.5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.3)'; // Gold
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 15]); // Dotted spiritual line
      ctx.stroke();
      
      ctx.beginPath();
      ctx.arc(0, 0, ringRadius + 15 + pulse, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.2)'; // Darker Gold
      ctx.lineWidth = 2;
      ctx.setLineDash([20, 10]);
      ctx.stroke();
      ctx.restore();

      // --- LAYER 3: The AI Core (Front/Inner) ---
      // Draw frequency bars in a circle
      if (isActive && analyser) {
        const barCount = 120; // More detail
        const angleStep = (Math.PI * 2) / barCount;
        
        for (let i = 0; i < barCount; i++) {
          const index = Math.floor((i / barCount) * (bufferLength)); 
          const value = dataArray[index] || 0;
          const barHeight = (value / 255) * 60;
          
          const angle = i * angleStep;
          
          const isRightSide = Math.cos(angle) > 0; // Right is DI, Left is AI

          // Start point
          const startX = centerX + Math.cos(angle) * (ringRadius - 10);
          const startY = centerY + Math.sin(angle) * (ringRadius - 10);
          
          // End point
          const endX = centerX + Math.cos(angle) * (ringRadius + barHeight);
          const endY = centerY + Math.sin(angle) * (ringRadius + barHeight);

          ctx.beginPath();
          ctx.moveTo(startX, startY);
          ctx.lineTo(endX, endY);
          ctx.lineWidth = 2;
          
          if (isRightSide) {
             // Divine Side: Gold/Warm
             ctx.strokeStyle = `rgba(251, 191, 36, ${value/255 + 0.2})`; 
             ctx.lineCap = 'round';
          } else {
             // AI Side: Cyan/Cool, techy
             ctx.strokeStyle = `rgba(6, 182, 212, ${value/255 + 0.2})`;
             ctx.lineCap = 'butt';
          }
          
          ctx.stroke();
        }
      } else {
        // Idle Ring
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      
      requestRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [analyser, isActive]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full absolute inset-0 z-0 pointer-events-none"
    />
  );
};

export default Visualizer;