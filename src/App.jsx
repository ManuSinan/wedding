import React, { useState, useEffect, useCallback, Suspense } from 'react';
import {
  Canvas,
  Bvh,
  Preload,
  ExperienceComponent,
  usePerformance,
  AudioInitialTrigger,
  PerformanceProvider
} from './components/index-DV-1WFZA.js';

import { AudioProvider, initMusic } from './components/AudioContext';
import { SceneProvider } from './components/SceneContext';
import { AchievementsProvider } from './components/AchievementsContext';

import { Preloader } from './components/Preloader';
import { NavigationUI } from './components/NavigationUI';
import { MapPanel } from './components/MapPanel';
import { TeleportTransition } from './components/TeleportTransition';
import { AccessibilityOverlay } from './components/AccessibilityOverlay';

function MainApp() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const { settings, downgradeTier, tier } = usePerformance();

  // Initialize background ambient loop audio
  useEffect(() => {
    initMusic();
  }, []);

  const handleSceneReady = useCallback(() => {
    requestAnimationFrame(() => {
      setSceneReady(true);
    });
  }, []);

  return (
    <div className="app">
      <div className="canvas-wrapper">
        <Canvas
          camera={{
            position: [0, 0.2, 28],
            fov: 60,
            near: 0.1,
            far: 150,
          }}
          gl={{
            antialias: settings.antialias,
            alpha: false,
            powerPreference: settings.powerPreference,
            localClippingEnabled: true,
            failIfMajorPerformanceCaveat: true,
          }}
          dpr={settings.dpr}
          shadows={settings.shadows}
        >
          <color attach="background" args={["#fafafa"]} />
          <fog attach="fog" args={["#fafafa", 15, 50]} />
          <Bvh
            onDecline={downgradeTier}
            flipflops={3}
            onFallback={downgradeTier}
          />
          <Suspense fallback={null}>
            <ExperienceComponent
              isLoaded={isLoaded}
              onSceneReady={handleSceneReady}
              performanceTier={tier}
            />
            <Preload all />
          </Suspense>
        </Canvas>
      </div>

      {isLoaded && (
        <>
          <NavigationUI />
          <MapPanel />
          <TeleportTransition />
          <AccessibilityOverlay />
        </>
      )}

      <Preloader ready={sceneReady} onComplete={() => setIsLoaded(true)} />
    </div>
  );
}

export default function App() {
  return (
    <PerformanceProvider>
      <AudioProvider>
        <SceneProvider>
          <AchievementsProvider>
            <AudioInitialTrigger />
            <MainApp />
          </AchievementsProvider>
        </SceneProvider>
      </AudioProvider>
    </PerformanceProvider>
  );
}
