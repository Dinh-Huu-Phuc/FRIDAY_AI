"use client";

import { useEffect, useRef } from "react";

export default function VideoHeroBackground({ compact = false }) {
  return (
    <div className={`friday-hero-bg ${compact ? "friday-hero-bg-compact" : ""}`} aria-hidden="true">
      <video className="friday-hero-video" autoPlay muted loop playsInline preload="metadata">
        <source src="/video/FIRDAY.mp4" type="video/mp4" />
        <source src="/video/FRIDAY2.mp4" type="video/mp4" />
      </video>
      <ParticleField />
      <div className="friday-hero-overlay" />
      <div className="friday-hero-grid" />
      <div className="friday-hero-scanline" />
    </div>
  );
}

function ParticleField() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    let animationFrame;
    let width = 0;
    let height = 0;
    let particles = [];

    function resize() {
      const ratio = window.devicePixelRatio || 1;
      width = canvas.offsetWidth;
      height = canvas.offsetHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.min(120, Math.max(48, Math.floor((width * height) / 16000)));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.8 + 0.6
      }));
    }

    function draw() {
      context.clearRect(0, 0, width, height);
      context.fillStyle = "rgba(103, 232, 249, 0.72)";
      context.strokeStyle = "rgba(103, 232, 249, 0.08)";
      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        if (particle.x < 0 || particle.x > width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > height) particle.vy *= -1;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
        context.fill();
      }
      for (let i = 0; i < particles.length; i += 1) {
        for (let j = i + 1; j < particles.length; j += 1) {
          const a = particles[i];
          const b = particles[j];
          const distance = Math.hypot(a.x - b.x, a.y - b.y);
          if (distance < 110) {
            context.globalAlpha = 1 - distance / 110;
            context.beginPath();
            context.moveTo(a.x, a.y);
            context.lineTo(b.x, b.y);
            context.stroke();
            context.globalAlpha = 1;
          }
        }
      }
      animationFrame = requestAnimationFrame(draw);
    }

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return <canvas ref={canvasRef} className="friday-particle-canvas" />;
}
