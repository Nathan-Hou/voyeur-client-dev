// bug (0718): 第一個播放器全螢幕時，前兩秒會顯示未全螢幕的 VideoControls (好像是別的播放器的)

"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, FastForward, Volume2, Minimize2, Maximize2, Eye } from 'lucide-react';
import '@/styles/VideoControls.css';

function VideoControls({ videoRef, cameraRef, isMobile, onPlayPause, cameraReady, uniqueId, onFullscreen, isFullscreen = false }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isTemporaryShow, setIsTemporaryShow] = useState(false);
  const hideControlsTimeoutRef = useRef(null);

  // 原有的完整控制功能狀態
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [fov, setFov] = useState(90);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);

  // 🆕 雙指縮放相關狀態
  const [pinchState, setPinchState] = useState({
    isPinching: false,
    initialDistance: 0,
    initialFov: 90,
    startTime: 0
  });

  const getDistance = (touches) => {
    if (touches.length < 2) return 0;
    
    const touch1 = touches[0];
    const touch2 = touches[1];
    
    return Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) +
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );
  };

  // 🆕 處理雙指縮放開始
  const handlePinchStart = useCallback((e) => {
    // 只有手機版且有兩個觸控點才處理
    if (!isMobile || e.touches.length !== 2) return;
    
    const distance = getDistance(e.touches);
    const currentFov = cameraRef.current?.fov || 90;
    
    // console.log('Pinch start:', { distance, currentFov });
    
    setPinchState({
      isPinching: true,
      initialDistance: distance,
      initialFov: currentFov,
      startTime: Date.now()
    });
    
    // 阻止默認行為和事件冒泡
    e.preventDefault();
    e.stopPropagation();
  }, [isMobile, cameraRef]);

  // 🆕 處理雙指縮放移動
  const handlePinchMove = useCallback((e) => {
    if (!isMobile || !pinchState.isPinching || e.touches.length !== 2) return;
    
    const currentDistance = getDistance(e.touches);
    const { initialDistance, initialFov } = pinchState;
    
    // 計算縮放比例
    const scale = currentDistance / initialDistance;
    
    // 計算新的 FOV (縮放時反向調整 FOV)
    // 雙指拉遠 (scale > 1) = 放大 = FOV 變小
    // 雙指拉近 (scale < 1) = 縮小 = FOV 變大
    let newFov = initialFov / scale;
    
    // 限制 FOV 範圍 (30-120 度)
    newFov = Math.max(30, Math.min(120, newFov));
    
    // 更新相機 FOV
    if (cameraRef.current) {
      cameraRef.current.fov = newFov;
      cameraRef.current.updateProjectionMatrix();
      setFov(newFov);
    }
    
    // console.log('Pinch move:', { 
    //   scale: scale.toFixed(2), 
    //   newFov: newFov.toFixed(1),
    //   currentDistance,
    //   initialDistance
    // });
    
    // 阻止默認行為和事件冒泡
    e.preventDefault();
    e.stopPropagation();
  }, [isMobile, pinchState, cameraRef]);

  // 🆕 處理雙指縮放結束
  const handlePinchEnd = useCallback((e) => {
    if (!isMobile || !pinchState.isPinching) return;
    
    const endTime = Date.now();
    const duration = endTime - pinchState.startTime;
    
    // console.log('Pinch end:', { 
    //   duration, 
    //   finalFov: cameraRef.current?.fov || 90 
    // });
    
    // 重置縮放狀態
    setPinchState({
      isPinching: false,
      initialDistance: 0,
      initialFov: 90,
      startTime: 0
    });
    
    // 阻止默認行為和事件冒泡
    e.preventDefault();
    e.stopPropagation();
  }, [isMobile, pinchState, cameraRef]);

  // useEffect(() => {
  //   console.log('🚀 useEffect - wheel zoom setup START');
    
  //   if (isMobile || !cameraReady || !cameraRef.current) return;
  
  //   // 🔥 找到當前 VideoControls 對應的 Canvas 容器
  //   // 方法1: 通過父元素查找
  //   const videoControlsElement = document.querySelector(`[data-video-instance="${uniqueId}"]`);
  //   const canvasContainer = videoControlsElement?.querySelector('.canvas-container, .canvas-container-embedded');
    
  //   // 方法2: 如果方法1不行，嘗試通過最近的父元素查找
  //   // const canvasContainer = document.querySelector(`[data-video-instance="${uniqueId}"] .canvas-container, [data-video-instance="${uniqueId}"] .canvas-container-embedded`);
    
  //   console.log('🎯 Canvas container found:', canvasContainer);
    
  //   if (!canvasContainer) {
  //     console.log('❌ No canvas container found for this instance');
  //     return;
  //   }
  
  //   // 檢查中心元素
  //   const rect = canvasContainer.getBoundingClientRect();
  //   const centerX = rect.left + rect.width / 2;
  //   const centerY = rect.top + rect.height / 2;
  //   const elementAtCenter = document.elementFromPoint(centerX, centerY);
  //   console.log('📍 Element at center:', elementAtCenter);
    
  //   const handleWheel = (e) => {
  //     console.log('🎡 Wheel event triggered!', {
  //       deltaY: e.deltaY,
  //       ctrlKey: e.ctrlKey,
  //       target: e.target,
  //       currentTarget: e.currentTarget
  //     });
      
  //     if (e.ctrlKey) {
  //       e.preventDefault();
  //       e.stopPropagation(); // 🔥 阻止事件冒泡
        
  //       const currentFov = cameraRef.current?.fov || 90;
  //       const delta = e.deltaY > 0 ? 3 : -3;
  //       let newFov = currentFov + delta;
        
  //       newFov = Math.max(30, Math.min(120, newFov));
        
  //       if (cameraRef.current) {
  //         cameraRef.current.fov = newFov;
  //         cameraRef.current.updateProjectionMatrix();
  //         setFov(newFov);
  //         console.log('🎡 FOV changed:', { currentFov, newFov });
  //       }
  //     }
  //   };
  
  //   // 🔥 在 Canvas 容器上添加事件監聽，並設置 capture: true
  //   canvasContainer.addEventListener('wheel', handleWheel, { 
  //     passive: false, 
  //     capture: true  // 在捕獲階段攔截事件
  //   });
    
  //   console.log('✅ Wheel event listener added to specific canvas');
    
  //   return () => {
  //     canvasContainer.removeEventListener('wheel', handleWheel, { capture: true });
  //   };
  // }, [isMobile, cameraReady, cameraRef.current, uniqueId]); // 🔥 加入 uniqueId 依賴

  // 🆕 計算兩點之間的距離
  
  // 處理雙指縮放的 useEffect

    useEffect(() => {
    if (!isMobile) return;

    // 🔥 這裡也需要更新為精確查找
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
  }, [isMobile, handlePinchStart, handlePinchMove, handlePinchEnd, uniqueId]); // 🔥 加入 uniqueId 依賴
  
  // 🆕 註冊全域觸控事件監聽器（用於雙指縮放）
  useEffect(() => {
    if (!isMobile) return;

    // 找到 Canvas 容器
    const canvasContainer = document.querySelector('.canvas-container, .canvas-container-embedded');
    if (!canvasContainer) return;

    // 添加觸控事件監聽器
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
      // 當觸控點少於 2 個時結束縮放
      if (e.touches.length < 2) {
        handlePinchEnd(e);
      }
    };

    // 添加事件監聽器
    canvasContainer.addEventListener('touchstart', handleTouchStart, { passive: false });
    canvasContainer.addEventListener('touchmove', handleTouchMove, { passive: false });
    canvasContainer.addEventListener('touchend', handleTouchEnd, { passive: false });
    canvasContainer.addEventListener('touchcancel', handleTouchEnd, { passive: false });

    // 清理函數
    return () => {
      canvasContainer.removeEventListener('touchstart', handleTouchStart);
      canvasContainer.removeEventListener('touchmove', handleTouchMove);
      canvasContainer.removeEventListener('touchend', handleTouchEnd);
      canvasContainer.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isMobile, handlePinchStart, handlePinchMove, handlePinchEnd]);

  // 🆕 同步 FOV 狀態與相機
  useEffect(() => {
    if (cameraRef.current) {
      const currentFov = cameraRef.current.fov;
      if (Math.abs(currentFov - fov) > 0.1) {
        setFov(currentFov);
      }
    }
  }, [cameraRef, fov]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const playStateChange = () => {
      const playing = !video.paused;
      setIsPlaying(playing);
      
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
    };

    // 原有的事件監聽器
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
  }, [videoRef]);

  // 處理點擊顯示控制按鈕
  const handleScreenClick = (forceShow = false, comeFromHandleEnd = false) => {
    console.log('handleScreenClick triggered, isPlaying:', isPlaying, 'isFullscreen:', isFullscreen, 'forceShow:', forceShow, " comeFromHandleEnd: ", comeFromHandleEnd);
    
    // 如果是強制顯示（來自按鈕點擊），直接顯示並設定 2 秒後隱藏
    if (forceShow || comeFromHandleEnd) {
      // console.log('Force showing controls temporarily');
      console.log("handleScreenClick. if.")
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
      
      setShowControls(true);
      setIsTemporaryShow(true);

      hideControlsTimeoutRef.current = setTimeout(() => {
        // console.log('Hiding controls after 2 seconds (forced)');
        setShowControls(false);
        setIsTemporaryShow(false);
      }, 2000);
      return;
    }
    
    if (isPlaying) {
      // console.log('Video playing - showing controls temporarily');
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
      
      setShowControls(true);
      setIsTemporaryShow(true);
      
      hideControlsTimeoutRef.current = setTimeout(() => {
        // console.log('Hiding controls after 2 second');
        setShowControls(false);
        setIsTemporaryShow(false);
      }, 2000);
    } else {
      // console.log('Video paused - ensuring controls are visible');
      setShowControls(true);
      setIsTemporaryShow(false);
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
        hideControlsTimeoutRef.current = null;
      }
    }
  };

  // 暴露給父組件的方法
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.showVideoControls = handleScreenClick;
      // 新增：專門給按鈕點擊使用的函數
      window.showVideoControlsForced = (forceShow  = true, comeFromHandleEnd = false) => handleScreenClick(forceShow, comeFromHandleEnd);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        delete window.showVideoControls;
        delete window.showVideoControlsForced;
      }
    };
  }, [isPlaying, showControls]);

  // 清理定時器
  useEffect(() => {
    return () => {
      if (hideControlsTimeoutRef.current) {
        clearTimeout(hideControlsTimeoutRef.current);
      }
    };
  }, []);

  // 修改後的播放/暫停處理函數
  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    // 修改：只有手機才自動進入全螢幕
    if (video.paused && !isFullscreen && onFullscreen && isMobile) {
      // 只有手機才自動進入全螢幕，平板和電腦不會
      onFullscreen();
      setTimeout(() => {
        if (onPlayPause) {
          onPlayPause();
        } else {
          video.play().catch(console.error);
        }
        
        // 新增：播放後觸發 2 秒自動隱藏
        setTimeout(() => {
          if (typeof window !== 'undefined' && window.showVideoControlsForced) {
            window.showVideoControlsForced();
          }
        }, 100); // 延遲 100ms 確保播放狀態已更新
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
      
      // 新增：無論播放還是暫停都觸發控制項顯示邏輯
      setTimeout(() => {
        if (typeof window !== 'undefined' && window.showVideoControlsForced) {
          window.showVideoControlsForced();
        }
      }, 100); // 延遲 100ms 確保播放狀態已更新
    }
  };

  const handleFastBackward = () => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = Math.min(video.currentTime - 5, video.duration);
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

  const handleExitFullscreen = () => {
    if (onFullscreen) {
      onFullscreen();
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

  const shouldShowControls = showControls || isTemporaryShow;

  if (!isMobile || isFullscreen) {
    // 全螢幕模式：中央播放控制 + 底部工具列
    return (
      <>
        {/* 中央的播放/暫停和退出全螢幕按鈕 */}
        <div className={`video-controls-center ${shouldShowControls ? 'controls-visible' : 'controls-hidden'}`}>
          <div className="center-controls">
            <button 
              className="control-button-center play-pause-button"
              onClick={handlePlayPause}
              title={isPlaying ? '暫停' : '播放'}
            >
              {isPlaying ? <Pause size={20} /> : <Play size={18} />}
            </button>

            {/* 修改：只有在影片暫停時才顯示退出全螢幕按鈕 */}
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

        {/* 底部工具列：其他控制功能 */}
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
                  {/* 🆕 手機版提示雙指縮放 */}
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
    // 非全螢幕模式：只顯示基本控制按鈕
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