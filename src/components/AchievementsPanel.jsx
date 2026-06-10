import React from 'react';
import { useAchievements, achievementsList } from './AchievementsContext';
import { useAudio, getMusicMuted, toggleMusicMute, setMusicVolume } from './AudioContext';

// Toast Popup displayed when an achievement is unlocked or during tutorial
export const AchievementPopup = () => {
  const { activePopup } = useAchievements();
  const { isMuted, toggleMute, setGlobalVolume } = useAudio();

  if (!activePopup) return null;

  const item = achievementsList[activePopup.id];
  if (!item) return null;

  const isCompleted = activePopup.status === 'completed';
  const isHiding = activePopup.status === 'hiding';
  const isTutorial = activePopup.id === 'corridor_enter';

  const handleInlineSoundToggle = (e) => {
    e.stopPropagation();
    const newMute = !isMuted;
    
    // Toggle main context audio
    toggleMute();
    
    // Sync background music state
    if (getMusicMuted() !== newMute) {
      toggleMusicMute();
    }
    
    // Set volumes
    if (newMute) {
      setGlobalVolume(0);
      setMusicVolume(0);
    } else {
      setGlobalVolume(0.3);
      setMusicVolume(0.3);
    }
  };

  return (
    <div
      className={`achievement-popup ${isCompleted ? 'completed' : ''} ${isHiding ? 'hiding' : ''} ${isTutorial ? 'interactive' : ''}`}
      style={isTutorial ? { pointerEvents: 'auto' } : {}}
    >
      <svg
        className="popup-border"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path
          d="M 0 0 L 100 0 L 100 0 L 98 10 L 100 20 L 97 35 L 100 50 L 98 65 L 100 80 L 97 90 L 100 100 L 90 97 L 80 100 L 70 96 L 60 100 L 50 97 L 40 100 L 30 96 L 20 100 L 10 97 L 0 100 L 0 100 L 2 90 L 0 80 L 3 65 L 0 50 L 2 35 L 0 20 L 3 10 L 0 0 Z"
          fill="none"
          stroke="#1a1a1a"
          strokeWidth="0.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="popup-content">
        {!isTutorial && (
          <div className={`checkbox ${isCompleted ? 'checked' : ''}`}>
            {isCompleted && (
              <svg viewBox="0 0 24 24" className="checkmark">
                <path
                  d="M5 13l4 4L19 7"
                  fill="none"
                  stroke="#1a1a1a"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        )}
        <div
          className="text-content"
          style={isTutorial ? { alignItems: 'center', textAlign: 'center' } : {}}
        >
          <span className="title">{item.title}</span>
          {isTutorial ? (
            <span className="description">
              Click a door to enter. Audio is currently
              <button
                className={`inline-sound-toggle ${isMuted ? 'off' : 'on'}`}
                onClick={handleInlineSoundToggle}
              >
                {isMuted ? ' [🔇 OFF]' : ' [🔊 ON]'}
              </button>
            </span>
          ) : (
            <span className="description">{item.label}</span>
          )}
        </div>
      </div>
    </div>
  );
};

// Achievements Panel modal
export const AchievementsPanel = ({ isOpen, onClose }) => {
  const { completed } = useAchievements();
  const achievements = Object.values(achievementsList);

  return (
    <div className={`achievements-panel ${isOpen ? 'open' : ''}`} inert={isOpen ? undefined : true}>
      <div className="achievements-card">
        <div className="achievements-header">
          <h3>ACHIEVEMENTS</h3>
          <button className="close-btn" onClick={onClose} aria-label="Close achievements">
            <svg viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="achievements-list">
          {achievements.map((item) => {
            const isUnlocked = completed.includes(item.id);
            return (
              <div
                key={item.id}
                className={`achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`}
              >
                <div className="achievement-icon">
                  {isUnlocked ? (
                    <svg viewBox="0 0 24 24" className="icon-unlocked">
                      <path
                        d="M12 15l-3-3 1.4-1.4 1.6 1.6 4.6-4.6L18 9"
                        fill="none"
                        stroke="#1a1a1a"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        fill="none"
                        stroke="#1a1a1a"
                        strokeWidth="2"
                      />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" className="icon-locked">
                      <rect
                        x="7"
                        y="11"
                        width="10"
                        height="8"
                        rx="2"
                        fill="none"
                        stroke="#666"
                        strokeWidth="2"
                      />
                      <path
                        d="M9 11V8a3 3 0 0 1 6 0v3"
                        fill="none"
                        stroke="#666"
                        strokeWidth="2"
                      />
                    </svg>
                  )}
                </div>
                <div className="achievement-text">
                  <div className="achievement-title">{item.title}</div>
                  <div className="achievement-label">{item.label}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="achievements-footer">
          <span>
            {completed.length} / {achievements.length} EXPLORED
          </span>
        </div>
      </div>
    </div>
  );
};
export default AchievementsPanel;
