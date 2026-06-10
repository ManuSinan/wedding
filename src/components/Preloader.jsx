import React, { useState, useEffect, useRef, useMemo } from 'react';
import { DefaultLoadingManager } from './index-DV-1WFZA.js';
import { gsap } from 'gsap';
import { useAudio } from './AudioContext';

const PathOverlay = ({ svgPathData, pathLength, strokeDashoffset, pathRef }) => (
  <svg
    className="preloader__overlay"
    viewBox="0 0 100 100"
    preserveAspectRatio="none"
    style={{ pointerEvents: 'none' }}
  >
    <path
      ref={pathRef}
      d={svgPathData}
      fill="none"
      stroke="#1a1a1a"
      strokeWidth="0.1"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ strokeDasharray: pathLength, strokeDashoffset }}
    />
  </svg>
);

const PreloaderRing = () => (
  <div className="preloader__ring">
    <svg
      width="120"
      height="120"
      viewBox="0 0 100 100"
      style={{ overflow: 'visible' }}
    >
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke="#000"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="10 15"
        opacity="0.8"
      />
      <circle
        cx="50"
        cy="50"
        r="35"
        fill="none"
        stroke="#000"
        strokeWidth="1"
        strokeLinecap="round"
        strokeDasharray="5 10"
        opacity="0.5"
        style={{
          animation: 'ring-spin-reverse 4s linear infinite',
          transformOrigin: '50% 50%',
        }}
      />
    </svg>
    <style>
      {`
        @keyframes ring-spin {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes ring-spin-reverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        .preloader__ring {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 120px;
          height: 120px;
          pointer-events: none;
          z-index: 5;
          animation: ring-spin 10s linear infinite;
        }
      `}
    </style>
  </div>
);

const percentageStyle = {
  position: 'absolute',
  top: '50%',
  left: '0',
  width: '100%',
  transform: 'translateY(-50%)',
  textAlign: 'center',
  zIndex: 20,
  fontFamily: "'Inter', sans-serif",
  fontSize: '2rem',
  fontWeight: 'bold',
  mixBlendMode: 'multiply',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'visible',
};

