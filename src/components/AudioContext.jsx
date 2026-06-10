import React, { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AudioContext } from './index-DV-1WFZA.js';

export const useAudio = () => useContext(AudioContext);

// Background Music State
let bgAudio = null;
let isMusicMuted = false;
let hasUserInteracted = false;

export const initMusic = () => {
  if (typeof window === 'undefined') return;
  isMusicMuted = localStorage.getItem('audio_muted') === 'true';
  if (!bgAudio) {
    bgAudio = new Audio('/sounds/cfl_turningpages-belem-breeze-487596.ogg');
    bgAudio.preload = 'auto';
    bgAudio.loop = true;
    bgAudio.volume = 0.3;
    bgAudio.muted = isMusicMuted;
    bgAudio.load();
  }
};

export const startMusic = () => {
  initMusic();
  hasUserInteracted = true;
  if (bgAudio && bgAudio.paused) {
    bgAudio.play().catch((err) => {
      console.warn('Audio play failed/blocked by browser:', err);
    });
  }
};

export const toggleMusicMute = () => {
  isMusicMuted = !isMusicMuted;
  if (bgAudio) {
    bgAudio.muted = isMusicMuted;
  }
  return isMusicMuted;
};

export const getMusicMuted = () => isMusicMuted;

export const setMusicVolume = (volume) => {
  if (bgAudio) {
    bgAudio.volume = Math.max(0, Math.min(1, volume));
    if (volume > 0 && isMusicMuted) {
      isMusicMuted = false;
      bgAudio.muted = false;
    }
    if (volume > 0 && bgAudio.paused && hasUserInteracted) {
      bgAudio.play().catch((err) => console.warn(err));
    }
  }
  window.dispatchEvent(
    new CustomEvent('musicVolumeChanged', { detail: volume })
  );
};

export const getMusicVolume = () => (bgAudio ? bgAudio.volume : 0.3);

// Context Provider
export const AudioProvider = ({ children }) => {
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('audio_muted') === 'true';
  });

  const [globalVolume, setVolumeState] = useState(() => {
    if (typeof window === 'undefined') return 0.5;
    const vol = localStorage.getItem('audio_volume');
    return vol !== null ? parseFloat(vol) : 0.5;
  });

  const [audioEnabled, setAudioEnabled] = useState(false);
  const activeSoundsRef = useRef({});

  // Sync mute state and volume changes
  useEffect(() => {
    localStorage.setItem('audio_muted', isMuted);
    localStorage.setItem('audio_volume', globalVolume);

    Object.values(activeSoundsRef.current).forEach((sound) => {
      if (sound) {
        sound.muted = isMuted;
        const targetVol = (sound._baseVolume !== undefined ? sound._baseVolume : 1) * globalVolume;
        sound.volume = Math.max(0, Math.min(1, targetVol));
      }
    });
  }, [isMuted, globalVolume]);

  const toggleMute = () => setIsMuted((muted) => !muted);

  const setGlobalVolume = useCallback((val) => {
    if (typeof val === 'function') {
      setVolumeState((prev) => {
        const next = val(prev);
        if (next > 0) setIsMuted(false);
        return next;
      });
    } else {
      setVolumeState(val);
      if (val > 0) setIsMuted(false);
    }
  }, []);

  const enableAudio = useCallback(() => {
    if (!audioEnabled) {
      setAudioEnabled(true);
    }
  }, [audioEnabled]);

  // SFX playback utility
  const play = useCallback((soundName, { loop = false, volume = 1 } = {}) => {
    const soundPath = {
      szumwiatru: '/sounds/szumwiatru.mp3',
      szummiasta: '/sounds/szummiasta.mp3',
      uchyleniedrzwi: '/sounds/uchyleniedrzwi.mp3',
      otwarciedrzwi: '/sounds/otwarciedrzwi.mp3',
      zamknieciedrzwi: '/sounds/zamknieciedrzwi.mp3',
    }[soundName] || `/sounds/${soundName}.mp3`;

    const audio = new Audio(soundPath);
    audio.loop = loop;
    audio._baseVolume = volume;
    audio.muted = isMuted;

    const currentVolume = volume * globalVolume;
    audio.volume = Math.max(0, Math.min(1, currentVolume));

    if (activeSoundsRef.current[soundName]) {
      activeSoundsRef.current[soundName].pause();
    }
    activeSoundsRef.current[soundName] = audio;

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        // Suppress expected browser audio blocks (e.g. user hasn't interacted yet)
        if (
          err.name === 'NotAllowedError' ||
          err.name === 'NotSupportedError' ||
          err.message.includes('404')
        ) {
          // Handled silently
        }
      });
    }

    return {
      stop: () => {
        audio.pause();
        audio.currentTime = 0;
        delete activeSoundsRef.current[soundName];
      },
      fade: (duration = 1000) => {
        audio.pause();
        delete activeSoundsRef.current[soundName];
      },
    };
  }, [isMuted, globalVolume]);

  return (
    <AudioContext.Provider
      value={{
        isMuted,
        toggleMute,
        globalVolume,
        setGlobalVolume,
        play,
        enableAudio,
        audioEnabled,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};
