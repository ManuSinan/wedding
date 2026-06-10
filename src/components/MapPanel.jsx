import React, { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { useScene } from './SceneContext';

// The DetailOverlay / Project details card modal
export const DetailOverlay = ({ content, isOpen, onClose, isMobile }) => {
  if (!content) return null;

  const categoryLabel = content.platformConfig?.label || 'Content';
  const descriptionRef = useRef(null);

  // Typewriter effect on opening using GSAP
  useEffect(() => {
    if (isOpen && content.description && descriptionRef.current && content.layout !== 'certificate_grid') {
      gsap.killTweensOf(descriptionRef.current);
      gsap.fromTo(
        descriptionRef.current,
        { text: '' },
        {
          text: content.description,
          duration: Math.min(2.5, content.description.length * 0.015),
          ease: 'none',
          delay: 0.3,
        }
      );
    }
  }, [isOpen, content]);

  const scrollContainerRef = useRef(null);
  const trackRef = useRef(null);
  const thumbRef = useRef(null);
  const isDraggingRef = useRef(false);
  const startDragYRef = useRef(0);
  const startScrollTopRef = useRef(0);

  const [thumbTop, setThumbTop] = useState(0);
  const [isTrackVisible, setIsTrackVisible] = useState(false);

  const updateScrollIndicator = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const scrollMax = scrollHeight - clientHeight;
    setIsTrackVisible(scrollMax > 10);

    if (scrollMax <= 0) return;

    const ratio = scrollTop / scrollMax;
    const track = trackRef.current;
    if (!track) return;

    const trackHeight = track.clientHeight;
    const thumbMax = trackHeight * 0.9 - 32;
    const offsetBase = trackHeight * 0.05;
    setThumbTop(offsetBase + ratio * thumbMax);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => updateScrollIndicator();
    container.addEventListener('scroll', handleScroll, { passive: true });
    const animId = requestAnimationFrame(updateScrollIndicator);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animId);
    };
  }, [updateScrollIndicator, content]);

  useEffect(() => {
    const timer = setTimeout(updateScrollIndicator, 200);
    return () => clearTimeout(timer);
  }, [isOpen, content, updateScrollIndicator]);

  const handleThumbMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    startDragYRef.current = e.clientY;
    startScrollTopRef.current = scrollContainerRef.current?.scrollTop || 0;
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingRef.current) return;
      const container = scrollContainerRef.current;
      const track = trackRef.current;
      if (!container || !track) return;

      const deltaY = e.clientY - startDragYRef.current;
      const trackScrollHeight = track.clientHeight * 0.9 - 32;
      const scrollMax = container.scrollHeight - container.clientHeight;
      const scrollDelta = (deltaY / trackScrollHeight) * scrollMax;
      container.scrollTop = startScrollTopRef.current + scrollDelta;
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleTrackClick = useCallback((e) => {
    const container = scrollContainerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    const trackRect = track.getBoundingClientRect();
    const clickY = e.clientY - trackRect.top;
    const trackHeight = track.clientHeight;
    const ratio = Math.max(0, Math.min(1, (clickY - trackHeight * 0.05) / (trackHeight * 0.9)));
    const { scrollHeight, clientHeight } = container;
    container.scrollTop = ratio * (scrollHeight - clientHeight);
  }, []);

  const handleWrapperClick = (e) => {
    if (
      e.target.classList.contains('global-overlay-wrapper') ||
      e.target.classList.contains('global-overlay-backdrop-layer')
    ) {
      onClose();
    }
  };

  const transitionStyle = 'transform 0.8s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.8s ease';
  const elementTransitionStyle = 'all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)';

  const panelPositionStyle = isMobile
    ? {
        width: '90%',
        maxHeight: '60vh',
        bottom: '10rem',
        left: '50%',
        transform: isOpen
          ? 'translate(-50%, 0) rotate(-1deg)'
          : 'translate(-50%, 120%) rotate(10deg)',
        opacity: isOpen ? 1 : 0,
        color: '#1a1a1a',
      }
    : {
        width: 'clamp(280px, 30vw, 450px)',
        right: 'clamp(2rem, 12vw, 20rem)',
        top: '50%',
        transform: isOpen
          ? 'translateY(-50%) rotate(1deg)'
          : 'translate(150%, -50%) rotate(15deg)',
        opacity: isOpen ? 1 : 0,
        color: '#1a1a1a',
      };

  const fadeDelayedStyle = (delay) => ({
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
    transition: elementTransitionStyle,
    transitionDelay: isOpen ? `${delay}ms` : '0ms',
  });

  const backdropMaskStyle =
    content.layout === 'certificate_grid'
      ? { maskImage: 'none', WebkitMaskImage: 'none' }
      : isMobile
        ? {
            maskImage: 'radial-gradient(circle at 50% 25%, transparent 0%, transparent 15%, black 40%)',
            WebkitMaskImage: 'radial-gradient(circle at 50% 25%, transparent 0%, transparent 15%, black 40%)',
          }
        : {
            maskImage: 'radial-gradient(circle at 31% 50%, transparent 0%, transparent 12%, black 35%)',
            WebkitMaskImage: 'radial-gradient(circle at 31% 50%, transparent 0%, transparent 12%, black 35%)',
          };

  return (
    <div
      className="global-overlay-wrapper"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 2000,
        pointerEvents: isOpen ? 'auto' : 'none',
      }}
      onClick={handleWrapperClick}
    >
      <div
        className="global-overlay-backdrop-layer"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.8s ease',
          ...backdropMaskStyle,
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <div
          style={{
            position: 'absolute',
            padding: isMobile ? '1.5rem' : '2.5rem',
            transition: transitionStyle,
            display: 'flex',
            flexDirection: 'column',
            gap: '1.2rem',
            fontFamily: "'Cabin Sketch', cursive",
            pointerEvents: 'auto',
            ...panelPositionStyle,
            ...(content.layout === 'certificate_grid'
              ? {
                  width: isMobile ? '95vw' : 'clamp(300px, 90vw, 1200px)',
                  height: 'clamp(500px, 85vh, 900px)',
                  maxHeight: '85vh',
                  left: '50%',
                  top: '50%',
                  right: 'auto',
                  bottom: 'auto',
                  transform: isOpen
                    ? 'translate(-50%, -50%)'
                    : 'translate(-50%, 100%)',
                }
              : {}),
          }}
          className="studio-paper-card"
          onClick={(e) => e.stopPropagation()}
        >
          <svg
            className="studio-border-overlay"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            <path
              d="M 0 0 L 4 1 L 8 0 L 12 1 L 16 0 L 20 1 L 24 0 L 28 1 L 32 0 L 36 1 L 40 0 L 44 1 L 48 0 L 52 1 L 56 0 L 60 1 L 64 0 L 68 1 L 72 0 L 76 1 L 80 0 L 84 1 L 88 0 L 92 1 L 96 0 L 100 0 L 99 3 L 100 6 L 98 10 L 100 14 L 99 18 L 100 22 L 98 26 L 100 30 L 99 35 L 100 40 L 98 45 L 100 50 L 99 55 L 100 60 L 98 65 L 100 70 L 99 75 L 100 80 L 98 85 L 100 90 L 99 95 L 100 100 L 96 99 L 92 100 L 88 98 L 84 100 L 80 99 L 76 100 L 72 98 L 68 100 L 64 99 L 60 100 L 56 98 L 52 100 L 48 99 L 44 100 L 40 98 L 36 100 L 32 99 L 28 100 L 24 98 L 20 100 L 16 99 L 12 100 L 8 98 L 4 100 L 0 99 L 0.5 99.5 L 1 95 L 0 90 L 2 85 L 0 80 L 1 75 L 0 70 L 2 65 L 0 60 L 1 55 L 0 50 L 2 45 L 0 40 L 1 35 L 0 30 L 2 26 L 0 22 L 1 18 L 0 14 L 2 10 L 0 6 L 1 3 L 0 0 Z"
              fill="none"
              stroke="#1a1a1a"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              top: '10px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '40px',
              height: '4px',
              backgroundColor: 'rgba(0,0,0,0.1)',
              borderRadius: '2px',
              display: isMobile ? 'block' : 'none',
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '1rem',
              ...fadeDelayedStyle(100),
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
              <span
                style={{
                  textTransform: 'uppercase',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  color: '#666',
                }}
              >
                {categoryLabel}
              </span>
              <h2
                style={{
                  fontSize: '1.8rem',
                  margin: 0,
                  lineHeight: 1.1,
                  fontWeight: 800,
                  fontFamily: "'Rubik Scribble', cursive",
                }}
              >
                {content.title}
              </h2>
            </div>
            <button onClick={onClose} className="studio-close-btn" aria-label="Close">
              <svg viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {content.layout === 'certificate_grid' ? (
            <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
              <div
                ref={scrollContainerRef}
                className="awards-scroll-container"
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
                  alignContent: 'start',
                  height: '100%',
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  gap: isMobile ? '1rem' : '2rem',
                  padding: isMobile ? '1rem 0.5rem 2rem 0.5rem' : '1rem 2rem 2rem 1rem',
                  ...fadeDelayedStyle(200),
                }}
              >
                {content.items?.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.8rem',
                      backgroundColor: '#f9f9f9',
                      padding: '1rem',
                      border: '2px solid #1a1a1a',
                      boxShadow: '4px 4px 0px rgba(0,0,0,0.1)',
                      transition: 'transform 0.2s',
                      cursor: 'pointer',
                      borderRadius: '2px 255px 3px 255px / 255px 5px 225px 3px',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.transform = 'translateY(-5px)')}
                    onMouseOut={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                    onClick={() => window.open(item.url || content.url || '#', '_blank')}
                  >
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        paddingBottom: '141%',
                        backgroundColor: '#eee',
                        border: '2px solid #1a1a1a',
                        overflow: 'hidden',
                        borderRadius: '2px 255px 3px 255px / 255px 5px 225px 3px',
                      }}
                    >
                      <img
                        src={item.image || 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='}
                        alt={item.label}
                        loading="lazy"
                        decoding="async"
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'fill',
                        }}
                      />
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <h4
                        style={{
                          margin: '0 0 0.4rem 0',
                          fontSize: '1.2rem',
                          fontWeight: 700,
                          fontFamily: "'Rubik Scribble', cursive",
                        }}
                      >
                        {item.label}
                      </h4>
                      <span
                        style={{
                          fontSize: '1.1rem',
                          color: '#4a4a4a',
                          fontFamily: "'Cabin Sketch', cursive",
                          fontWeight: 700,
                        }}
                      >
                        {item.date}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {isTrackVisible && (
                <div
                  ref={trackRef}
                  className="torn-scroll-track"
                  onClick={handleTrackClick}
                  style={{ pointerEvents: 'auto' }}
                >
                  <div className="torn-scroll-line" />
                  <div
                    ref={thumbRef}
                    className="torn-scroll-thumb"
                    style={{ top: `${thumbTop}px` }}
                    onMouseDown={handleThumbMouseDown}
                  />
                </div>
              )}
            </div>
          ) : (
            <>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  fontSize: '0.8rem',
                  color: '#666',
                  borderBottom: '1px dashed #ccc',
                  paddingBottom: '1rem',
                  ...fadeDelayedStyle(200),
                }}
              >
                <strong>{content.date}</strong>
                {content.views && <span>{content.views} views</span>}
              </div>
              <p
                ref={descriptionRef}
                style={{
                  lineHeight: 1.6,
                  color: '#333',
                  fontSize: '0.95rem',
                  margin: 0,
                  minHeight: '80px',
                  ...fadeDelayedStyle(300),
                }}
              >
                {content.description}
              </p>
              <div style={{ marginTop: 'auto', paddingTop: '1rem', ...fadeDelayedStyle(400) }}>
                <a
                  href={content.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="studio-action-button"
                >
                  Open Link ↗
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Map Panel component
export const MapPanel = () => {
  const { overlayContent, closeOverlay } = useScene();
  const [isOpen, setIsOpen] = useState(false);
  const [delayOpen, setDelayOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (overlayContent) {
      setIsOpen(true);
      const timer = setTimeout(() => {
        setDelayOpen(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setDelayOpen(false);
      const timer = setTimeout(() => setIsOpen(false), 800);
      return () => clearTimeout(timer);
    }
  }, [overlayContent]);

  const [lastContent, setLastContent] = useState(null);
  useEffect(() => {
    if (overlayContent) setLastContent(overlayContent);
  }, [overlayContent]);

  const safeContent = overlayContent || lastContent || {
    title: 'Loading...',
    layout: 'certificate_grid',
    items: [
      { label: '', date: '', image: '' },
      { label: '', date: '', image: '' },
      { label: '', date: '', image: '' },
      { label: '', date: '', image: '' },
    ],
    platformConfig: { label: '...' },
  };

  return <DetailOverlay content={safeContent} isOpen={delayOpen} onClose={closeOverlay} isMobile={isMobile} />;
};
export default MapPanel;