export const Preloader = ({ onComplete, ready }) => {
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadPercentage, setLoadPercentage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Hook into Three.js DefaultLoadingManager for loading tracking
  useEffect(() => {
    let animFrameId = 0;
    const originalOnStart = DefaultLoadingManager.onStart;
    const originalOnProgress = DefaultLoadingManager.onProgress;
    const originalOnLoad = DefaultLoadingManager.onLoad;

    DefaultLoadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
      setIsLoading(true);
      if (originalOnStart) originalOnStart(url, itemsLoaded, itemsTotal);
    };

    DefaultLoadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      cancelAnimationFrame(animFrameId);
      animFrameId = requestAnimationFrame(() => {
        setLoadPercentage((itemsLoaded / itemsTotal) * 100);
      });
      if (originalOnProgress) originalOnProgress(url, itemsLoaded, itemsTotal);
    };

    DefaultLoadingManager.onLoad = () => {
      cancelAnimationFrame(animFrameId);
      setLoadPercentage(100);
      setIsLoading(false);
      if (originalOnLoad) originalOnLoad();
    };

    return () => {
      DefaultLoadingManager.onStart = originalOnStart;
      DefaultLoadingManager.onProgress = originalOnProgress;
      DefaultLoadingManager.onLoad = originalOnLoad;
    };
  }, []);

  const { play: playSFX } = useAudio();
  const pencilSoundRef = useRef(null);
  const startTimeRef = useRef(performance.now());
  const containerRef = useRef(null);
  const leftHalfRef = useRef(null);
  const rightHalfRef = useRef(null);
  const leftPathRef = useRef(null);
  const rightPathRef = useRef(null);
  const leftTextRef = useRef(null);
  const rightTextRef = useRef(null);

  const [animatedProgress, setAnimatedProgress] = useState(0);
  const currentProgressRef = useRef(0);
  const tweenTargetRef = useRef({ val: 0 });
  const isReadyRef = useRef(ready);

  useEffect(() => {
    isReadyRef.current = ready;
  }, [ready]);

  // Generate hand-drawn jagged paper tear line coordinates
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

  // Compute smooth animation progress target
  useEffect(() => {
    let target = 0;
    if (isLoading) {
      target = (loadPercentage / 100) * 85;
    } else if (ready) {
      target = 100;
    } else {
      target = 90;
    }
    setAnimatedProgress((prev) => Math.max(prev, target));
  }, [loadPercentage, isLoading, ready]);

  // Handle playing and stopping pencil SFX
  const updatePencilSound = (val) => {
    if (val < 99 && !pencilSoundRef.current) {
      pencilSoundRef.current = playSFX('pencil', { loop: true, volume: 0.5 });
    } else if (val >= 99 && pencilSoundRef.current) {
      pencilSoundRef.current.stop();
      pencilSoundRef.current = null;
    }

    if (val >= 99.5 && isReadyRef.current && !completedRef.current) {
      completedRef.current = true;
      triggerTearingOpenAnimation();
    }
  };

  useEffect(() => {
    return () => {
      if (pencilSoundRef.current) {
        pencilSoundRef.current.stop();
        pencilSoundRef.current = null;
      }
    };
  }, []);

  // Animate the values with GSAP
  useEffect(() => {
    const diff = animatedProgress - currentProgressRef.current;
    let duration = 0.5;
    if (diff > 60) duration = 1.5;
    else if (diff > 30) duration = 1.0;
    else if (diff > 10) duration = 0.6;
    else if (diff > 0) duration = 0.4;

    gsap.to(tweenTargetRef.current, {
      val: animatedProgress,
      duration,
      ease: 'power2.out',
      overwrite: true,
      onUpdate: () => {
        const currentVal = tweenTargetRef.current.val;
        currentProgressRef.current = currentVal;

        const clamped = Math.min(100, Math.max(0, currentVal));
        const offset = 120 - (120 * clamped) / 100;
        const textVal = `${Math.round(clamped)}%`;

        if (leftTextRef.current) leftTextRef.current.innerText = textVal;
        if (rightTextRef.current) rightTextRef.current.innerText = textVal;
        if (leftPathRef.current) leftPathRef.current.style.strokeDashoffset = offset;
        if (rightPathRef.current) rightPathRef.current.style.strokeDashoffset = offset;

        updatePencilSound(currentVal);
      },
    });
  }, [animatedProgress]);

  const completedRef = useRef(false);
  useEffect(() => {
    if (currentProgressRef.current >= 99.5 && ready && !completedRef.current) {
      completedRef.current = true;
      triggerTearingOpenAnimation();
    }
  }, [ready]);

  const triggerTearingOpenAnimation = () => {
    completedRef.current = true;
    if (pencilSoundRef.current) {
      pencilSoundRef.current.stop();
      pencilSoundRef.current = null;
    }
    playSFX('tear', { volume: 0.8 });

    const timeline = gsap.timeline({
      onComplete: () => {
        setHasLoaded(true);
        onComplete?.();
      },
    });

    timeline.to({}, { duration: 0.1 });
    timeline.to(
      leftHalfRef.current,
      { xPercent: -100, rotation: -2, duration: 1.8, ease: 'power3.inOut' },
      'tear'
    );
    timeline.to(
      rightHalfRef.current,
      { xPercent: 100, rotation: 2, duration: 1.8, ease: 'power3.inOut' },
      'tear'
    );
    timeline.to(containerRef.current, { opacity: 0, duration: 0.5 }, '-=0.5');
  };

  if (hasLoaded) return null;

  const totalLength = 120;
  const currentOffset = totalLength - (totalLength * Math.min(100, Math.max(0, currentProgressRef.current))) / 100;
  const percentText = `${Math.round(currentProgressRef.current)}%`;

  return (
    <div className="preloader" ref={containerRef}>
      <div
        className="preloader__half preloader__half--left"
        ref={leftHalfRef}
        style={{ clipPath: leftClipPath }}
      >
        <div className="preloader__percentage" style={percentageStyle}>
          <span ref={leftTextRef}>{percentText}</span>
          <PreloaderRing />
        </div>
        <PathOverlay
          pathRef={leftPathRef}
          svgPathData={pathData}
          pathLength={totalLength}
          strokeDashoffset={currentOffset}
        />
      </div>

      <div
        className="preloader__half preloader__half--right"
        ref={rightHalfRef}
        style={{ clipPath: rightClipPath }}
      >
        <div className="preloader__percentage" style={percentageStyle}>
          <span ref={rightTextRef}>{percentText}</span>
          <PreloaderRing />
        </div>
        <PathOverlay
          pathRef={rightPathRef}
          svgPathData={pathData}
          pathLength={totalLength}
          strokeDashoffset={currentOffset}
        />
      </div>
    </div>
  );
};
