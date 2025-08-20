"use client";

import React, { useEffect, useRef, Suspense, useState, useCallback, useImperativeHandle } from 'react';
import Hls from 'hls.js';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import '@/styles/App.css';
import VideoControls from './VideoControls';
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

function Video360({ videoRef }) {
    const sphereRef = useRef();
    
    useEffect(() => {
      if (videoRef.current) {
        const videoTexture = new THREE.VideoTexture(videoRef.current);
        videoTexture.minFilter = THREE.LinearFilter;
        videoTexture.magFilter = THREE.LinearFilter;
        videoTexture.format = THREE.RGBAFormat;
        videoTexture.encoding = THREE.sRGBEncoding;
        videoTexture.colorSpace = 'srgb';
        
        if (sphereRef.current) {
          sphereRef.current.material.map = videoTexture;
          sphereRef.current.material.encoding = THREE.sRGBEncoding;
          sphereRef.current.material.needsUpdate = true;
        }
      }
    }, [videoRef]);
  
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
  borderStyle = {},
  videoTitle = null,
  showTitle = true,
  titleStyle = {},
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

    useEffect(() => {
      console.log(uniqueId, " isWaitingForOnline: ", isWaitingForOnline ? "true" : "false");
    }, [isWaitingForOnline]);

    useEffect(() => console.log(uniqueId, " needsToPay: ", needsToPay ? "true" : "false"), [needsToPay]);

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
        
        setIsMobile(finalIsMobile);
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
  
    const loadVideo = useCallback((videoIndex, cameraIndex, previousState = null, direction = null, customAngles = null) => {
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

      cleanupHls();

      const state = previousState || saveCurrentState() || {
        currentTime: 0,
        isPlaying: autoPlay,
        fov: 90,
        angles: {
          yaw: 90
        }
      };

      if (direction !== null && state.angles) {
        state.angles = calculateNewAngles(state.angles, direction);
      }

      const hls = new Hls({
        debug: false,
        enableWorker: true,
        lowLatencyMode: false,
      });
      
      hlsRef.current = hls;
      hls.loadSource(videoUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (isListMode) {
          // console.log(`[${instanceId.current}] Video loaded - Video: ${videoIndex + 1}, Camera: ${cameraIndex + 1}, URL: ${videoUrl}`);
        } else {
          // console.log(`[${instanceId.current}] Camera loaded - Camera: ${cameraIndex + 1}, URL: ${videoUrl}`);
        }
        
        video.currentTime = state.currentTime;

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

        if (state.isPlaying) {
          if (pauseOthersOnPlay) {
            pauseOtherInstances();
          }
          
          video.play()
            .then(() => setIsPlaying(true))
            .catch(error => {
              console.error(`[${instanceId.current}] Error resuming playback:`, error);
              setIsPlaying(false);
            });
        } else {
          setIsPlaying(false);
        }
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error(`[${instanceId.current}] HLS Error:`, data);
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
    }, [isListMode, videoList, videoSources, autoPlay, pauseOthersOnPlay, pauseOtherInstances, cleanupHls, saveCurrentState, calculateNewAngles]);
  
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
      loadVideo(currentVideoIndex, newCameraIndex, previousState, direction);
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
      loadVideo(newVideoIndex, 0, previousState, null);
    }, [isListMode, currentVideoIndex, videoList, saveCurrentState, loadVideo]);
  
    useEffect(() => {
      loadVideo(initialVideoIndex, initialCameraIndex);
    }, [initialVideoIndex, initialCameraIndex, loadVideo]);
  
    const handlePlayPause = useCallback(() => {
      const video = videoRef.current;
      if (!video) return;

      if (video.paused) {
        pauseOtherInstances();
        
        video.play()
          .then(() => {
            setIsPlaying(true);
          })
          .catch(error => {
            console.error(`[${instanceId.current}] Play error:`, error);
          });
      } else {
        video.pause();
        setIsPlaying(false);
      }
    }, [pauseOtherInstances]);
  
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
        }, [3000]);
      }, []);
    
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
          if (document.hidden && videoRef.current && !videoRef.current.paused) {
            videoRef.current.pause();
            setIsPlaying(false);
          }
        };
  
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
      }, []);
  
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
        const target = e.target;
        const isControlButton = target.closest('.control-button-center') || 
                               target.closest('.video-controls-center') ||
                               target.closest('.video-controls-fullscreen');
        
        if (isControlButton) {
          const instanceFunctionName = `showVideoControlsForced_${instanceId.current}`;
          if (typeof window !== 'undefined' && window[instanceFunctionName]) {
            // console.log(`[${instanceId.current}] Canvas interaction - calling: ${instanceFunctionName}`);
            window[instanceFunctionName]();
          } else if (typeof window !== 'undefined' && window.showVideoControlsForced) {
            // console.log(`[${instanceId.current}] Canvas interaction - fallback to global function`);
            window.showVideoControlsForced();
          }
          return;
        }
        
        const isCanvasArea = target.tagName === 'CANVAS' || 
                            target.closest('.canvas-container') ||
                            target.closest('.canvas-container-embedded');
        
        if (isCanvasArea) {
          const startX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
          const startY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
          const startTime = Date.now();
          const wasPlaying = isPlaying;
          let hasMovedSignificantly = false;
          let hasTriggeredQuickClick = false;
          let quickClickTimer = null;
          
          const handleMove = (moveEvent) => {
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
            const endX = e.clientX || (e.changedTouches && e.changedTouches[0]?.clientX) || startX;
            const endY = e.clientY || (e.changedTouches && e.changedTouches[0]?.clientY) || startY;
            const endTime = Date.now();
            
            const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            const duration = endTime - startTime;
            
            if (quickClickTimer) {
              clearTimeout(quickClickTimer);
              quickClickTimer = null;
            }
            
            if (!hasTriggeredQuickClick) {
              const instanceFunctionName = `showVideoControls_${instanceId.current}`;
              if (typeof window !== 'undefined' && window[instanceFunctionName]) {
                // console.log(`[${instanceId.current}] Canvas end - calling: ${instanceFunctionName}`);
                window[instanceFunctionName](true, true);
              } else if (typeof window !== 'undefined' && window.showVideoControls) {
                // console.log(`[${instanceId.current}] Canvas end - fallback to global function`);
                window.showVideoControls(true, true);
              }
            }
            
            if (!wasPlaying && !hasTriggeredQuickClick && !hasMovedSignificantly && distance < 15 && duration < 300) {
              const instanceFunctionName = `showVideoControls_${instanceId.current}`;
              if (typeof window !== 'undefined' && window[instanceFunctionName]) {
                // console.log(`[${instanceId.current}] Quick click end - calling: ${instanceFunctionName}`);
                window[instanceFunctionName](true);
              } else if (typeof window !== 'undefined' && window.showVideoControls) {
                // console.log(`[${instanceId.current}] Quick click end - fallback to global function`);
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
                  // console.log(`[${instanceId.current}] Quick click - calling: ${instanceFunctionName}`);
                  window[instanceFunctionName]();
                } else if (typeof window !== 'undefined' && window.showVideoControls) {
                  // console.log(`[${instanceId.current}] Quick click - fallback to global function`);
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
      }, [isPlaying, instanceId]);
 
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
                    <Canvas>
                      <CanvasResizer isFullscreen={localFullscreen} />
                      <PerspectiveCamera 
                        ref={cameraRef}
                        makeDefault 
                        position={[0, 0, 0.001]}
                        fov={90}
                        near={0.001}
                        far={100}
                      />
                      <Video360 videoRef={videoRef} />
                      <OrbitControls 
                        ref={controlsRef}
                        enableZoom={false}
                        enablePan={false}
                        enableDamping
                        dampingFactor={0.1}
                        rotateSpeed={-0.5}
                        minPolarAngle={0.1}
                        maxPolarAngle={Math.PI - 0.1}
                      />
                    </Canvas>
                  </Suspense>
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
            <div className={`${localFullscreen ? "" : "hidden"} bg-black text-white/50 p-[8px] absolute bottom-0 left-0 w-full text-center text-[14px]`}>© Effect Player</div>
          </div>
          <div className={`${localFullscreen ? "hidden" : ""} md:hidden bg-black text-white/50 p-[8px] absolute bottom-0 left-0 w-full text-center text-[14px] translate-y-full`}>© Effect Player</div>
        </div>
      );
  }
  
  const ThreejsCanvas = React.forwardRef(ThreejsCanvasComponent);
  
  export default ThreejsCanvas;