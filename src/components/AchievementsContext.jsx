import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAudio } from './AudioContext';
import { AchievementsContext } from './index-DV-1WFZA.js';

export const useAchievements = () => useContext(AchievementsContext);

export const achievementsList = {
  corridor_enter: {
    id: 'corridor_enter',
    label: 'Click a door to enter',
    title: 'Explorer',
  },
  corridor_explore: {
    id: 'corridor_explore',
    label: 'Scroll to explore the corridor',
    title: 'Wanderer',
  },
  about_fly: {
    id: 'about_fly',
    label: 'Scroll to fly through my story',
    title: 'Sky Walker',
  },
  studio_interact: {
    id: 'studio_interact',
    label: 'Drag to rotate and browse',
    title: 'Director',
  },
  gallery_inspect: {
    id: 'gallery_inspect',
    label: 'Click project to inspect',
    title: 'Art Critic',
  },
  contact_choose: {
    id: 'contact_choose',
    label: 'Find a contact method',
    title: 'Sociable',
  },
};

export const AchievementsProvider = ({ children }) => {
  const { playSound } = useAudio();
  const unlockedRef = useRef([]);
  const [completed, setCompleted] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('itom_achievements');
      if (saved) {
        const filtered = JSON.parse(saved).filter((id) => id !== 'corridor_enter');
        unlockedRef.current = [...filtered];
        return filtered;
      }
      return [];
    } catch {
      return [];
    }
  });

  const webAudioCtxRef = useRef(null);
  const [activePopup, setActivePopup] = useState(null);
  const userInteractedRef = useRef(false);

  useEffect(() => {
    const handleInteraction = () => {
      userInteractedRef.current = true;
      // Remove listeners once interacted
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
    window.addEventListener('click', handleInteraction);
    window.addEventListener('keydown', handleInteraction);
    window.addEventListener('touchstart', handleInteraction);
    return () => {
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keydown', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, []);

  useEffect(() => {
    const cleanAchievements = completed.filter((id) => id !== 'corridor_enter');
    localStorage.setItem('itom_achievements', JSON.stringify(cleanAchievements));
  }, [completed]);

  const playAchievementUnlockSound = useCallback(() => {
    try {
      const hasInteracted = userInteractedRef.current || (typeof navigator !== 'undefined' && navigator.userActivation?.hasBeenActive);
      if (!hasInteracted) return;

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!webAudioCtxRef.current) {
        webAudioCtxRef.current = new AudioContextClass();
      }
      const ctx = webAudioCtxRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      if (ctx.state !== 'running') return;

      const gainNode = ctx.createGain();
      const osc = ctx.createOscillator();
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15);

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.warn('Synth sound blocked or failed:', e);
    }
  }, []);

  const showTutorial = useCallback((id) => {
    if (achievementsList[id] && !completed.includes(id)) {
      if (!activePopup || activePopup.status === 'hiding') {
        setTimeout(() => {
          setActivePopup({ id, status: 'pending' });
        }, 50);
      }
    }
  }, [completed, activePopup]);

  const unlockAchievement = useCallback((id) => {
    if (!unlockedRef.current.includes(id)) {
      unlockedRef.current.push(id);
      setCompleted((prev) => {
        const next = [...prev, id];
        const cleanAchievements = next.filter((item) => item !== 'corridor_enter');
        localStorage.setItem('itom_achievements', JSON.stringify(cleanAchievements));
        return next;
      });

      const details = achievementsList[id];
      if (details) {
        // Track event via PostHog if available
        if (typeof window !== 'undefined' && window.posthog) {
          window.posthog.capture('achievement_unlocked', {
            achievement_id: id,
            achievement_title: details.title,
          });
        }
        playAchievementUnlockSound();

        setActivePopup((current) => {
          if (current && current.id === id) {
            setTimeout(() => {
              setActivePopup((prev) => (prev && prev.id === id ? { ...prev, status: 'hiding' } : prev));
              setTimeout(() => {
                setActivePopup((prev) => (prev && prev.id === id ? null : prev));
              }, 500);
            }, 2000);
            return { ...current, status: 'completed' };
          } else {
            setTimeout(() => {
              setActivePopup((prev) => (prev && prev.id === id ? { ...prev, status: 'hiding' } : prev));
              setTimeout(() => {
                setActivePopup((prev) => (prev && prev.id === id ? null : prev));
              }, 500);
            }, 3000);
            return { id, status: 'completed' };
          }
        });
      }
    }
  }, [playAchievementUnlockSound]);

  const hidePopup = useCallback(() => {
    if (activePopup && activePopup.status !== 'hiding') {
      setActivePopup((current) => (current ? { ...current, status: 'hiding' } : null));
      setTimeout(() => {
        setActivePopup(null);
      }, 500);
    }
  }, [activePopup]);

  return (
    <AchievementsContext.Provider
      value={{
        completed,
        activePopup,
        showTutorial,
        unlockAchievement,
        hidePopup,
      }}
    >
      {children}
    </AchievementsContext.Provider>
  );
};
