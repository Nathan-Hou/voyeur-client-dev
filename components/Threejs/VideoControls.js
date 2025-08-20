"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, FastForward, Volume2, Minimize2, Maximize2, Eye } from 'lucide-react';
import '@/styles/VideoControls.css';

function VideoControls({ videoRef, cameraRef, isMobile, onPlayPause, cameraReady, uniqueId, onFullscreen, isFullscreen = false }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isTemporaryShow, setIsTemporaryShow] = useState(false);
  const hideControlsTimeoutRef = useRef(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [fov, setFov] = useState(90);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);

  const [pinchState, setPinchState] = useState({
    isPinching: false,
    initialDistance: 0,
    initialFov: 90,
    startTime: 0
  });

  // 🔥 新增狀態來處理全域控制
  const [isGloballyHidden, setIsGloballyHidden] = useState(false);

  // 🔥 使用 useRef 來穩定化函數引用
  const handleScreenClickRef = useRef();

  const getDistance = (touches) => {
    if (touches.length < 2) return 0;
    
    const touch1 = touches[0];
    const touch2 = touches[1];
    
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  const handlePinchStart = useCallback((e) => {
    if (!isMobile || e.touches.length !== 2) return;
    
    const distance = getDistance(e.touches);
    const currentFov = cameraRef.current?.fov || 90;
    
    setPinchState({
      isPinching: true,
      initialDistance: distance,
      initialFov: currentFov,
      startTime: Date.now()
    });
    
    e.preventDefault();
    e.stopPropagation();
  }, [isMobile, cameraRef]);

  const handlePinchMove = useCallback((e) => {
    if (!isMobile || !pinchState.isPinching || e.touches.length !== 2) return;
    
    const currentDistance = getDistance(e.touches);
    const { initialDistance, initialFov } = pinchState;
    
    const scale = currentDistance / initialDistance;
    let newFov = initialFov / scale;
    
    newFov = Math.max(30, Math.min(120, newFov));
    
    if (cameraRef.current) {
      cameraRef.current.fov = newFov;
      cameraRef.current.updateProjectionMatrix();
      setFov(newFov);
    }
    
    e.preventDefault();
    e.stopPropagation();
  }, [isMobile, pinchState, cameraRef]);

  const handlePinchEnd = useCallback((e) => {
    if (!isMobile || !pinchState.isPinching) return;
    
    setPinchState({
      isPinching: false,
      initialDistance: 0,
      initialFov: 90,
      startTime: 0
    });
    
    e.preventDefault();
    e.stopPropagation();
  }, [isMobile, pinchState, cameraRef]);

  useEffect(() => {
    if (!isMobile) return;

    const videoControlsElement = document.querySelector(`[data-video-instance="${uniqueId}"]`);
    const canvasContainer = videoControlsElement?.querySelector('.canvas-container, .canvas-container-embedded');
    
    if (!canvasContainer) return;

    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        handlePinchStart(e);
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length === 2) {
        handlePinchMove(e);
      }
    };

    const handleTouchEnd = (e) => {
      if (e.touches.length < 2) {
        handlePinchEnd(e);
      }
    };

    canvasContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvasContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvasContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvasContainer.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    return () => {
      canvasContainer.removeEventListener('touchstart', handleTouchStart);
      canvasContainer.removeEventListener('touchmove', handleTouchMove);
      canvasContainer.removeEventListener('touchend', handleTouchEnd);
      canvasContainer.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isMobile, handlePinchStart, handlePinchMove, handlePinchEnd, uniqueId]);

  useEffect(() => {
    if (cameraRef.current) {
      const currentFov = cameraRef.current.fov;
      if (Math.abs(currentFov - fov) > 0.1) {
        setFov(currentFov);
      }
    }
  }, [cameraRef, fov]);

  // 🔥 處理 isFullscreen 狀態變化
  useEffect(() => {
    // console.log(`[${uniqueId}] VideoControls isFullscreen changed:`, isFullscreen);
    
    if (isFullscreen) {
      // console.log(`[${uniqueId}] Entering fullscreen - showing controls immediately`);
      setShowControls(true);
      setIsTemporaryShow(true);
      
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
      
      hideControlsTimeoutRef.current = setTimeout(() => {
        // console.log(`[${uniqueId}] Auto-hiding controls in fullscreen`);
        if (!isGloballyHidden) {
          setShowControls(false);
          setIsTemporaryShow(false);
        }
      }, 3000);
    }
  }, [isFullscreen, uniqueId, isGloballyHidden]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const playStateChange = () => {
      const playing = !video.paused;
      setIsPlaying(playing);
      
      if (!isFullscreen) {
        if (playing) {
          setShowControls(false);
          setIsTemporaryShow(false);
        } else {
          setShowControls(true);
          setIsTemporaryShow(false);
          if (hideControlsTimeoutRef.current) {
            clearTimeout(hideControlsTimeoutRef.current);
            hideControlsTimeoutRef.current = null;
          }
        }
      } else {
        // console.log(`[${uniqueId}] Fullscreen mode - not changing controls visibility on play state change`);
      }
    };

    const timeUpdate = () => setCurrentTime(video.currentTime);
    const durationChange = () => setDuration(video.duration);
    
    video.addEventListener('play', playStateChange);
    video.addEventListener('pause', playStateChange);
    video.addEventListener('timeupdate', timeUpdate);
    video.addEventListener('durationchange', durationChange);
    
    return () => {
      video.removeEventListener('play', playStateChange);
      video.removeEventListener('pause', playStateChange);
      video.removeEventListener('timeupdate', timeUpdate);
      video.removeEventListener('durationchange', durationChange);
    };
  }, [videoRef, isFullscreen, uniqueId]);

  // 🔥 修改 handleScreenClick，考慮全域隱藏狀態
  const handleScreenClick = useCallback((forceShow = false, comeFromHandleEnd = false) => {
    if (isGloballyHidden) {
      // console.log(`[${uniqueId}] Ignoring screen click - globally hidden`);
      return;
    }
    
    // console.log(`[${uniqueId}] handleScreenClick triggered:`, {
    //   forceShow,
    //   comeFromHandleEnd,
    //   isPlaying,
    //   isFullscreen,
    //   showControls,
    //   isTemporaryShow,
    //   isGloballyHidden,
    //   timestamp: new Date().toISOString()
    // });
    
    if (forceShow || comeFromHandleEnd) {
      // console.log(`[${uniqueId}] Force showing controls`);
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
      
      setShowControls(true);
      setIsTemporaryShow(true);

      const hideDelay = isFullscreen ? 3000 : 2000;
      hideControlsTimeoutRef.current = setTimeout(() => {
        // console.log(`[${uniqueId}] Auto-hiding controls after ${hideDelay}ms`);
        if (!isGloballyHidden) {
          setShowControls(false);
          setIsTemporaryShow(false);
        }
      }, hideDelay);
      return;
    }
    
    if (isPlaying) {
      // console.log(`[${uniqueId}] Video playing - showing controls temporarily`);
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
      
      setShowControls(true);
      setIsTemporaryShow(true);
      
      const hideDelay = isFullscreen ? 3000 : 2000;
      hideControlsTimeoutRef.current = setTimeout(() => {
        // console.log(`[${uniqueId}] Auto-hiding controls after ${hideDelay}ms (playing)`);
        if (!isGloballyHidden) {
          setShowControls(false);
          setIsTemporaryShow(false);
        }
      }, hideDelay);
    } else {
      // console.log(`[${uniqueId}] Video paused - keeping controls visible`);
      setShowControls(true);
      setIsTemporaryShow(false);
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
        hideControlsTimeoutRef.current = null;
      }
    }
  }, [uniqueId, isPlaying, isFullscreen, showControls, isTemporaryShow, isGloballyHidden]);

  // 🔥 更新 ref 中的函數引用
  useEffect(() => {
    handleScreenClickRef.current = handleScreenClick;
  }, [handleScreenClick]);

  // 🔥 穩定的全域函數註冊邏輯
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const instanceFunctionName = `showVideoControls_${uniqueId}`;
      const instanceForcedFunctionName = `showVideoControlsForced_${uniqueId}`;
      const instanceHideFunctionName = `hideVideoControls_${uniqueId}`;
      const instanceRestoreFunctionName = `restoreVideoControls_${uniqueId}`;
      
      // console.log(`[${uniqueId}] Registering ALL control functions`);
      
      const stableHandleScreenClick = (...args) => {
        if (handleScreenClickRef.current && !isGloballyHidden) {
          return handleScreenClickRef.current(...args);
        }
      };
      
      const stableHandleForcedScreenClick = (forceShow = true, comeFromHandleEnd = false) => {
        if (handleScreenClickRef.current && !isGloballyHidden) {
          return handleScreenClickRef.current(forceShow, comeFromHandleEnd);
        }
      };
      
      const hideControlsFunction = () => {
        // console.log(`[${uniqueId}] Global hide controls called`);
        setIsGloballyHidden(true);
        setShowControls(false);
        setIsTemporaryShow(false);
        if (hideControlsTimeoutRef.current) {
          clearTimeout(hideControlsTimeoutRef.current);
          hideControlsTimeoutRef.current = null;
        }
      };
      
      const restoreControlsFunction = () => {
        // console.log(`[${uniqueId}] Global restore controls called`);
        setIsGloballyHidden(false);
        if (!isPlaying) {
          setShowControls(true);
          setIsTemporaryShow(false);
        }
      };
      
      window[instanceFunctionName] = stableHandleScreenClick;
      window[instanceForcedFunctionName] = stableHandleForcedScreenClick;
      window[instanceHideFunctionName] = hideControlsFunction;
      window[instanceRestoreFunctionName] = restoreControlsFunction;
      
      window.showVideoControls = stableHandleScreenClick;
      window.showVideoControlsForced = stableHandleForcedScreenClick;
      
      return () => {
        // console.log(`[${uniqueId}] Cleaning up ALL control functions`);
        
        delete window[instanceFunctionName];
        delete window[instanceForcedFunctionName];
        delete window[instanceHideFunctionName];
        delete window[instanceRestoreFunctionName];
        
        if (window.showVideoControls === stableHandleScreenClick) {
          delete window.showVideoControls;
          delete window.showVideoControlsForced;
        }
      };
    }
  }, [uniqueId, isGloballyHidden]);

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused && !isFullscreen && onFullscreen && isMobile) {
      onFullscreen();
      setTimeout(() => {
        if (onPlayPause) {
          onPlayPause();
        } else {
          video.play().catch(console.error);
        }
        
        setTimeout(() => {
          const instanceForcedFunctionName = `showVideoControlsForced_${uniqueId}`;
          if (typeof window !== 'undefined' && window[instanceForcedFunctionName]) {
            window[instanceForcedFunctionName]();
          }
        }, 100);
      }, 100);
    } else {
      if (onPlayPause) {
        onPlayPause();
      } else {
        if (video.paused) {
          video.play().catch(console.error);
        } else {
          video.pause();
        }
      }
      
      setTimeout(() => {
        const instanceForcedFunctionName = `showVideoControlsForced_${uniqueId}`;
        if (typeof window !== 'undefined' && window[instanceForcedFunctionName]) {
          window[instanceForcedFunctionName]();
        }
      }, 100);
    }
  };

  const handleExitFullscreen = () => {
    if (onFullscreen) {
      onFullscreen();
    }
  };

  const handleFastBackward = () => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = Math.max(video.currentTime - 5, 0);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleFastForward = () => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = Math.min(video.currentTime + 5, video.duration);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleTimeChange = (e) => {
    const video = videoRef.current;
    if (!video) return;
    const value = parseFloat(e.target.value);
    setDragValue(value);
    const time = (duration * value) / 100;
    video.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e) => {
    const video = videoRef.current;
    if (!video) return;
    const value = parseFloat(e.target.value);
    video.volume = value;
    setVolume(value);
  };

  const handleFovChange = (e) => {
    const value = parseFloat(e.target.value);
    setFov(value);
    if (cameraRef.current) {
      cameraRef.current.fov = value;
      cameraRef.current.updateProjectionMatrix();
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgressValue = () => {
    if (isDragging) {
      return dragValue;
    }
    return (currentTime / duration) * 100 || 0;
  };

  useEffect(() => {
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, []);

  // 🔥 修改最終的控制項顯示邏輯
  const shouldShowControls = (showControls || isTemporaryShow) && !isGloballyHidden;

  // useEffect(() => {
  //   console.log(`[${uniqueId}] Global hidden state changed:`, isGloballyHidden);
  // }, [isGloballyHidden, uniqueId]);

  if (!isMobile || isFullscreen) {
    return (
      <>
        <div className={`video-controls-center ${shouldShowControls ? 'controls-visible' : 'controls-hidden'}`}>
          <div className="center-controls">
            <button 
              className="control-button-center play-pause-button"
              onClick={handlePlayPause}
              title={isPlaying ? '暫停' : '播放'}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={18} />}
            </button>

            {isFullscreen && !isPlaying && (
              <button 
                className="control-button-center exit-fullscreen-button"
                onClick={handleExitFullscreen}
                title="退出全螢幕"
              >
                <Minimize2 size={22} />
              </button>
            )}
          </div>
        </div>

        <div className={`video-controls-fullscreen w-full ${shouldShowControls ? 'controls-visible' : 'controls-hidden'} ${(isMobile || (!isMobile && !isFullscreen)) ? '' : 'mb-[37px]'}`}>
          <div className="fullscreen-controls">
            <div className={`flex max-md:flex-wrap max-md:gap-y-2 md:gap-x-6 ${(!isMobile && isFullscreen) ? "w-[99%]" : "w-full"}`}>
              <div className='controls-row'>
                <button 
                  className="control-button fast-forward-button"
                  onClick={handleFastBackward}
                  title="快退 5 秒"
                >
                  <span className='text-sm mr-[1px]'>5s</span>
                  <FastForward size={20} className='shrink-0 rotate-180' />
                </button>
                <button 
                  className="control-button fast-forward-button"
                  onClick={handleFastForward}
                  title="快進 5 秒"
                >
                  <FastForward size={20} className='shrink-0' />
                  <span className='text-sm ml-[1px]'>5s</span>
                </button>

                <div className="time-control">
                  <span className="time-display">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={getProgressValue()}
                    onChange={handleTimeChange}
                    onMouseDown={() => setIsDragging(true)}
                    onMouseUp={() => setIsDragging(false)}
                    onTouchStart={() => setIsDragging(true)}
                    onTouchEnd={() => setIsDragging(false)}
                    className="progress-slider"
                  />
                </div>
              </div>

              <div className='controls-row'>
                <div className="volume-control">
                  <Volume2 size={20} className='shrink-0 text-white' />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="volume-slider"
                    title={`音量: ${Math.round(volume * 100)}%`}
                  />
                </div>
                
                <div className="fov-control">
                  <Eye size={20} className='shrink-0 text-white' />
                  <input
                    type="range"
                    min="30"
                    max="120"
                    value={fov}
                    onChange={handleFovChange}
                    className="fov-slider"
                    title={`視野: ${Math.round(fov)}°`}
                  />
                  {isMobile && (
                    <span className="fov-hint text-xs text-white/70 ml-1">
                      或雙指縮放
                    </span>
                  )}
                </div>

                {!isMobile && !isFullscreen && (
                  <button 
                    className="control-button fullscreen-button"
                    onClick={onFullscreen}
                    title={isFullscreen ? "退出全螢幕" : "全螢幕"}
                  >
                    {!isFullscreen ? (
                      <Maximize2 size={20} className='shrink-0' />
                    ) : (
                      <Minimize2 size={20} className='shrink-0' />
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  } else {
    return (
      <div className={`video-controls-center ${shouldShowControls ? 'controls-visible' : 'controls-hidden'}`}>
       <div className="center-controls">
         <button 
           className="control-button-center play-pause-button"
           onClick={handlePlayPause}
           title={isPlaying ? '暫停' : '播放'}
         >
           {isPlaying ? <Pause size={20} /> : <Play size={18} />}
         </button>
       </div>
      </div>
   );
 }
}

export default VideoControls;