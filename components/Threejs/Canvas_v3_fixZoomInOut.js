"use client";

import React, { useEffect, useRef, Suspense, useState, useCallback, useImperativeHandle } from 'react';
import Hls from 'hls.js';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import '@/styles/App.css';
// import VideoControls from './VideoControls';
import VideoControls from './VideoControls_v3_fixZoomInOut';
import { calculateYawVideo1, calculateYawVideo2 } from '@/utils/360-video/sphericalCalculations';
import Alert from '@/components/Alert';
import CanvasResizer from './CanvasResizer';

import s from "@/components/Videos/[name]/Content.module.scss";

// 🔥 全域全螢幕管理器
if (typeof window !== 'undefined' && !window.fullscreenManager) {
  window.fullscreenManager = {
    currentFullscreenInstance: null,
    instances: new Map(),
    
    setFullscreen: function(instanceId, isFullscreen) {
      // console.log(`[FullscreenManager] Setting ${instanceId} fullscreen: ${isFullscreen}`);
      
      if (isFullscreen) {
        this.currentFullscreenInstance = instanceId;
        
        this.instances.forEach((instance, id) => {
          if (id !== instanceId && instance.hideControls) {
            // console.log(`[FullscreenManager] Hiding controls for ${id}`);
            instance.hideControls();
          }
        });
        
        const currentInstance = this.instances.get(instanceId);
        if (currentInstance && currentInstance.showControls) {
          // console.log(`[FullscreenManager] Showing controls for ${instanceId}`);
          currentInstance.showControls();
        }
      } else {
        if (this.currentFullscreenInstance === instanceId) {
          this.currentFullscreenInstance = null;
          
          this.instances.forEach((instance, id) => {
            if (instance.restoreControls) {
              // console.log(`[FullscreenManager] Restoring controls for ${id}`);
              instance.restoreControls();
            }
          });
        }
      }
    },
    
    registerInstance: function(instanceId, controlMethods) {
      // console.log(`[FullscreenManager] Registering instance: ${instanceId}`);
      this.instances.set(instanceId, controlMethods);
    },
    
    unregisterInstance: function(instanceId) {
      // console.log(`[FullscreenManager] Unregistering instance: ${instanceId}`);
      this.instances.delete(instanceId);
      if (this.currentFullscreenInstance === instanceId) {
        this.currentFullscreenInstance = null;
      }
    }
  };
}

function Video360({ videoRef, sphereRef }) {
    useEffect(() => {
      if (videoRef.current) {
        const videoTexture = new THREE.VideoTexture(videoRef.current);
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.magFilter = THREE.LinearFilter;
        videoTexture.format = THREE.RGBAFormat;
        // videoTexture.encoding = THREE.sRGBEncoding;
        videoTexture.colorSpace = 'srgb';
        
        if (sphereRef.current) {
          sphereRef.current.material.map = videoTexture;
          // sphereRef.current.material.encoding = THREE.sRGBEncoding;
          sphereRef.current.material.needsUpdate = true;
        }
      }
    }, [videoRef, sphereRef]);
  
    return (
      <mesh ref={sphereRef} scale={[-1, 1, 1]}>
        <sphereGeometry args={[5, 60, 40]} />
        <meshBasicMaterial side={THREE.BackSide} />
      </mesh>
    );
}

