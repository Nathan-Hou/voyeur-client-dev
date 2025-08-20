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
  const [originalPlayState, setOriginalPlayState] = useState(false);

  const [pinchState, setPinchState] = useState({
    isPinching: false,
    initialDistance: 0,
    initialFov: 90,
    startTime: 0,
    // 新增：防止意外觸發的參數
    minDistanceThreshold: 50,
    scaleThreshold: 20,
    hasStartedScaling: false
  });

  // 🔥 新增狀態來處理全域控制
  const [isGloballyHidden, setIsGloballyHidden] = useState(false);

  // 🔥 使用 useRef 來穩定化函數引用
  const handleScreenClickRef = useRef();

  const getDistance = (touches) => {
    if (touches.length < 2) return 0;
    
    const touch1 = touches[0];
    const touch2 = touches[1];
    
    const deltaX = touch2.clientX - touch1.clientX;
    const deltaY = touch2.clientY - touch1.clientY;
    
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  };

  const notifyCanvasPinchState = useCallback((isPinching) => {
    if (typeof window !== 'undefined') {
      const pinchManagerKey = `pinchManager_${uniqueId}`;
      if (window[pinchManagerKey] && window[pinchManagerKey].setIsPinching) {
        window[pinchManagerKey].setIsPinching(isPinching);
      }
    }
  }, [uniqueId])

  const handlePinchStart = useCallback((e) => {
    if (!isMobile || e.touches.length !== 2) return;
    
    const distance = getDistance(e.touches);
    
    // 檢查最小距離閾值
    if (distance < 50) return;
    
    const currentFov = cameraRef.current?.fov || 90;
    
    setPinchState({
      isPinching: true,
      initialDistance: distance,
      initialFov: currentFov,
      startTime: Date.now(),
      minDistanceThreshold: 50,
      scaleThreshold: 20,
      hasStartedScaling: false
    });
    
    // 通知 Canvas 組件開始縮放
    notifyCanvasPinchState(true);
    
    e.preventDefault();
    e.stopPropagation();
  }, [isMobile, cameraRef, notifyCanvasPinchState]);

  const handlePinchMove = useCallback((e) => {
    if (!isMobile || !pinchState.isPinching || e.touches.length !== 2) return;
    
    const currentDistance = getDistance(e.touches);
    const { initialDistance, initialFov, hasStartedScaling, scaleThreshold } = pinchState;
    
    // 計算距離變化量
    const distanceChange = Math.abs(currentDistance - initialDistance);
    
    // 只有超過閾值才開始實際縮放
    if (!hasStartedScaling && distanceChange < scaleThreshold) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    // 標記已開始實際縮放
    if (!hasStartedScaling) {
      setPinchState(prev => ({
        ...prev,
        hasStartedScaling: true
      }));
    }
    
    const scale = currentDistance / initialDistance;
    let newFov = initialFov / scale;
    
    // 限制 FOV 範圍
    newFov = Math.max(30, Math.min(120, newFov));
    
    // 只有當變化足夠大時才更新
    if (cameraRef.current && Math.abs(cameraRef.current.fov - newFov) > 0.5) {
      cameraRef.current.fov = newFov;
      cameraRef.current.updateProjectionMatrix();
      setFov(newFov);
    }
    
    e.preventDefault();
    e.stopPropagation();
  }, [isMobile, pinchState, cameraRef]);

  const handlePinchEnd = useCallback((e) => {
    // console.log(`[${uniqueId}] handlePinchEnd called`, {
    //   isPinching: pinchState.isPinching,
    //   touchCount: e?.touches?.length || 0,
    //   eventType: e?.type
    // });
    
    if (!isMobile || !pinchState.isPinching) {
      // console.log(`[${uniqueId}] Early return from handlePinchEnd`);
      return;
    }
    
    // 重置 pinch 狀態
    setPinchState({
      isPinching: false,
      initialDistance: 0,
      initialFov: 90,
      startTime: 0,
      minDistanceThreshold: 50,
      scaleThreshold: 20,
      hasStartedScaling: false
    });
    
    // 延遲通知 Canvas 組件結束縮放，確保狀態完全清理
    setTimeout(() => {
      // console.log(`[${uniqueId}] Notifying Canvas: pinch ended`);
      notifyCanvasPinchState(false);
    }, 50);
    
    e.preventDefault();
    e.stopPropagation();
  }, [isMobile, pinchState.isPinching, notifyCanvasPinchState, uniqueId]);
  
  useEffect(() => {
    if (!isMobile) return;
  
    const videoControlsElement = document.querySelector(`[data-video-instance="${uniqueId}"]`);
    const canvasContainer = videoControlsElement?.querySelector('.canvas-container, .canvas-container-embedded');
    
    if (!canvasContainer) return;
  
    let touchStartTime = 0;
    let lastTouchCount = 0;
    let pinchEndTimer = null;
  
    const handleTouchStart = (e) => {
      // console.log(`[${uniqueId}] TouchStart:`, {
      //   touchCount: e.touches.length,
      //   isPinching: pinchState.isPinching
      // });
      
      touchStartTime = Date.now();
      lastTouchCount = e.touches.length;
      
      // 清理之前的定時器
      if (pinchEndTimer) {
        clearTimeout(pinchEndTimer);
        pinchEndTimer = null;
      }
      
      if (e.touches.length === 2) {
        const distance = getDistance(e.touches);
        
        // 檢查是否為有效的兩指觸控
        if (distance >= 50 && distance <= 500) {
          handlePinchStart(e);
        } else {
          // console.log(`[${uniqueId}] Invalid pinch distance:`, distance);
        }
      } else if (e.touches.length === 1 && pinchState.isPinching) {
        // 從兩指變為單指，結束縮放
        // console.log(`[${uniqueId}] Single touch while pinching - ending pinch`);
        handlePinchEnd(e);
      }
    };
  
    const handleTouchMove = (e) => {
      const currentTouchCount = e.touches.length;
      
      // console.log(`[${uniqueId}] TouchMove:`, {
      //   touchCount: currentTouchCount,
      //   isPinching: pinchState.isPinching,
      //   hasStartedScaling: pinchState.hasStartedScaling
      // });
      
      if (currentTouchCount === 2 && pinchState.isPinching) {
        // 確實的兩指縮放
        handlePinchMove(e);
      } else if (currentTouchCount !== 2 && pinchState.isPinching) {
        // 觸點數量改變，立即結束縮放
        // console.log(`[${uniqueId}] Touch count changed during pinch - ending`);
        handlePinchEnd(e);
      } else if (currentTouchCount >= 2 && !pinchState.isPinching) {
        // 可能是新的兩指操作
        handleTouchStart(e);
      }
      
      lastTouchCount = currentTouchCount;
    };
  
    const handleTouchEnd = (e) => {
      const remainingTouches = e.touches.length;
      const touchDuration = Date.now() - touchStartTime;
      
      // console.log(`[${uniqueId}] TouchEnd:`, {
      //   remainingTouches,
      //   touchDuration,
      //   isPinching: pinchState.isPinching,
      //   hasStartedScaling: pinchState.hasStartedScaling
      // });
      
      // 如果是很短的觸控且沒有實際縮放，可能是誤觸
      if (pinchState.isPinching && 
          !pinchState.hasStartedScaling && 
          touchDuration < 200) {
        // console.log(`[${uniqueId}] Short touch without scaling - ending pinch`);
        handlePinchEnd(e);
        return;
      }
      
      // 當剩餘觸點少於 2 個時結束縮放
      if (remainingTouches < 2 && pinchState.isPinching) {
        // console.log(`[${uniqueId}] Less than 2 touches remaining - ending pinch`);
        handlePinchEnd(e);
      }
      
      // 設置一個安全定時器，如果觸控完全結束但狀態還沒恢復
      if (remainingTouches === 0 && pinchState.isPinching) {
        pinchEndTimer = setTimeout(() => {
          // console.log(`[${uniqueId}] Safety timer: forcing pinch end`);
          if (pinchState.isPinching) {
            handlePinchEnd({ touches: [], type: 'safety-timeout' });
          }
        }, 500);
      }
      
      lastTouchCount = remainingTouches;
    };
  
    const handleTouchCancel = (e) => {
      // console.log(`[${uniqueId}] TouchCancel`);
      if (pinchState.isPinching) {
        handlePinchEnd(e);
      }
      
      // 清理定時器
      if (pinchEndTimer) {
        clearTimeout(pinchEndTimer);
        pinchEndTimer = null;
      }
    };
  
    // 防止瀏覽器默認手勢（特別是 Safari）
    const preventGesture = (e) => {
      // console.log(`[${uniqueId}] Preventing gesture:`, e.type);
      e.preventDefault();
      e.stopPropagation();
    };
  
    const options = { passive: false };
    
    canvasContainer.addEventListener('touchstart', handleTouchStart, options);
    canvasContainer.addEventListener('touchmove', handleTouchMove, options);
    canvasContainer.addEventListener('touchend', handleTouchEnd, options);
    canvasContainer.addEventListener('touchcancel', handleTouchCancel, options);
    
    // 防止 Safari 的手勢事件
    canvasContainer.addEventListener('gesturestart', preventGesture, options);
    canvasContainer.addEventListener('gesturechange', preventGesture, options);
    canvasContainer.addEventListener('gestureend', preventGesture, options);
  
    return () => {
      canvasContainer.removeEventListener('touchstart', handleTouchStart);
      canvasContainer.removeEventListener('touchmove', handleTouchMove);
      canvasContainer.removeEventListener('touchend', handleTouchEnd);
      canvasContainer.removeEventListener('touchcancel', handleTouchCancel);
      canvasContainer.removeEventListener('gesturestart', preventGesture);
      canvasContainer.removeEventListener('gesturechange', preventGesture);
      canvasContainer.removeEventListener('gestureend', preventGesture);
      
      // 清理定時器
      if (pinchEndTimer) {
        clearTimeout(pinchEndTimer);
      }
    };
  }, [isMobile, handlePinchStart, handlePinchMove, handlePinchEnd, uniqueId, pinchState]);
    
  // 新增一個強制恢復函數，可以從外部調用
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const forceRestoreKey = `forceRestoreVideoControls_${uniqueId}`;
      
      window[forceRestoreKey] = () => {
        // console.log(`[${uniqueId}] Force restoring VideoControls state`);
        setPinchState({
          isPinching: false,
          initialDistance: 0,
          initialFov: 90,
          startTime: 0,
          minDistanceThreshold: 50,
          scaleThreshold: 20,
          hasStartedScaling: false
        });
        notifyCanvasPinchState(false);
      };
      
      return () => {
        delete window[forceRestoreKey];
      };
    }
  }, [uniqueId, notifyCanvasPinchState]);

  // 增強清理效果
  useEffect(() => {
    return () => {
      // console.log(`[${uniqueId}] VideoControls unmounting - cleaning up`);
      // 組件卸載時確保通知 Canvas 結束縮放
      if (pinchState.isPinching) {
        notifyCanvasPinchState(false);
      }
    };
  }, [pinchState.isPinching, notifyCanvasPinchState, uniqueId]);

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
    // 非手機版的話，本來就要先暫停才能縮小，所以不可再重複執行切換暫停/播放。手機版的話需要先檢查目前是播放還是暫停的狀態
    if (isMobile) {
      const video = videoRef.current;
      if (video && !video.paused) {
        handlePlayPause();
      }
    }
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

  // 🔥 新增：防抖函數
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // 🔥 新增：防抖的進度條更新函數
  const debouncedTimeUpdate = useCallback(
    debounce((time) => {
      const video = videoRef.current;
      if (video) {
        video.currentTime = time;
        setCurrentTime(time);
      }
    }, 16), // 約 60fps
    []
  );

  // 🔥 新增：優化 iPhone 觸控體驗的進度條處理
  const handleTimeChangeOptimized = (e) => {
    const video = videoRef.current;
    if (!video) return;
    
    // 防止在觸控過程中觸發其他事件
    e.preventDefault();
    e.stopPropagation();
    
    const value = parseFloat(e.target.value);
    setDragValue(value);
    const time = (duration * value) / 100;
    
    // 在 iPhone 上使用防抖更新
    if (isMobile) {
      debouncedTimeUpdate(time);
    } else {
      video.currentTime = time;
      setCurrentTime(time);
    }
  };



  // 🔥 新增：觸控開始處理
  const handleTimeTouchStart = (e) => {
    if (isMobile && e.touches && e.touches.length > 0) {
      setIsDragging(true);
      e.preventDefault();
      e.stopPropagation();
      
      // 記錄觸控開始位置
      const touch = e.touches[0];
      const rect = e.target.getBoundingClientRect();
      const clickX = touch.clientX - rect.left;
      const percentage = (clickX / rect.width) * 100;
      
      // 立即跳轉到點擊位置
      const video = videoRef.current;
      if (video) {
        const newTime = (duration * percentage) / 100;
        video.currentTime = Math.max(0, Math.min(newTime, duration));
        setCurrentTime(video.currentTime);
        setDragValue(percentage);
      }
      
      // 暫停視頻播放
      if (video && !video.paused) {
        video.pause();
        setOriginalPlayState(true);
      } else {
        setOriginalPlayState(false);
      }
    }
  };

  // 🔥 新增：觸控移動處理
  const handleTimeTouchMove = (e) => {
    if (isMobile && isDragging && e.touches && e.touches.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      
      const touch = e.touches[0];
      const rect = e.target.getBoundingClientRect();
      const clickX = touch.clientX - rect.left;
      const percentage = Math.max(0, Math.min((clickX / rect.width) * 100, 100));
      
      setDragValue(percentage);
      const newTime = (duration * percentage) / 100;
      setCurrentTime(newTime);
    }
  };

  // 🔥 新增：觸控結束處理
  const handleTimeTouchEnd = (e) => {
    if (isMobile) {
      e.preventDefault();
      e.stopPropagation();
      
      // 最終更新視頻時間
      const video = videoRef.current;
      if (video) {
        const finalTime = (duration * dragValue) / 100;
        video.currentTime = Math.max(0, Math.min(finalTime, duration));
        setCurrentTime(video.currentTime);
      }
      
      // 延遲恢復狀態
      setTimeout(() => {
        setIsDragging(false);
        
        // 恢復原始播放狀態
        if (video && originalPlayState && video.paused) {
          video.play().catch(console.error);
        }
        setOriginalPlayState(false);
      }, 100);
    }
  };

  // 🔥 新增：滑鼠事件處理（保持向後兼容）
  const handleTimeMouseDown = () => {
    if (!isMobile) {
      setIsDragging(true);
    }
  };

  const handleTimeMouseUp = () => {
    if (!isMobile) {
      setIsDragging(false);
    }
  };

  const handleVolumeChange = (e) => {
    const video = videoRef.current;
    if (!video) return;
    const value = parseFloat(e.target.value);
    video.volume = value;
    setVolume(value);
  };

  // 🔥 新增：優化的音量控制處理
  const handleVolumeChangeOptimized = (e) => {
    const video = videoRef.current;
    if (!video) return;
    
    // 防止在觸控過程中觸發其他事件
    e.preventDefault();
    e.stopPropagation();
    
    const value = parseFloat(e.target.value);
    
    // 在 iPhone 上使用防抖更新
    if (isMobile) {
      requestAnimationFrame(() => {
        video.volume = value;
        setVolume(value);
      });
    } else {
      video.volume = value;
      setVolume(value);
    }
  };

  // 🔥 新增：音量控制觸控事件處理
  const handleVolumeTouchStart = (e) => {
    if (isMobile && e.touches && e.touches.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      
      // 記錄觸控開始位置並立即更新
      const touch = e.touches[0];
      const rect = e.target.getBoundingClientRect();
      const clickX = touch.clientX - rect.left;
      const percentage = Math.max(0, Math.min((clickX / rect.width), 1));
      
      const video = videoRef.current;
      if (video) {
        video.volume = percentage;
        setVolume(percentage);
      }
    }
  };

  const handleVolumeTouchEnd = (e) => {
    if (isMobile) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // 🔥 新增：音量控制觸控移動處理
  const handleVolumeTouchMove = (e) => {
    if (isMobile && e.touches && e.touches.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      
      const touch = e.touches[0];
      const rect = e.target.getBoundingClientRect();
      const clickX = touch.clientX - rect.left;
      const percentage = Math.max(0, Math.min((clickX / rect.width), 1));
      
      const video = videoRef.current;
      if (video) {
        video.volume = percentage;
        setVolume(percentage);
      }
    }
  };

  const handleFovChange = (e) => {
    const value = parseFloat(e.target.value);
    setFov(value);
    if (cameraRef.current) {
      cameraRef.current.fov = value;
      cameraRef.current.updateProjectionMatrix();
    }
  };

  // 🔥 新增：優化的 FOV 控制處理
  const handleFovChangeOptimized = (e) => {
    // 防止在觸控過程中觸發其他事件
    e.preventDefault();
    e.stopPropagation();
    
    const value = parseFloat(e.target.value);
    
    // 在 iPhone 上使用防抖更新
    if (isMobile) {
      requestAnimationFrame(() => {
        setFov(value);
        if (cameraRef.current) {
          cameraRef.current.fov = value;
          cameraRef.current.updateProjectionMatrix();
        }
      });
    } else {
      setFov(value);
      if (cameraRef.current) {
        cameraRef.current.fov = value;
        cameraRef.current.updateProjectionMatrix();
      }
    }
  };

  // 🔥 新增：FOV 控制觸控事件處理
  const handleFovTouchStart = (e) => {
    if (isMobile && e.touches && e.touches.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      
      // 記錄觸控開始位置並立即更新
      const touch = e.touches[0];
      const rect = e.target.getBoundingClientRect();
      const clickX = touch.clientX - rect.left;
      const percentage = Math.max(0, Math.min((clickX / rect.width), 1));
      const newFov = 30 + (percentage * 90); // 30 到 120 度
      
      setFov(newFov);
      if (cameraRef.current) {
        cameraRef.current.fov = newFov;
        cameraRef.current.updateProjectionMatrix();
      }
    }
  };

  const handleFovTouchEnd = (e) => {
    if (isMobile) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // 🔥 新增：FOV 控制觸控移動處理
  const handleFovTouchMove = (e) => {
    if (isMobile && e.touches && e.touches.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      
      const touch = e.touches[0];
      const rect = e.target.getBoundingClientRect();
      const clickX = touch.clientX - rect.left;
      const percentage = Math.max(0, Math.min((clickX / rect.width), 1));
      const newFov = 30 + (percentage * 90); // 30 到 120 度
      
      setFov(newFov);
      if (cameraRef.current) {
        cameraRef.current.fov = newFov;
        cameraRef.current.updateProjectionMatrix();
      }
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

  // 🔥 新增：清理防抖定時器
  useEffect(() => {
    return () => {
      // 清理防抖定時器
      if (debouncedTimeUpdate && debouncedTimeUpdate.cancel) {
        debouncedTimeUpdate.cancel();
      }
    };
  }, [debouncedTimeUpdate]);

  // 🔥 新增：點擊進度條跳轉功能
  const handleProgressClick = (e) => {
    if (isMobile) {
      e.preventDefault();
      e.stopPropagation();
      
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min((clickX / rect.width) * 100, 100));
      
      const video = videoRef.current;
      if (video) {
        const newTime = (duration * percentage) / 100;
        video.currentTime = Math.max(0, Math.min(newTime, duration));
        setCurrentTime(video.currentTime);
        setDragValue(percentage);
      }
    }
  };

  // 🔥 新增：音量點擊跳轉功能
  const handleVolumeClick = (e) => {
    if (isMobile) {
      e.preventDefault();
      e.stopPropagation();
      
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min((clickX / rect.width), 1));
      
      const video = videoRef.current;
      if (video) {
        video.volume = percentage;
        setVolume(percentage);
      }
    }
  };

  // 🔥 新增：FOV 點擊跳轉功能
  const handleFovClick = (e) => {
    if (isMobile) {
      e.preventDefault();
      e.stopPropagation();
      
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min((clickX / rect.width), 1));
      const newFov = 30 + (percentage * 90); // 30 到 120 度
      
      setFov(newFov);
      if (cameraRef.current) {
        cameraRef.current.fov = newFov;
        cameraRef.current.updateProjectionMatrix();
      }
    }
  };

  // 🔥 修改最終的控制項顯示邏輯
  const shouldShowControls = (showControls || isTemporaryShow) && !isGloballyHidden;

  // useEffect(() => {
  //   console.log(`[${uniqueId}] Global hidden state changed:`, isGloballyHidden);
  // }, [isGloballyHidden, uniqueId]);

  // useEffect(() => {
  //   // 只在開發環境或測試時啟用
  //   if (process.env.NODE_ENV !== 'production') {
  //     const handleKeyDown = (e) => {
  //       // 檢查是否在當前視頻實例的容器內
  //       const videoElement = document.querySelector(`[data-video-instance="${uniqueId}"]`);
  //       if (!videoElement || !document.activeElement || !videoElement.contains(document.activeElement)) {
  //         return;
  //       }
        
  //       if (e.key === '=' || e.key === '+') {
  //         // 模擬放大（減小 FOV）
  //         e.preventDefault();
  //         const newFov = Math.max(30, fov - 5);
  //         setFov(newFov);
  //         if (cameraRef.current) {
  //           cameraRef.current.fov = newFov;
  //           cameraRef.current.updateProjectionMatrix();
  //         }
  //         console.log(`[測試] FOV 減小到: ${newFov}°`);
          
  //         // 模擬 pinch 狀態給 Canvas
  //         if (typeof window !== 'undefined') {
  //           const pinchManagerKey = `pinchManager_${uniqueId}`;
  //           if (window[pinchManagerKey]) {
  //             window[pinchManagerKey].setIsPinching(true);
  //             setTimeout(() => {
  //               window[pinchManagerKey].setIsPinching(false);
  //             }, 100);
  //           }
  //         }
  //       } else if (e.key === '-' || e.key === '_') {
  //         // 模擬縮小（增大 FOV）
  //         e.preventDefault();
  //         const newFov = Math.min(120, fov + 5);
  //         setFov(newFov);
  //         if (cameraRef.current) {
  //           cameraRef.current.fov = newFov;
  //           cameraRef.current.updateProjectionMatrix();
  //         }
  //         console.log(`[測試] FOV 增大到: ${newFov}°`);
          
  //         // 模擬 pinch 狀態給 Canvas
  //         if (typeof window !== 'undefined') {
  //           const pinchManagerKey = `pinchManager_${uniqueId}`;
  //           if (window[pinchManagerKey]) {
  //             window[pinchManagerKey].setIsPinching(true);
  //             setTimeout(() => {
  //               window[pinchManagerKey].setIsPinching(false);
  //             }, 100);
  //           }
  //         }
  //       } else if (e.key === 'r' || e.key === 'R') {
  //         // 重置 FOV
  //         e.preventDefault();
  //         const resetFov = 90;
  //         setFov(resetFov);
  //         if (cameraRef.current) {
  //           cameraRef.current.fov = resetFov;
  //           cameraRef.current.updateProjectionMatrix();
  //         }
  //         console.log(`[測試] FOV 重置到: ${resetFov}°`);
  //       }
  //     };
  
  //     // 讓容器可以接收鍵盤事件
  //     const videoElement = document.querySelector(`[data-video-instance="${uniqueId}"]`);
  //     if (videoElement) {
  //       videoElement.tabIndex = 0; // 使容器可聚焦
  //       videoElement.style.outline = 'none'; // 移除聚焦時的邊框
  //     }
  
  //     document.addEventListener('keydown', handleKeyDown);
      
  //     // 顯示測試提示（僅在第一次載入時）
  //     if (!window.fovTestHintShown) {
  //       console.log(`
  // 🔧 FOV 測試快捷鍵:
  //   + 或 = : 放大（減小 FOV）
  //   - 或 _ : 縮小（增大 FOV）
  //   R     : 重置 FOV 到 90°
    
  // ⚠️  請先點擊視頻區域以聚焦，然後使用快捷鍵
  //       `);
  //       window.fovTestHintShown = true;
  //     }
  
  //     return () => {
  //       document.removeEventListener('keydown', handleKeyDown);
  //     };
  //   }
  // }, [uniqueId, fov, cameraRef]);
  

  // 添加一個測試用的模擬雙指縮放函數
  // const simulatePinchZoom = useCallback((direction) => {
  //   if (process.env.NODE_ENV !== 'production') {
  //     const currentFov = cameraRef.current?.fov || 90;
      
  //     // 模擬 pinch start
  //     const mockPinchState = {
  //       isPinching: true,
  //       initialDistance: 200,
  //       initialFov: currentFov,
  //       startTime: Date.now(),
  //       minDistanceThreshold: 50,
  //       scaleThreshold: 20,
  //       hasStartedScaling: true
  //     };
      
  //     setPinchState(mockPinchState);
      
  //     // 通知 Canvas 開始縮放
  //     if (typeof window !== 'undefined') {
  //       const pinchManagerKey = `pinchManager_${uniqueId}`;
  //       if (window[pinchManagerKey]) {
  //         window[pinchManagerKey].setIsPinching(true);
  //       }
  //     }
      
  //     // 模擬縮放動作
  //     setTimeout(() => {
  //       const scale = direction > 0 ? 1.2 : 0.8; // 放大或縮小
  //       let newFov = currentFov / scale;
  //       newFov = Math.max(30, Math.min(120, newFov));
        
  //       if (cameraRef.current) {
  //         cameraRef.current.fov = newFov;
  //         cameraRef.current.updateProjectionMatrix();
  //         setFov(newFov);
  //       }
        
  //       console.log(`[模擬縮放] FOV: ${currentFov}° → ${newFov}°`);
        
  //       // 模擬 pinch end
  //       setTimeout(() => {
  //         setPinchState({
  //           isPinching: false,
  //           initialDistance: 0,
  //           initialFov: 90,
  //           startTime: 0,
  //           minDistanceThreshold: 50,
  //           scaleThreshold: 20,
  //           hasStartedScaling: false
  //         });
          
  //         // 通知 Canvas 結束縮放
  //         if (typeof window !== 'undefined') {
  //           const pinchManagerKey = `pinchManager_${uniqueId}`;
  //           if (window[pinchManagerKey]) {
  //             window[pinchManagerKey].setIsPinching(false);
  //           }
  //         }
  //       }, 100);
  //     }, 50);
  //   }
  // }, [cameraRef, uniqueId]);
  
  
  // // 在開發環境中將測試函數暴露到 window 對象
  // useEffect(() => {
  //   if (process.env.NODE_ENV !== 'production') {
  //     window[`testPinchZoom_${uniqueId}`] = simulatePinchZoom;
      
  //     return () => {
  //       delete window[`testPinchZoom_${uniqueId}`];
  //     };
  //   }
  // }, [simulatePinchZoom, uniqueId]);

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

            {isFullscreen && (isMobile || !isPlaying) && (
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

        <div className={`video-controls-fullscreen w-full ${shouldShowControls ? 'controls-visible' : 'controls-hidden'}`}>
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
                    onChange={handleTimeChangeOptimized}
                    onMouseDown={handleTimeMouseDown}
                    onMouseUp={handleTimeMouseUp}
                    onTouchStart={handleTimeTouchStart}
                    onTouchMove={handleTimeTouchMove}
                    onTouchEnd={handleTimeTouchEnd}
                    onClick={handleProgressClick}
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
                    onChange={handleVolumeChangeOptimized}
                    onMouseDown={handleVolumeTouchStart}
                    onMouseUp={handleVolumeTouchEnd}
                    onTouchStart={handleVolumeTouchStart}
                    onTouchMove={handleVolumeTouchMove}
                    onTouchEnd={handleVolumeTouchEnd}
                    onClick={handleVolumeClick}
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
                    onChange={handleFovChangeOptimized}
                    onMouseDown={handleFovTouchStart}
                    onMouseUp={handleFovTouchEnd}
                    onTouchStart={handleFovTouchStart}
                    onTouchMove={handleFovTouchMove}
                    onTouchEnd={handleFovTouchEnd}
                    onClick={handleFovClick}
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
          <p className={`text-center text-sm text-white/75 py-1 bg-black ${!isFullscreen ? "hidden" : ""}`}>© Effect Player</p>
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