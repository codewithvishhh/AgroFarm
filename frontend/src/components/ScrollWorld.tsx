import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

import { useReducedMotion } from "../hooks/useReducedMotion";

/**
 * Scroll World — enhanced 3D scroll-scrubbed fly-through of the AgroFarm supply chain.
 *
 * Multiple depth planes (sky, distant ridge, layered fields, transport corridor,
 * floating ambient motes, foreground canopy) with camera dolly and subtle pointer 3D tilt.
 */
export function ScrollWorld({
  containerRef,
}: {
  containerRef: RefObject<HTMLElement>;
}) {
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    container: containerRef,
    offset: ["start start", "end end"],
  });

  // Springing the progress keeps the camera continuous and cinematic.
  const progress = useSpring(scrollYProgress, {
    stiffness: 65,
    damping: 24,
    mass: 0.4,
  });

  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (reduced) return;
    let animId = 0;
    const handlePointer = (e: PointerEvent) => {
      if (animId) return;
      animId = requestAnimationFrame(() => {
        animId = 0;
        const normX = (e.clientX / window.innerWidth - 0.5) * 2;
        const normY = (e.clientY / window.innerHeight - 0.5) * 2;
        setMouseOffset({ x: normX, y: normY });
      });
    };
    window.addEventListener("pointermove", handlePointer, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handlePointer);
      if (animId) cancelAnimationFrame(animId);
    };
  }, [reduced]);

  const still = reduced;
  const depth = (from: number, to: number): MotionValue<number> =>
    useTransform(progress, [0, 1], still ? [0, 0] : [from, to]);

  const skyY = depth(0, 70);
  const ridgeY = depth(0, 150);
  const fieldY = depth(0, 320);
  const frontY = depth(0, 560);
  const cameraZ = useTransform(progress, [0, 1], still ? [1, 1] : [1, 1.38]);
  const haze = useTransform(progress, [0, 0.5, 1], [0.20, 0.48, 0.75]);
  const truckX = useTransform(progress, [0.12, 0.88], still ? [0, 0] : [-30, 130]);
  const truckXvw = useTransform(truckX, (value) => `${value}vw`);

  // Subtle 3D tilt angles calculated from pointer
  const tiltX = still ? 0 : mouseOffset.y * -3.5;
  const tiltY = still ? 0 : mouseOffset.x * 4.5;

  return (
    <div
      aria-hidden
      style={{ perspective: "1200px" }}
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[radial-gradient(130%_100%_at_50%_-10%,#15452F_0%,#0A2418_40%,#06120C_78%)]"
    >
      <motion.div
        style={{
          scale: cameraZ,
          rotateX: tiltX,
          rotateY: tiltY,
          transformStyle: "preserve-3d",
        }}
        transition={{ type: "spring", stiffness: 100, damping: 30 }}
        className="absolute inset-0 will-transform"
      >
        {/* Layer 0: Sun shafts & volumetric atmospheric glow */}
        <motion.div style={{ y: skyY, transform: "translateZ(-80px)" }} className="absolute inset-x-0 top-0 h-[75vh]">
          <div className="absolute left-1/4 top-[-30vh] h-[95vh] w-[42vw] -rotate-12 bg-gradient-to-b from-crop/18 via-crop/5 to-transparent blur-3xl" />
          <div className="absolute right-1/4 top-[-32vh] h-[90vh] w-[30vw] rotate-6 bg-gradient-to-b from-harvest/12 via-harvest/4 to-transparent blur-3xl" />
          <div className="absolute left-1/2 top-[-10vh] h-[40vh] w-[50vw] -translate-x-1/2 bg-gradient-to-b from-crop/10 to-transparent blur-2xl" />
        </motion.div>

        {/* Layer 1: Distant mountain ridges with soft gradient mist */}
        <motion.div
          style={{ y: ridgeY, transform: "translateZ(-40px)" }}
          className="absolute inset-x-0 top-[22vh] h-[42vh] w-full"
        >
          <svg
            viewBox="0 0 1440 400"
            preserveAspectRatio="none"
            className="h-full w-full text-emeraldDeep/80"
          >
            <path
              fill="currentColor"
              opacity="0.85"
              d="M0 240 L160 180 L320 232 L470 150 L620 226 L780 160 L940 230 L1100 176 L1260 236 L1440 190 L1440 400 L0 400 Z"
            />
          </svg>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-canopy/60 to-transparent" />
        </motion.div>

        {/* Layer 2: Floating atmospheric light motes / micro-spores */}
        <div className="absolute inset-0 overflow-hidden" style={{ transform: "translateZ(0px)" }}>
          {[
            { top: "25%", left: "20%", delay: "0s", duration: "7s", size: "w-2 h-2" },
            { top: "45%", left: "75%", delay: "1.5s", duration: "9s", size: "w-2.5 h-2.5" },
            { top: "60%", left: "35%", delay: "3s", duration: "8s", size: "w-1.5 h-1.5" },
            { top: "35%", left: "85%", delay: "2.2s", duration: "10s", size: "w-2 h-2" },
            { top: "70%", left: "15%", delay: "4s", duration: "6.5s", size: "w-2 h-2" },
            { top: "50%", left: "55%", delay: "0.8s", duration: "8.5s", size: "w-1.5 h-1.5" },
          ].map((particle, idx) => (
            <div
              key={idx}
              style={{
                top: particle.top,
                left: particle.left,
                animation: `floatSlow ${particle.duration} ease-in-out infinite`,
                animationDelay: particle.delay,
              }}
              className={`absolute ${particle.size} rounded-full bg-crop/40 blur-[1px] shadow-[0_0_12px_rgba(79,191,122,0.8)]`}
            />
          ))}
        </div>

        {/* Layer 3: Ploughed fields with a warehouse and a moving truck */}
        <motion.svg
          style={{ y: fieldY, transform: "translateZ(20px)" }}
          viewBox="0 0 1440 600"
          preserveAspectRatio="none"
          className="absolute inset-x-0 top-[42vh] h-[54vh] w-full"
        >
          <defs>
            <linearGradient id="sw-field" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#143D2A" />
              <stop offset="100%" stopColor="#081B12" />
            </linearGradient>
            <linearGradient id="road-glow" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(79,191,122,0.08)" />
              <stop offset="50%" stopColor="rgba(230,239,232,0.14)" />
              <stop offset="100%" stopColor="rgba(79,191,122,0.08)" />
            </linearGradient>
          </defs>
          <path fill="url(#sw-field)" d="M0 60 L1440 0 L1440 600 L0 600 Z" />
          {Array.from({ length: 16 }).map((_, index) => (
            <path
              key={index}
              d={`M${-200 + index * 130} 600 L${420 + index * 42} 40`}
              stroke="rgba(79,191,122,0.18)"
              strokeWidth="2"
            />
          ))}
          {/* Warehouse block with ambient light beacon */}
          <g opacity="0.9" className="drop-shadow-[0_8px_16px_rgba(0,0,0,0.6)]">
            <rect x="1080" y="140" width="180" height="90" fill="#0E2B1E" />
            <path d="M1080 140 L1170 100 L1260 140 Z" fill="#17402C" />
            <rect x="1120" y="180" width="34" height="50" fill="#06120C" />
            {/* Small solar roof accents */}
            <rect x="1095" y="118" width="60" height="14" rx="2" fill="#1A4A35" opacity="0.8" />
            <circle cx="1170" cy="98" r="4" fill="#4FBF7A" opacity="0.7" className="animate-pulse" />
          </g>
          {/* Road the truck runs along */}
          <path
            d="M-40 520 L1480 300"
            stroke="url(#road-glow)"
            strokeWidth="48"
            strokeLinecap="round"
          />
          <path
            d="M-40 520 L1480 300"
            stroke="rgba(79,191,122,0.22)"
            strokeWidth="2"
            strokeDasharray="16 24"
          />
        </motion.svg>

        {/* Layer 4: Truck moving through the corridor with subtle headlights */}
        <motion.div
          style={{ x: truckXvw, transform: "translateZ(40px)" }}
          className="absolute left-0 top-[71vh] hidden h-16 w-24 items-center justify-center sm:flex"
        >
          {/* Headlight beam */}
          <div className="absolute left-16 top-5 h-7 w-28 -rotate-6 bg-gradient-to-r from-harvest/25 to-transparent blur-md pointer-events-none" />
          <svg viewBox="0 0 64 40" className="h-12 w-18 text-crop drop-shadow-[0_12px_24px_rgba(0,0,0,0.8)]">
            <rect x="2" y="8" width="34" height="20" rx="3" fill="#123727" stroke="currentColor" strokeWidth="1.5" />
            <path d="M36 14 h12 l8 8 v6 H36 Z" fill="#0E2B1E" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="14" cy="31" r="4" fill="#06120C" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="46" cy="31" r="4" fill="#06120C" stroke="currentColor" strokeWidth="1.5" />
            {/* Cargo status indicator dot */}
            <circle cx="8" cy="13" r="1.5" fill="#4FBF7A" />
          </svg>
        </motion.div>

        {/* Layer 5: Foreground canopy framing the shot in 3D */}
        <motion.div style={{ y: frontY, transform: "translateZ(60px)" }} className="absolute inset-0">
          <svg viewBox="0 0 200 200" className="absolute -left-14 bottom-[-4rem] h-[26rem] w-[26rem] text-canopy/95 filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.7)]">
            <path fill="currentColor" d="M200 20C120 16 54 44 24 92 0 130 6 176 30 200H200Z" />
          </svg>
          <svg viewBox="0 0 200 200" className="absolute -right-16 bottom-[-6rem] h-[30rem] w-[30rem] rotate-[18deg] text-canopy/95 filter drop-shadow-[0_20px_35px_rgba(0,0,0,0.7)]">
            <path fill="currentColor" d="M0 30C80 24 150 54 180 104c22 38 18 74-4 96H0Z" />
          </svg>
        </motion.div>
      </motion.div>

      {/* Cinematic grade overlay with vignette */}
      <motion.div
        style={{ opacity: haze }}
        className="absolute inset-0 bg-gradient-to-b from-canopy/25 via-canopy/40 to-canopy"
      />
      <div className="absolute inset-0 bg-[radial-gradient(115%_115%_at_50%_45%,transparent_32%,rgba(6,18,12,0.92)_100%)]" />
    </div>
  );
}