function ThreejsCanvasComponent({ 
  uniqueId = `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  isFullscreen = true, 
  containerClassName = "",
  containerStyle = {},
  videoList = null, 
  videoSources = [],
  initialVideoIndex = 0,
  initialCameraIndex = 0,
  initialYaw = 90,
  showControls = true,
  showSwitcher = true,
  autoPlay = false,
  pauseOthersOnPlay = true,
  onFullscreenChange = null,
  videoTitle = null,
  showTitle = true,
  isWaitingForOnline,
  needsToPay,
  setIsModalOpen,
  setHasPaidButNotOnlineYetModalOpen
}, ref) {
    const instanceId = useRef(uniqueId);
    
    const videoRef = useRef(null);
    const cameraRef = useRef(null);
    const controlsRef = useRef(null);
    const hlsRef = useRef(null);
    const sphereRef = useRef(null); // 🔥 新增 sphereRef 用於 iOS VideoTexture 修復
    const canvasRef = useRef(null); // 🔥 新增 canvasRef 用於強制重新渲染
    
    const isListMode = videoList !== null;
    
    const [currentVideoIndex, setCurrentVideoIndex] = useState(initialVideoIndex);
    const [currentCameraIndex, setCurrentCameraIndex] = useState(initialCameraIndex);
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isUIVisible, setIsUIVisible] = useState(true);
    const [localFullscreen, setLocalFullscreen] = useState(isFullscreen);
    const hideUITimeout = useRef(null);
    const containerRef = useRef(null);
    const [alertState, setAlertState] = useState({
      visible: false,
      message: ''
    });
    const alertTimeoutRef = useRef(null);
    const [cameraReady, setCameraReady] = useState(false);
    const [pendingAngles, setPendingAngles] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [isIOS, setIsIOS] = useState(false); // 🔥 新增 iOS 檢測
    const [isPinchZooming, setIsPinchZooming] = useState(false); // 是否正在進行兩指縮放
    const [autoplayBlocked, setAutoplayBlocked] = useState(false); // 🔥 新增自動播放被阻擋狀態
    const [userInteracted, setUserInteracted] = useState(false); // 🔥 新增使用者互動狀態

    useEffect(() => {
      const checkDevice = () => {
        const userAgent = navigator.userAgent.toLowerCase();
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        const minScreenSize = Math.min(screenWidth, screenHeight);
        const maxScreenSize = Math.max(screenWidth, screenHeight);
        const aspectRatio = maxScreenSize / minScreenSize;
        
        const isMobileByUA = /android.*mobile|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        const isMobileBySize = minScreenSize < 768;
        const isMobileByViewport = window.matchMedia('(max-width: 767px)').matches;
        const isMobileByAspectRatio = aspectRatio > 1.5;
        const isMobileByTouch = 'ontouchstart' in window && navigator.maxTouchPoints > 1;
        
        const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent) ||
                        (minScreenSize >= 768 && minScreenSize < 1024);
        
        const finalIsMobile = !isTablet && (
          isMobileByUA || 
          (isMobileBySize && isMobileByAspectRatio) ||
          (isMobileByViewport && isMobileByTouch)
        );
        
        // 🔥 檢測 iOS 設備
        const isIOSDevice = /iphone|ipad|ipod/i.test(userAgent);
        
        setIsMobile(finalIsMobile);
        setIsIOS(isIOSDevice);
      };
      
      checkDevice();
      window.addEventListener('resize', checkDevice);
      window.addEventListener('orientationchange', checkDevice);
      
      return () => {
        window.removeEventListener('resize', checkDevice);
        window.removeEventListener('orientationchange', checkDevice);
      };
    }, []);

    useEffect(() => {
      const handleKeyDown = (event) => {
        if (event.key === 'Escape' && !isMobile && localFullscreen) {
          // console.log(`[${instanceId.current}] ESC key pressed, exiting fullscreen`);
          handleFullscreen();
        }
      };

      if (!isMobile) {
        document.addEventListener('keydown', handleKeyDown);
      }

      return () => {
        if (!isMobile) {
          document.removeEventListener('keydown', handleKeyDown);
        }
      };
    }, [isMobile, localFullscreen]);

    const getCurrentVideoSources = useCallback(() => {
      if (isListMode) {
        return videoList[currentVideoIndex] || [];
      } else {
        return videoSources || [];
      }
    }, [isListMode, videoList, currentVideoIndex, videoSources]);

    const pauseOtherInstances = useCallback(() => {
      if (pauseOthersOnPlay && typeof window !== 'undefined' && window.videoInstances) {
        window.videoInstances.forEach((instance, id) => {
          if (id !== instanceId.current) {
            instance.pause();
          }
        });
      }
    }, [pauseOthersOnPlay]);
    
    // 🔥 修改 handleFullscreen 函數
    const handleFullscreen = useCallback(() => {
      const newFullscreenState = !localFullscreen;
      setLocalFullscreen(newFullscreenState);
      
      if (newFullscreenState) {
        pauseOtherInstances();
      }
      
      // 🔥 通知全域管理器
      if (typeof window !== 'undefined' && window.fullscreenManager) {
        window.fullscreenManager.setFullscreen(instanceId.current, newFullscreenState);
      }
      
      if (onFullscreenChange) {
        // console.log("Canvas handleFullscreen. newFullscreenState: ", newFullscreenState ? "true" : "false");
        onFullscreenChange(newFullscreenState);
      }
    }, [localFullscreen, onFullscreenChange, pauseOtherInstances]);

    // 🔥 在組件掛載時註冊到全域管理器
    useEffect(() => {
      if (typeof window !== 'undefined' && window.fullscreenManager) {
        const controlMethods = {
          showControls: () => {
            const instanceFunctionName = `showVideoControlsForced_${instanceId.current}`;
            if (window[instanceFunctionName]) {
              window[instanceFunctionName](true);
            }
          },
          hideControls: () => {
            const instanceFunctionName = `hideVideoControls_${instanceId.current}`;
            if (window[instanceFunctionName]) {
              window[instanceFunctionName]();
            }
          },
          restoreControls: () => {
            const instanceFunctionName = `restoreVideoControls_${instanceId.current}`;
            if (window[instanceFunctionName]) {
              window[instanceFunctionName]();
            }
          }
        };
        
        window.fullscreenManager.registerInstance(instanceId.current, controlMethods);
        
        return () => {
          window.fullscreenManager.unregisterInstance(instanceId.current);
        };
      }
    }, []);

    const getWrapperStyle = () => {
      if (localFullscreen) {
        return {};
      }
      
      return {
        marginTop: showTitle && videoTitle && !localFullscreen ? '120px' : '0px',
      };
    };

    const getContainerStyle = () => {
      if (localFullscreen) {
        return {
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9000,
          backgroundColor: '#000'
        };
      }
      
      const baseStyle = {
        width: '100%',
        height: 'auto',
        position: 'relative',
        overflow: 'hidden',
        ...containerStyle
      };

      return baseStyle;
    };

    const getCanvasContainerClass = () => {
      return localFullscreen 
        ? "canvas-container" 
        : "canvas-container-embedded";
    };

    const getCanvasContainerStyle = () => {
      if (localFullscreen) {
        return {
          width: '100%',
          height: '100%',
          position: 'relative'
        };
      }
    };

    useEffect(() => {
      if (typeof window !== 'undefined') {
        if (!window.videoInstances) {
          window.videoInstances = new Map();
        }
        
        const instanceData = {
          videoRef,
          pause: () => {
            if (videoRef.current && !videoRef.current.paused) {
              videoRef.current.pause();
              setIsPlaying(false);
            }
          },
          play: () => {
            if (videoRef.current && videoRef.current.paused) {
              return videoRef.current.play().then(() => setIsPlaying(true));
            }
          }
        };
        
        window.videoInstances.set(instanceId.current, instanceData);
        
        return () => {
          if (window.videoInstances) {
            window.videoInstances.delete(instanceId.current);
          }
        };
      }
    }, []);

    const cleanupHls = useCallback(() => {
      if (hlsRef.current) {
        try {
          // 🔥 正確清理 HLS 對象：先 detachMedia 再 destroy
          hlsRef.current.detachMedia();
          hlsRef.current.destroy();
          hlsRef.current = null;
        } catch (error) {
          console.warn(`[${instanceId.current}] HLS cleanup error:`, error);
        }
      }
    }, []);
  
    const saveCurrentState = useCallback(() => {
      const video = videoRef.current;
      if (!video) return null;
  
      return {
        currentTime: video.currentTime,
        isPlaying: !video.paused,
        fov: cameraRef.current?.fov || 90,
        angles: controlsRef.current ? {
          yaw: 90
        } : null
      };
    }, []);
  
    const calculateNewAngles = useCallback((currentAngles, direction) => {
      if (!currentAngles) return null;
  
      const sphericalProps = {
        yaw: (currentAngles.yaw * (180 / Math.PI) - 90) >= 0 
        ? currentAngles.yaw * (180 / Math.PI) - 90 
        : currentAngles.yaw * (180 / Math.PI) - 90 + 360,
        pitch: currentAngles.pitch * (180 / Math.PI),
        roll: currentAngles.roll * (180 / Math.PI)
      };

      const newYaw = direction === -1 
        ? calculateYawVideo1(sphericalProps)
        : calculateYawVideo2(sphericalProps);

      let newAngles = {
        yaw: ((newYaw + 90) < 360)
        ? (newYaw + 90)  * (Math.PI / 180) 
        : (newYaw + 90 - 360) * (Math.PI / 180),
      }
  
      return newAngles;
    }, []);

    const setCameraAnglesWhenReady = useCallback((yaw = null, pitch = null, roll = null, retryCount = 0) => {
      const MAX_RETRIES = 10;
      const RETRY_DELAY = 100;
      
      if (controlsRef.current && cameraRef.current) {
        try {
          const originalDamping = controlsRef.current.enableDamping;
          controlsRef.current.enableDamping = false;
          
          if (yaw !== null) {
            const yawRadians = yaw * (Math.PI / 180);
            controlsRef.current.setAzimuthalAngle(yawRadians);
          }
    
          controlsRef.current.update();
          cameraRef.current.updateProjectionMatrix();
          
          controlsRef.current.enableDamping = originalDamping;
          
          setCameraReady(true);
          setPendingAngles(null);
          
          return true;
          
        } catch (error) {
          console.error(`[${instanceId.current}] Error setting camera angles:`, error);
          return false;
        }
      } else {
        if (retryCount < MAX_RETRIES) {
          setPendingAngles({ yaw, pitch, roll });
          setTimeout(() => {
            setCameraAnglesWhenReady(yaw, pitch, roll, retryCount + 1);
          }, RETRY_DELAY);
        } else {
          console.error(`[${instanceId.current}] ❌ Failed to set camera angles after ${MAX_RETRIES} retries`);
        }
        return false;
      }
    }, []);
    

    useEffect(() => {
      if (cameraReady && pendingAngles) {
        const { yaw, pitch, roll } = pendingAngles;
        setCameraAnglesWhenReady(yaw, pitch, roll);
      }
    }, [cameraReady, pendingAngles, setCameraAnglesWhenReady]);

    // 🔥 將 showAlert 函數移到 loadVideo 之前
    const showAlert = useCallback((message) => {
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }

      setAlertState({
        visible: true,
        message: message
      });

      alertTimeoutRef.current = setTimeout(() => {
        setAlertState(prev => ({
          ...prev,
          visible: false
        }));
      }, 3000);
    }, []);
  
    const loadVideo = useCallback((videoIndex, cameraIndex, previousState = null, direction = null, customAngles = null, shouldPlay = null) => {
      const video = videoRef.current;
      if (!video || !Hls.isSupported()) return;

      let videoUrl = '';
      
      if (isListMode) {
        if (!videoList[videoIndex] || !videoList[videoIndex][cameraIndex]) {
          console.error(`[${instanceId.current}] Invalid video/camera index:`, videoIndex, cameraIndex);
          return;
        }
        videoUrl = videoList[videoIndex][cameraIndex];
      } else {
        if (videoSources[cameraIndex] === "") {
          if (needsToPay) {
            setIsModalOpen(true);
          } else if (isWaitingForOnline) {
            setHasPaidButNotOnlineYetModalOpen(true);
          }
          return;
        } else if (!videoSources[cameraIndex]) {
          console.error(`[${instanceId.current}] Invalid camera index:`, cameraIndex);
          return;
        }
        videoUrl = videoSources[cameraIndex];
      }

      // 🔥 開始載入動畫
      setIsLoading(true);
      setAutoplayBlocked(false); // 🔥 重置自動播放阻擋狀態
      cleanupHls();

      const state = previousState || saveCurrentState() || {
        currentTime: 0,
        isPlaying: shouldPlay !== null ? shouldPlay : (autoPlay && userInteracted), // 🔥 支援強制播放控制
        fov: 90,
        angles: {
          yaw: 90
        }
      };

      if (direction !== null && state.angles) {
        state.angles = calculateNewAngles(state.angles, direction);
      }

      const hls = new Hls({
        startPosition: state.currentTime, // 🔥 加上這個
        lowLatencyMode: false,
        enableWorker: true
      });
      
      hlsRef.current = hls;
      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      // ✅ 改成在 MEDIA_ATTACHED 後觸發 startLoad
      hls.on(Hls.Events.MEDIA_ATTACHED, () => {
        hls.startLoad(state.currentTime);
      });

      // 🔥 新增 canplay 事件處理
      const handleCanPlay = () => {
        // 🔥 確保在 canplay 事件觸發後才設定 currentTime
        if (state.currentTime > 0) {
          video.currentTime = state.currentTime;
        }
        
        // 🔥 移除事件監聽器，避免重複觸發
        video.removeEventListener('canplay', handleCanPlay);
        
        // 🔥 設定相機角度
        setTimeout(() => {
          let targetYaw = null;

          if (customAngles) {
            targetYaw = customAngles.yaw;
          }
          else if (!previousState && (initialYaw !== null)) {
            targetYaw = initialYaw;
          }
          else if (state.angles) {
            targetYaw = state.angles.yaw * (180 / Math.PI);
          }

          if (targetYaw !== null) {
            setCameraAnglesWhenReady(targetYaw);
          }
        }, 100);

        // 🔥 嘗試播放
        if (state.isPlaying) {
          if (pauseOthersOnPlay) {
            pauseOtherInstances();
          }
          
          video.play()
            .then(() => {
              setIsPlaying(true);
              setIsLoading(false);
            })
            .catch(error => {
              console.error(`[${instanceId.current}] Autoplay blocked:`, error);
              setIsPlaying(false);
              setIsLoading(false);
              setAutoplayBlocked(true); // 🔥 設定自動播放被阻擋狀態
              
              // 🔥 顯示自動播放被阻擋的提示
              showAlert('需點擊畫面才能播放影片');
            });
        } else {
          setIsPlaying(false);
          setIsLoading(false);
        }
      };

      // 🔥 監聽 canplay 事件
      video.addEventListener('canplay', handleCanPlay);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (isListMode) {
          // console.log(`[${instanceId.current}] Video loaded - Video: ${videoIndex + 1}, Camera: ${cameraIndex + 1}, URL: ${videoUrl}`);
        } else {
          // console.log(`[${instanceId.current}] Video loaded - Camera: ${cameraIndex + 1}, URL: ${videoUrl}`);
        }
        
        // 🔥 如果影片已經可以播放，直接觸發 canplay 處理
        if (video.readyState >= 3) {
          handleCanPlay();
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error(`[${instanceId.current}] HLS Error:`, data);
        setIsLoading(false);
        
        // 🔥 移除 canplay 事件監聽器
        video.removeEventListener('canplay', handleCanPlay);
        
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.log(`[${instanceId.current}] Trying to recover from network error`);
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.log(`[${instanceId.current}] Trying to recover from media error`);
              hls.recoverMediaError();
              break;
            default:
              console.error(`[${instanceId.current}] Fatal error, cannot recover`);
              cleanupHls();
              break;
          }
        }
      });
    }, [isListMode, videoList, videoSources, autoPlay, userInteracted, pauseOthersOnPlay, pauseOtherInstances, cleanupHls, saveCurrentState, calculateNewAngles, showAlert]);
  
    const handleCameraSwitch = useCallback((direction) => {
      const currentSources = getCurrentVideoSources();
      let newCameraIndex = currentCameraIndex + direction;
      
      if (newCameraIndex < 0) {
        newCameraIndex = currentSources.length - 1;
      } else if (newCameraIndex >= currentSources.length) {
        newCameraIndex = 0;
      }

      if (videoSources[newCameraIndex] === "") {
        if (needsToPay) {
          setIsModalOpen(true);
        } else if (isWaitingForOnline) {
          setHasPaidButNotOnlineYetModalOpen(true);
        }
        return;
      }

      const previousState = saveCurrentState();
      setCurrentCameraIndex(newCameraIndex);
      loadVideo(currentVideoIndex, newCameraIndex, previousState, direction, null, true); // 🔥 切換視角時應該播放
    }, [currentVideoIndex, currentCameraIndex, saveCurrentState, loadVideo, getCurrentVideoSources]);

    const handleVideoSwitch = useCallback((direction) => {
      if (!isListMode) {
        console.warn(`[${instanceId.current}] Video switch not available in single video mode`);
        return;
      }
      
      let newVideoIndex = currentVideoIndex + direction;
      
      if (newVideoIndex < 0) {
        newVideoIndex = videoList.length - 1;
      } else if (newVideoIndex >= videoList.length) {
        newVideoIndex = 0;
      }

      const previousState = saveCurrentState();
      setCurrentVideoIndex(newVideoIndex);
      setCurrentCameraIndex(0);
      loadVideo(newVideoIndex, 0, previousState, null, null, true); // 🔥 切換影片時應該播放
    }, [isListMode, currentVideoIndex, videoList, saveCurrentState, loadVideo]);
  
    useEffect(() => {
      // 🔥 iOS 裝置預設不自動播放，需要使用者互動
      if (isIOS && autoPlay) {
        // 只載入影片但不播放
        loadVideo(initialVideoIndex, initialCameraIndex, null, null, null, false);
      } else {
        loadVideo(initialVideoIndex, initialCameraIndex);
      }
    }, [initialVideoIndex, initialCameraIndex, loadVideo, isIOS, autoPlay]);
  
    const handlePlayPause = useCallback(() => {
      const video = videoRef.current;
      if (!video) return;

      // 🔥 標記使用者已互動
      setUserInteracted(true);
      setAutoplayBlocked(false);

      if (video.paused) {
        pauseOtherInstances();
        
        video.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(error => {
            console.error(`[${instanceId.current}] Play error:`, error);
            showAlert('播放失敗，請重試');
          });
      } else {
        video.pause();
        setIsPlaying(false);
      }
    }, [pauseOtherInstances, showAlert]);
  
    const showUI = useCallback(() => {
      setIsUIVisible(true);
      if (hideUITimeout.current) {
        clearTimeout(hideUITimeout.current);
      }
      hideUITimeout.current = setTimeout(() => {
        setIsUIVisible(false);
      }, 2000);
    }, []);

    useEffect(() => {
        const checkCameraReady = () => {
          if (controlsRef.current && cameraRef.current) {
            setCameraReady(true);
            return true;
          }
          return false;
        };
  
        if (!checkCameraReady()) {
          const interval = setInterval(() => {
            if (checkCameraReady()) {
              clearInterval(interval);
            }
          }, 100);
  
          return () => clearInterval(interval);
        }
      }, []);
    
      const handleMouseMove = useCallback((e) => {
        const userAgent = navigator.userAgent.toLowerCase();
        const isTabletOrDesktop = !(/android.*mobile|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) ||
                                 /ipad|android(?!.*mobile)|tablet/i.test(userAgent) ||
                                 window.matchMedia('(min-width: 768px)').matches;
        
        if (isTabletOrDesktop) {
          showUI();
        }
      }, [showUI]);
    
      const handleTouch = useCallback((e) => {
        const userAgent = navigator.userAgent.toLowerCase();
        const screenWidth = window.screen.width;
        const screenHeight = window.screen.height;
        const minScreenSize = Math.min(screenWidth, screenHeight);
        const maxScreenSize = Math.max(screenWidth, screenHeight);
        const aspectRatio = maxScreenSize / minScreenSize;
        
        const isMobileByUA = /android.*mobile|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
        const isMobileBySize = minScreenSize < 768;
        const isMobileByViewport = window.matchMedia('(max-width: 767px)').matches;
        const isMobileByAspectRatio = aspectRatio > 1.5;
        const isMobileByTouch = 'ontouchstart' in window && navigator.maxTouchPoints > 1;
        
        const isTablet = /ipad|android(?!.*mobile)|tablet/i.test(userAgent) ||
                        (minScreenSize >= 768 && minScreenSize < 1024);
        
        const isMobile = !isTablet && (
          isMobileByUA || 
          (isMobileBySize && isMobileByAspectRatio) ||
          (isMobileByViewport && isMobileByTouch)
        );
        
        if (isMobile) {
          e.preventDefault();
          showUI();
        }
      }, [showUI]);
    
      const handleDisabledClick = useCallback((direction) => {
        if (isLoading) {
          showAlert('影片載入中，請稍候...');
        } else {
          const currentSources = getCurrentVideoSources();
          if (currentSources.length <= 1) {
            showAlert('此影片只有一個攝影機角度');
          } else {
            showAlert(direction === -1 ? '已經是第一個攝影機角度' : '已經是最後一個攝影機角度');
          }
        }
      }, [isLoading, showAlert, getCurrentVideoSources]);
  
      useEffect(() => {
        const handleVisibilityChange = () => {
          if (document.hidden) {
            // 🔥 iOS 頁面隱藏時暫停影片
            if (videoRef.current && !videoRef.current.paused) {
              videoRef.current.pause();
              setIsPlaying(false);
            }
          } else {
            // 🔥 iOS 頁面重新可見時，模擬切換視角的修復方法
            if (videoRef.current && isIOS) {
              // 延遲一點時間確保頁面完全恢復
              setTimeout(() => {
                if (videoRef.current && sphereRef.current) {
                  try {
                    // 先暫停影片
                    const wasPlaying = !videoRef.current.paused;
                    const currentTime = videoRef.current.currentTime;
                    
                    if (wasPlaying) {
                      videoRef.current.pause();
                    }
                    
                    // 🔥 基於您的發現：模擬切換視角來修復畫面
                    // 先隱藏球體
                    sphereRef.current.visible = false;
                    
                    setTimeout(() => {
                      if (sphereRef.current) {
                        // 重新創建 VideoTexture
                        const videoTexture = new THREE.VideoTexture(videoRef.current);
                        videoTexture.minFilter = THREE.LinearFilter;
                        videoTexture.magFilter = THREE.LinearFilter;
                        videoTexture.format = THREE.RGBAFormat;
                        // videoTexture.encoding = THREE.sRGBEncoding;
                        videoTexture.colorSpace = 'srgb';
                        
                        // 更新材質
                        sphereRef.current.material.map = videoTexture;
                        // sphereRef.current.material.encoding = THREE.sRGBEncoding;
                        sphereRef.current.material.needsUpdate = true;
                        
                        // 強制重新渲染
                        if (sphereRef.current.parent) {
                          sphereRef.current.parent.updateMatrixWorld(true);
                        }
                        
                        // 強制更新 VideoTexture
                        videoTexture.needsUpdate = true;
                        
                        // 重新顯示球體（模擬切換視角的效果）
                        sphereRef.current.visible = true;
                        
                        // 如果之前在播放，重新開始播放
                        if (wasPlaying) {
                          setTimeout(() => {
                            if (videoRef.current) {
                              // 確保時間位置正確
                              videoRef.current.currentTime = currentTime;
                              videoRef.current.play().catch(error => {
                                console.warn(`[${instanceId.current}] Failed to resume playback:`, error);
                              });
                            }
                          }, 200);
                        }
                        
                        console.log(`[${instanceId.current}] VideoTexture fixed by visibility toggle for iOS`);
                      }
                    }, 100);
                    
                    // 🔥 備用方案：如果隱藏/顯示不夠，真的切換視角
                    setTimeout(() => {
                      if (videoRef.current && isIOS && localFullscreen) {
                        // 檢查是否還有問題，如果有就真的切換視角
                        const currentSources = getCurrentVideoSources();
                        if (currentSources.length > 1) {
                          // 保存當前狀態
                          const currentCameraIndex = currentCameraIndex;
                          const currentVideoIndex = currentVideoIndex;
                          
                          // 切換到下一個視角
                          const nextCameraIndex = (currentCameraIndex + 1) % currentSources.length;
                          
                          // 執行切換
                          setCurrentCameraIndex(nextCameraIndex);
                          loadVideo(currentVideoIndex, nextCameraIndex, {
                            currentTime: currentTime,
                            isPlaying: wasPlaying,
                            fov: 90,
                            angles: { yaw: 90 }
                          });
                          
                          // 延遲切換回來
                          setTimeout(() => {
                            setCurrentCameraIndex(currentCameraIndex);
                            loadVideo(currentVideoIndex, currentCameraIndex, {
                              currentTime: currentTime,
                              isPlaying: wasPlaying,
                              fov: 90,
                              angles: { yaw: 90 }
                            });
                          }, 500);
                          
                          console.log(`[${instanceId.current}] Real camera switch recovery for iOS fullscreen`);
                        }
                      }
                    }, 2000); // 2秒後檢查是否需要真的切換視角
                    
                  } catch (error) {
                    console.warn(`[${instanceId.current}] Failed to fix VideoTexture:`, error);
                  }
                }
              }, 500);
            }
          }
        };
  
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
      }, [isIOS]);
  
      useEffect(() => {
        return () => {
          cleanupHls();
          
          if (hideUITimeout.current) {
            clearTimeout(hideUITimeout.current);
          }
          if (alertTimeoutRef.current) {
            clearTimeout(alertTimeoutRef.current);
          }
          
          if (typeof window !== 'undefined' && window.videoInstances) {
            window.videoInstances.delete(instanceId.current);
          }
        };
      }, [cleanupHls]);
  
      const setViewAngles = useCallback((yaw = null, pitch = null, roll = null) => {
        setCameraAnglesWhenReady(yaw, pitch, roll);
      }, [setCameraAnglesWhenReady]);
  
      useImperativeHandle(ref, () => ({
        setViewAngles,
        setCameraAngles: setCameraAnglesWhenReady,
        getCurrentAngles: () => {
          if (controlsRef.current && cameraRef.current) {
            return {
              yaw: controlsRef.current.getAzimuthalAngle() * (180 / Math.PI),
              pitch: controlsRef.current.getPolarAngle() * (180 / Math.PI),
              roll: cameraRef.current.rotation.z * (180 / Math.PI)
            };
          }
          return null;
        }
      }), [setCameraAnglesWhenReady]);
  
      // 🔥 修改 Canvas 互動處理，使用實例特定函數
      const handleCanvasInteraction = useCallback((e) => {
        // 🔥 標記使用者已互動
        setUserInteracted(true);
        
        // 檢查並強制恢復狀態（如果需要）
        if (isPinchZooming && e.touches && e.touches.length <= 1) {
          // console.log(`[${instanceId.current}] Single touch detected while pinching - forcing restore`);
          const pinchManagerKey = `pinchManager_${instanceId.current}`;
          if (window[pinchManagerKey] && window[pinchManagerKey].forceRestore) {
            window[pinchManagerKey].forceRestore();
          }
          return;
        }
        
        // 如果正在進行縮放，不處理其他交互
        if (isPinchZooming) {
          // console.log(`[${instanceId.current}] Ignoring interaction - still pinching`);
          return;
        }
        
        const target = e.target;
        const isControlButton = target.closest('.control-button-center') || 
                               target.closest('.video-controls-center') ||
                               target.closest('.video-controls-fullscreen');
        
        if (isControlButton) {
          const instanceFunctionName = `showVideoControlsForced_${instanceId.current}`;
          if (typeof window !== 'undefined' && window[instanceFunctionName]) {
            window[instanceFunctionName]();
          } else if (typeof window !== 'undefined' && window.showVideoControlsForced) {
            window.showVideoControlsForced();
          }
          return;
        }
        
        const isCanvasArea = target.tagName === 'CANVAS' || 
                            target.closest('.canvas-container') ||
                            target.closest('.canvas-container-embedded');
        
        if (isCanvasArea) {
          // 檢查是否為多點觸控
          const touchCount = e.touches ? e.touches.length : 0;
          if (touchCount >= 2) {
            // console.log(`[${instanceId.current}] Multi-touch detected - ignoring click logic`);
            return;
          }
          
          // console.log(`[${instanceId.current}] Processing single touch interaction`);
          
          const startX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
          const startY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
          const startTime = Date.now();
          const wasPlaying = isPlaying;
          let hasMovedSignificantly = false;
          let hasTriggeredQuickClick = false;
          let quickClickTimer = null;
          
          const handleMove = (moveEvent) => {
            // 如果變成多點觸控，取消所有操作
            if (moveEvent.touches && moveEvent.touches.length >= 2) {
              // console.log(`[${instanceId.current}] Multi-touch during move - cancelling`);
              if (quickClickTimer) {
                clearTimeout(quickClickTimer);
                quickClickTimer = null;
              }
              return;
            }
            
            const currentX = moveEvent.clientX || (moveEvent.touches && moveEvent.touches[0]?.clientX) || startX;
            const currentY = moveEvent.clientY || (moveEvent.touches && moveEvent.touches[0]?.clientY) || startY;
            
            const moveDistance = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2));
            
            if (moveDistance > 10 && !hasMovedSignificantly) {
              hasMovedSignificantly = true;
              
              if (quickClickTimer) {
                clearTimeout(quickClickTimer);
                quickClickTimer = null;
              }
            }
          };
          
          const handleEnd = (e) => {
            // 檢查結束時的觸控狀態
            if (e.touches && e.touches.length >= 2) {
              // console.log(`[${instanceId.current}] Multi-touch at end - ignoring`);
              return;
            }
            
            const endX = e.clientX || (e.changedTouches && e.changedTouches[0]?.clientX) || startX;
            const endY = e.clientY || (e.changedTouches && e.changedTouches[0]?.clientY) || startY;
            const endTime = Date.now();
            
            const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            const duration = endTime - startTime;
            
            if (quickClickTimer) {
              clearTimeout(quickClickTimer);
              quickClickTimer = null;
            }
            
            // console.log(`[${instanceId.current}] Touch end - distance: ${distance}, duration: ${duration}`);
            
            if (!hasTriggeredQuickClick) {
              const instanceFunctionName = `showVideoControls_${instanceId.current}`;
              if (typeof window !== 'undefined' && window[instanceFunctionName]) {
                // console.log(`[${instanceId.current}] Calling showVideoControls`);
                window[instanceFunctionName](true, true);
              } else if (typeof window !== 'undefined' && window.showVideoControls) {
                // console.log(`[${instanceId.current}] Calling global showVideoControls`);
                window.showVideoControls(true, true);
              }
            }
            
            if (!wasPlaying && !hasTriggeredQuickClick && !hasMovedSignificantly && distance < 15 && duration < 300) {
              const instanceFunctionName = `showVideoControls_${instanceId.current}`;
              if (typeof window !== 'undefined' && window[instanceFunctionName]) {
                // console.log(`[${instanceId.current}] Quick click detected`);
                window[instanceFunctionName](true);
              } else if (typeof window !== 'undefined' && window.showVideoControls) {
                window.showVideoControls(true);
              }
            }
            
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('mouseup', handleEnd);
            document.removeEventListener('touchend', handleEnd);
          };
          
          if (!wasPlaying) {
            quickClickTimer = setTimeout(() => {
              if (!hasMovedSignificantly && !hasTriggeredQuickClick) {
                hasTriggeredQuickClick = true;
                const instanceFunctionName = `showVideoControls_${instanceId.current}`;
                if (typeof window !== 'undefined' && window[instanceFunctionName]) {
                  // console.log(`[${instanceId.current}] Quick timer triggered`);
                  window[instanceFunctionName]();
                } else if (typeof window !== 'undefined' && window.showVideoControls) {
                  window.showVideoControls();
                }
              }
              quickClickTimer = null;
            }, 150);
          }
          
          document.addEventListener('mousemove', handleMove);
          document.addEventListener('touchmove', handleMove);
          document.addEventListener('mouseup', handleEnd);
          document.addEventListener('touchend', handleEnd);
        }
      }, [isPlaying, instanceId, isPinchZooming]);

      // 縮放狀態管理
      useEffect(() => {
        if (typeof window !== 'undefined') {
          const pinchManagerKey = `pinchManager_${instanceId.current}`;
          
          window[pinchManagerKey] = {
            setIsPinching: (isPinching) => {
              // console.log(`[${instanceId.current}] setPinching:`, isPinching);
              setIsPinchZooming(isPinching);
              
              if (controlsRef.current) {
                if (isPinching) {
                  // 縮放開始：禁用 OrbitControls
                  controlsRef.current.enabled = false;
                  // console.log(`[${instanceId.current}] OrbitControls disabled`);
                } else {
                  // 縮放結束：延遲重新啟用 OrbitControls
                  setTimeout(() => {
                    if (controlsRef.current) {
                      controlsRef.current.enabled = true;
                      // 強制更新 OrbitControls 狀態
                      controlsRef.current.update();
                      // console.log(`[${instanceId.current}] OrbitControls re-enabled`);
                    }
                  }, 150); // 增加延遲時間
                }
              }
            },
            
            // 新增：強制恢復函數
            forceRestore: () => {
              // console.log(`[${instanceId.current}] Force restoring controls`);
              setIsPinchZooming(false);
              if (controlsRef.current) {
                controlsRef.current.enabled = true;
                controlsRef.current.update();
              }
            }
          };
          
          return () => {
            delete window[pinchManagerKey];
          };
        }
      }, []);

      useEffect(() => {
        if (controlsRef.current) {
          // 當開始縮放時完全禁用 OrbitControls
          controlsRef.current.enabled = !isPinchZooming;
        }
      }, [isPinchZooming]);

      // 新增一個安全檢查 useEffect，定期確保狀態正確
      useEffect(() => {
        const intervalId = setInterval(() => {
          // 如果長時間處於 pinch 狀態但沒有實際觸控，強制恢復
          if (isPinchZooming) {
            const videoElement = document.querySelector(`[data-video-instance="${instanceId.current}"]`);
            if (videoElement) {
              // 檢查是否真的有觸控點
              const hasActiveTouches = document.elementFromPoint && 
                                      document.elementsFromPoint && 
                                      videoElement.matches(':active');
              
              if (!hasActiveTouches) {
                // console.log(`[${instanceId.current}] No active touches detected - auto-restoring`);
                const pinchManagerKey = `pinchManager_${instanceId.current}`;
                if (window[pinchManagerKey] && window[pinchManagerKey].forceRestore) {
                  window[pinchManagerKey].forceRestore();
                }
              }
            }
          }
        }, 3000); // 每 3 秒檢查一次
        
        return () => {
          clearInterval(intervalId);
        };
      }, [isPinchZooming, instanceId]);

      // 新增清理 useEffect，確保組件卸載時狀態正確
      useEffect(() => {
        return () => {
          // 確保組件卸載時恢復所有狀態
          if (controlsRef.current) {
            controlsRef.current.enabled = true;
          }
          setIsPinchZooming(false);
        };
      }, []);
 
      useEffect(() => {
        const navbar = document.querySelector('nav');
        const body = document.querySelector('body');
        const footer = document.querySelector('footer');
        
        if (navbar) {
          if (localFullscreen) {
            navbar.classList.add('z-[9000]');
            navbar.classList.remove('z-[9999]');
          } else {
            navbar.classList.add('z-[9999]');
            navbar.classList.remove('z-[9000]');
          }
        }
 
        if (body) {
          if (localFullscreen) {
            body.classList.add('h-screen', 'overflow-hidden');
          } else {
            body.classList.remove('h-screen', 'overflow-hidden');
          }
        }

        if (footer) {
          if (localFullscreen) {
            footer.classList.add('!hidden');
          } else {
            footer.classList.remove('!hidden');
          }
        }
 
      }, [localFullscreen]);
 
      useEffect(() => {
        return () => {
          const navbar = document.querySelector('nav');
          const body = document.querySelector('body');
          const footer = document.querySelector('footer');

          if (navbar) {
            navbar.classList.add('z-[9999]');
            navbar.classList.remove('z-[9000]');
          }
          if (body) {
            body.classList.remove('h-screen', 'overflow-hidden');
          }
          if (footer) {
            footer.classList.remove('!hidden');
          }
        };
      }, []);
    
      return (
        <div 
          style={getWrapperStyle()}
          className={`video-wrapper relative ${containerClassName}`}
        >
        {showTitle && videoTitle && !localFullscreen && (
          <div 
            className={`${s.videoTitle}`}
          >
            {videoTitle}
          </div>
        )}
        
          <div 
            className={`App ${localFullscreen ? 'fullscreen' : 'embedded'}`}
            style={getContainerStyle()}
            ref={containerRef}
            onMouseMove={handleMouseMove}
            data-video-instance={instanceId.current}
            onMouseDown={handleCanvasInteraction}
            onTouchStart={(e) => {
              handleTouch(e);
              handleCanvasInteraction(e);
            }}
          >
            <div className={`video-player ${isUIVisible ? 'ui-visible' : 'ui-hidden'}`}>
              <div className="video-player">
                <video 
                  ref={videoRef}
                  style={{ display: 'none' }}
                  crossOrigin="anonymous"
                  playsInline
                  webkit-playsinline="true"
                />
                <div 
                  className={getCanvasContainerClass()}
                  style={getCanvasContainerStyle()}
                >
                  <Suspense fallback={null}>
                    <Canvas ref={canvasRef}>
                      <CanvasResizer isFullscreen={localFullscreen} />
                      <PerspectiveCamera 
                        ref={cameraRef}
                        makeDefault 
                        position={[0, 0, 0.001]}
                        fov={90}
                        near={0.001}
                        far={100}
                      />
                      <Video360 videoRef={videoRef} sphereRef={sphereRef} />
                      <OrbitControls 
                        ref={controlsRef}
                        enableZoom={false}
                        enablePan={false}
                        enableDamping
                        dampingFactor={0.1}
                        rotateSpeed={-0.5}
                        minPolarAngle={0.1}
                        maxPolarAngle={Math.PI - 0.1}
                        enabled={!isPinchZooming} // 根據縮放狀態動態控制觸控行為
                      />
                    </Canvas>
                  </Suspense>
                  
                  {/* 🔥 載入動畫 */}
                  {isLoading && (
                    <div className="loading-overlay">
                      <div className="loading-spinner">
                        <div className="spinner-ring"></div>
                        <div className="loading-text">載入中...</div>
                      </div>
                    </div>
                  )}
                  
                  {/* 🔥 自動播放被阻擋提示 */}
                  {autoplayBlocked && !isPlaying && (
                    <div className="autoplay-blocked-overlay">
                      <div className="autoplay-blocked-message">
                        <div className="play-icon">▶️</div>
                        <div className="message-text">點擊播放按鈕開始播放</div>
                      </div>
                    </div>
                  )}
                </div>
  
                {showSwitcher && (
                  <div className="video-switcher">
                    <button 
                      className="switch-button left"
                      onClick={() => {
                        if (isLoading) {
                          handleDisabledClick(-1);
                        } else {
                        handleCameraSwitch(-1);
                        }
                      }}
                    >
                      &#8592;
                    </button>
                    <button 
                      className="switch-button right"
                      onClick={() => {
                        if (isLoading) {
                          handleDisabledClick(1);
                        } else {
                        handleCameraSwitch(1);
                        }
                      }}
                    >
                      &#8594;
                    </button>
                  </div>
                )}
  
                {showControls && (
                <div className={`controls-container ${isUIVisible ? 'visible' : 'hidden'}`}>
                  <VideoControls 
                    videoRef={videoRef} 
                    cameraRef={cameraRef}
                    isMobile={isMobile}
                    onPlayPause={handlePlayPause}
                    onFullscreen={!isFullscreen ? handleFullscreen : null}
                    isFullscreen={localFullscreen}
                    cameraReady={cameraReady}
                    uniqueId={instanceId.current}
                  />
                </div>
                )}
                
                <Alert 
                  message={alertState.message} 
                  isVisible={alertState.visible} 
                />
              </div>
            </div>
            {/* <div className={`${localFullscreen ? "" : "hidden"} bg-black text-white/50 p-[8px] absolute bottom-0 left-0 w-full text-center text-[14px]`}>© Effect Player</div> */}
          </div>
          {/* <div className={`${localFullscreen ? "hidden" : ""} md:hidden bg-black text-white/50 p-[8px] absolute bottom-0 left-0 w-full text-center text-[14px] translate-y-full`}>© Effect Player</div> */}
        </div>
      );
  }
  
  const ThreejsCanvas = React.forwardRef(ThreejsCanvasComponent);
  
  export default ThreejsCanvas;