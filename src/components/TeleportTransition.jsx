import React, { useEffect, useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import { useScene } from './SceneContext';
import { useAudio } from './AudioContext';

const TransitionOverlay = ({ svgPathData }) => (
  <svg
    className="preloader__overlay"
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
    style={{ pointerEvents: 'none' }}
  >
    <path
      d={svgPathData}
      fill="none"
      stroke="#1a1a1a"
      strokeWidth="0.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const TeleportTransition = () => {
  const {
    teleportPhase,
    startTeleportTransition,
    finishPaperOpen,
    teleportTarget,
  } = useScene();

  const { play: playSFX } = useAudio();
  const containerRef = useRef(null);
  const leftHalfRef = useRef(null);
  const rightHalfRef = useRef(null);
  const timelineRef = useRef(null);

  // Generate jagged paper tear line coordinates
  const points = useMemo(() => {
    const coords = [];
    coords.push([50, 0]);
    for (let i = 1; i < 12; i++) {
      const y = (i / 12) * 100;
      const x = 50 + (Math.random() - 0.5) * 6;
      coords.push([x, y]);
    }
    coords.push([50, 100]);
    return coords;
  }, []);

  const pathData = useMemo(() => {
    return points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p[0]} ${p[1]} `).join(' ');
  }, [points]);

  const leftClipPath = useMemo(() => {
    let polygon = '0% 0%, ';
    points.forEach((p) => {
      polygon += `${p[0]}% ${p[1]}%, `;
    });
    polygon += '0% 100%';
    return `polygon(${polygon})`;
  }, [points]);

  const rightClipPath = useMemo(() => {
    let polygon = '100% 0%, ';
    polygon += '100% 100%, ';
    [...points].reverse().forEach((p) => {
      polygon += `${p[0]}% ${p[1]}%, `;
    });
    return `polygon(${polygon.slice(0, -2)})`;
  }, [points]);

  useEffect(() => {
    if (!leftHalfRef.current || !rightHalfRef.current || !containerRef.current) return;

    // Kill any active timeline
    if (timelineRef.current) {
      timelineRef.current.kill();
    }

    if (teleportPhase === 'closing') {
      gsap.set(containerRef.current, { opacity: 1, display: 'block' });
      gsap.set(leftHalfRef.current, { xPercent: -100, rotation: -2 });
      gsap.set(rightHalfRef.current, { xPercent: 100, rotation: 2 });

      timelineRef.current = gsap.timeline({
        onComplete: () => {
          startTeleportTransition();
        },
      });

      playSFX('tear', { volume: 0.6 });

      timelineRef.current.to(
        leftHalfRef.current,
        {
          xPercent: 0,
          rotation: 0,
          duration: 0.8,
          ease: 'power2.inOut',
        },
        'close'
      );
      timelineRef.current.to(
        rightHalfRef.current,
        {
          xPercent: 0,
          rotation: 0,
          duration: 0.8,
          ease: 'power2.inOut',
        },
        'close'
      );
    }

    if (teleportPhase === 'opening') {
      timelineRef.current = gsap.timeline({
        onComplete: () => {
          finishPaperOpen();
        },
      });

      playSFX('tear', { volume: 0.8 });

      timelineRef.current.to(
        leftHalfRef.current,
        {
          xPercent: -100,
          rotation: -2,
          duration: 1.2,
          ease: 'power3.inOut',
        },
        'tear'
      );
      timelineRef.current.to(
        rightHalfRef.current,
        {
          xPercent: 100,
          rotation: 2,
          duration: 1.2,
          ease: 'power3.inOut',
        },
        'tear'
      );
      timelineRef.current.to(
        containerRef.current,
        {
          opacity: 0,
          duration: 0.3,
          onComplete: () => {
            gsap.set(containerRef.current, { display: 'none' });
          },
        },
        '-=0.3'
      );
    }

    return () => {
      if (timelineRef.current) {
        timelineRef.current.kill();
      }
    };
  }, [teleportPhase, startTeleportTransition, finishPaperOpen, playSFX]);

  return (
    <div className="preloader" ref={containerRef} style={{ pointerEvents: 'none', display: 'none' }}>
      <div
        className="preloader__half preloader__half--left"
        ref={leftHalfRef}
        style={{ clipPath: leftClipPath }}
      >
        <TransitionOverlay svgPathData={pathData} />
      </div>
      <div
        className="preloader__half preloader__half--right"
        ref={rightHalfRef}
        style={{ clipPath: rightClipPath }}
      >
        <TransitionOverlay svgPathData={pathData} />
      </div>
    </div>
  );
};
export default TeleportTransition;
