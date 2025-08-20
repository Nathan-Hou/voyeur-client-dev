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
  uniqueId = `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // 自動生成唯一ID
  isFullscreen = true, 
  containerClassName = "",
  containerStyle = {},
  // 支援兩種格式：
  // 1. videoList: [["1-1", "1-2", ...], ["2-1", "2-2", ...]] (列表頁面用)
  // 2. videoSources: ["1-1", "1-2", ...] (細節頁面用，單一影片的多個攝影機)
  videoList = null, 
  videoSources = [],
  initialVideoIndex = 0, // 第幾部影片（只在 videoList 模式下有效）
  initialCameraIndex = 0, // 第幾個攝影機
  initialYaw = 90,
  showControls = true,
  showSwitcher = true,
  autoPlay = false, // 新增：控制是否自動播放
  pauseOthersOnPlay = true, // 新增：播放時是否暫停其他實例
  onFullscreenChange = null, // 新增：全螢幕狀態變化回調
  borderStyle = {}, // 新增：自訂邊框樣式
  videoTitle = null, // 新增：影片標題
  showTitle = true, // 新增：是否顯示標題
  titleStyle = {}, // 新增：自訂標題樣式,
  isOnline,
  setIsModalOpen
}, ref) {
    // 使用 uniqueId 作為實例標識
    const instanceId = useRef(uniqueId);
    
    const videoRef = useRef(null);
    const cameraRef = useRef(null);
    const controlsRef = useRef(null);
    const hlsRef = useRef(null);
    
    // 判斷使用模式
    const isListMode = videoList !== null;
    
    const [currentVideoIndex, setCurrentVideoIndex] = useState(initialVideoIndex); // 目前第幾部影片
    const [currentCameraIndex, setCurrentCameraIndex] = useState(initialCameraIndex); // 目前第幾個攝影機
    const [isLoading, setIsLoading] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isUIVisible, setIsUIVisible] = useState(true);
    const [localFullscreen, setLocalFullscreen] = useState(isFullscreen); // 新增：本地全螢幕狀態
    const hideUITimeout = useRef(null);
    const containerRef = useRef(null);
    const [alertState, setAlertState] = useState({
      visible: false,
      message: ''
    });
    const alertTimeoutRef = useRef(null);

    // 🆕 新增狀態：追蹤相機是否已準備好
    const [cameraReady, setCameraReady] = useState(false);
    const [pendingAngles, setPendingAngles] = useState(null);

    // 取得當前影片的攝影機陣列
    const getCurrentVideoSources = useCallback(() => {
      if (isListMode) {
        return videoList[currentVideoIndex] || [];
      } else {
        return videoSources || [];
      }
    }, [isListMode, videoList, currentVideoIndex, videoSources]);

    // 暫停其他實例的函數
    const pauseOtherInstances = useCallback(() => {
      // console.log(`[${instanceId.current}] pauseOtherInstances called, pauseOthersOnPlay:`, pauseOthersOnPlay);
      
      if (pauseOthersOnPlay && typeof window !== 'undefined' && window.videoInstances) {
        // console.log(`[${instanceId.current}] Total instances:`, window.videoInstances.size);
        
        window.videoInstances.forEach((instance, id) => {
          if (id !== instanceId.current) {
            // console.log(`[${instanceId.current}] Pausing instance:`, id);
            instance.pause();
          }
        });
      } else {
        // console.log(`[${instanceId.current}] pauseOtherInstances skipped - pauseOthersOnPlay:`, pauseOthersOnPlay, 'window.videoInstances:', !!window.videoInstances);
      }
    }, [pauseOthersOnPlay]);
    
    // 處理全螢幕切換
    const handleFullscreen = useCallback(() => {
      const newFullscreenState = !localFullscreen;
      setLocalFullscreen(newFullscreenState);
      
      if (newFullscreenState) {
        // 進入全螢幕時暫停其他實例
        pauseOtherInstances();
      }
      
      // 通知父元件狀態變化
      if (onFullscreenChange) {
        onFullscreenChange(newFullscreenState);
      }
    }, [localFullscreen, onFullscreenChange, pauseOtherInstances]);

    // 動態生成外層容器樣式
    const getWrapperStyle = () => {
      if (localFullscreen) {
        return {}; // 全螢幕模式不需要額外樣式
      }
      
      // 嵌入式模式需要為標題預留空間
      return {
        marginTop: showTitle && videoTitle && !localFullscreen ? '80px' : '0px',
      };
    };

    // 動態生成容器樣式
    const getContainerStyle = () => {
      if (localFullscreen) {
        return {
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 9999,
          backgroundColor: '#000'
        }; // 全螢幕模式
      }
      
      // 嵌入式模式 - 使用 16:9 比例
      const baseStyle = {
        width: '100%',
        height: 'auto',
        position: 'relative',
        overflow: 'hidden',
        ...containerStyle
      };

      return baseStyle;
    };

    // 動態生成 Canvas 容器類別
    const getCanvasContainerClass = () => {
      return localFullscreen 
        ? "canvas-container" 
        : "canvas-container-embedded";
    };

    // 動態生成 Canvas 容器樣式
    const getCanvasContainerStyle = () => {
      if (localFullscreen) {
        return {
          width: '100%',
          height: '100%',
          position: 'relative'
        };
      }
    };

    // 全域實例管理（用於控制多個實例的行為）
    useEffect(() => {
      // 註冊實例
      if (typeof window !== 'undefined') {
        if (!window.videoInstances) {
          window.videoInstances = new Map();
          // console.log(`[${instanceId.current}] Created global videoInstances Map`);
        }
        
        const instanceData = {
          videoRef,
          pause: () => {
            // console.log(`[${instanceId.current}] Pause called from global instance manager`);
            if (videoRef.current && !videoRef.current.paused) {
              videoRef.current.pause();
              setIsPlaying(false);
            }
          },
          play: () => {
            // console.log(`[${instanceId.current}] Play called from global instance manager`);
            if (videoRef.current && videoRef.current.paused) {
              return videoRef.current.play().then(() => setIsPlaying(true));
            }
          }
        };
        
        window.videoInstances.set(instanceId.current, instanceData);
        // console.log(`[${instanceId.current}] Registered instance. Total instances:`, window.videoInstances.size);
        
        // Cleanup 時移除實例
        return () => {
          if (window.videoInstances) {
            window.videoInstances.delete(instanceId.current);
            // console.log(`[${instanceId.current}] Unregistered instance. Remaining instances:`, window.videoInstances.size);
          }
        };
      }
    }, []);

    // 優化的 HLS 清理
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
  
    // 保存當前狀態的函數
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
  
    // 計算新的相機角度
    const calculateNewAngles = useCallback((currentAngles, direction) => {
      // console.log("calculateNewAngles. currentAngles: ", currentAngles);
      if (!currentAngles) return null;
  
      // 準備角度數據
      const sphericalProps = {
        yaw: (currentAngles.yaw * (180 / Math.PI) - 90) >= 0 
        ? currentAngles.yaw * (180 / Math.PI) - 90 
        : currentAngles.yaw * (180 / Math.PI) - 90 + 360, // 轉換為角度
        pitch: currentAngles.pitch * (180 / Math.PI),
        roll: currentAngles.roll * (180 / Math.PI)
      };

      // console.log("sphericalProps: ", sphericalProps);
  
      // 根據方向選擇計算公式
      const newYaw = direction === -1 
        ? calculateYawVideo1(sphericalProps) // 往左切換
        : calculateYawVideo2(sphericalProps); // 往右切換

      // console.log("newYaw: ", newYaw);
  
      let newAngles = {
        yaw: ((newYaw + 90) < 360)
        ? (newYaw + 90)  * (Math.PI / 180) 
        : (newYaw + 90 - 360) * (Math.PI / 180),
      }

      // console.log("newAngles: ", newAngles)
  
      // console.log(`[${instanceId.current}] Angle calculation:`, {
      //   original: sphericalProps.yaw,
      //   calculated: newAngles.yaw,
      //   direction: direction
      // });
  
      // 返回新的角度（轉回弧度）
      return newAngles;
    }, []);

    // 移除 damping
    const setCameraAnglesWhenReady = useCallback((yaw = null, pitch = null, roll = null, retryCount = 0) => {
      const MAX_RETRIES = 10;
      const RETRY_DELAY = 100;
            
      if (controlsRef.current && cameraRef.current) {
        try {
          // 🆕 暫時停用 damping 以實現瞬間轉換
          const originalDamping = controlsRef.current.enableDamping;
          controlsRef.current.enableDamping = false;
          
          // 設定 yaw (方位角)
          if (yaw !== null) {
            const yawRadians = yaw * (Math.PI / 180);
            controlsRef.current.setAzimuthalAngle(yawRadians);
            // console.log(`[${instanceId.current}] ✅ Set yaw to: ${yaw}°`);
          }
        
          // 🆕 強制立即更新
          controlsRef.current.update();
          cameraRef.current.updateProjectionMatrix();
          
          // 🆕 恢復 damping 設定
          controlsRef.current.enableDamping = originalDamping;
          
          // 標記相機已準備好
          setCameraReady(true);
          setPendingAngles(null);
          
          return true;
          
        } catch (error) {
          console.error(`[${instanceId.current}] Error setting camera angles:`, error);
          return false;
        }
      } else {
        // 如果相機還沒準備好，儲存角度並稍後重試
        // console.log(`[${instanceId.current}] ⏳ Camera not ready, scheduling retry...`);
        
        if (retryCount < MAX_RETRIES) {
          setPendingAngles({ yaw, pitch, roll });
          setTimeout(() => {
            setCameraAnglesWhenReady(yaw, pitch, roll, retryCount + 1);
            // setCameraAnglesWhenReady(yaw, null, null, retryCount + 1);
          }, RETRY_DELAY);
        } else {
          console.error(`[${instanceId.current}] ❌ Failed to set camera angles after ${MAX_RETRIES} retries`);
        }
        return false;
      }
    }, []);
    

    // 🆕 監聽相機準備狀態，處理待設定的角度
    useEffect(() => {
      if (cameraReady && pendingAngles) {
        const { yaw, pitch, roll } = pendingAngles;
        setCameraAnglesWhenReady(yaw, pitch, roll);
        // setCameraAnglesWhenReady(yaw);
      }
    }, [cameraReady, pendingAngles, setCameraAnglesWhenReady]);
  
    // 載入影片（加強版）
    const loadVideo = useCallback((videoIndex, cameraIndex, previousState = null, direction = null, customAngles = null) => {
      // console.log("loadVideo")

      const video = videoRef.current;
      if (!video || !Hls.isSupported()) return;

      let videoUrl = '';
      
      // 根據模式取得影片 URL
      if (isListMode) {
        // 列表模式：檢查索引是否有效
        if (!videoList[videoIndex] || !videoList[videoIndex][cameraIndex]) {
          console.error(`[${instanceId.current}] Invalid video/camera index:`, videoIndex, cameraIndex);
          return;
        }
        videoUrl = videoList[videoIndex][cameraIndex];
      } else {
        // 細節模式：只檢查攝影機索引
        if (videoSources[cameraIndex] === "") {
          // console.log("videoUrl is empty string");
          setIsModalOpen(true);
          return;
        } else if (!videoSources[cameraIndex]) {
          console.error(`[${instanceId.current}] Invalid camera index:`, cameraIndex);
          return;
        }
        videoUrl = videoSources[cameraIndex];
      }

      // 先清理舊的實例
      cleanupHls();

      // console.log("previousState: ", previousState);

      // 獲取狀態
      const state = previousState || saveCurrentState() || {
        currentTime: 0,
        isPlaying: autoPlay, // 使用 autoPlay prop
        fov: 90,
        angles: {
          yaw: 90
        }
      };

      // 如果有方向參數，計算新的角度
      if (direction !== null && state.angles) {
        // console.log("if")
        state.angles = calculateNewAngles(state.angles, direction);
      }

      // 創建新的 HLS 實例
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
        
        // 設置時間
        video.currentTime = state.currentTime;
        
        // 🆕 修改角度設定邏輯
        setTimeout(() => {
          let targetYaw = null;

          // 優先使用自訂角度
          if (customAngles) {
            targetYaw = customAngles.yaw;
          }
          // 如果是初次載入且有設定初始角度
          else if (!previousState && (initialYaw !== null)) {
            targetYaw = initialYaw;
          }
          // 如果有儲存的角度狀態
          else if (state.angles) {
            targetYaw = state.angles.yaw * (180 / Math.PI); // 轉換為度數
          }

          // 設定相機角度
          if (targetYaw !== null) {
            setCameraAnglesWhenReady(targetYaw);
          }
        }, 100); // 給 Three.js 一點時間初始化

        // 根據之前的播放狀態決定是否播放
        if (state.isPlaying) {
          // 如果需要自動播放，先暫停其他實例
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
  
    // 切換攝影機角度（左右按鈕）
    const handleCameraSwitch = useCallback((direction) => {      
      const currentSources = getCurrentVideoSources();
      let newCameraIndex = currentCameraIndex + direction;
      
      // 實現循環切換攝影機
      if (newCameraIndex < 0) {
        newCameraIndex = currentSources.length - 1; // 如果是第一個往左，切換到最後一個
      } else if (newCameraIndex >= currentSources.length) {
        newCameraIndex = 0; // 如果是最後一個往右，切換到第一個
      }

      // 提前檢查 URL 是否為空
      if (videoSources[newCameraIndex] === "") {
        console.log("VideoUrl is empty. Showing modal without switching camera.");
        setIsModalOpen(true);
        return;
      }

      const previousState = saveCurrentState();
      setCurrentCameraIndex(newCameraIndex);
      loadVideo(currentVideoIndex, newCameraIndex, previousState, direction);
    }, [currentVideoIndex, currentCameraIndex, saveCurrentState, loadVideo, getCurrentVideoSources]);

    // 切換影片（只在列表模式下有效）
    const handleVideoSwitch = useCallback((direction) => {
      if (!isListMode) {
        console.warn(`[${instanceId.current}] Video switch not available in single video mode`);
        return;
      }
      
      let newVideoIndex = currentVideoIndex + direction;
      
      // 實現循環切換影片
      if (newVideoIndex < 0) {
        newVideoIndex = videoList.length - 1;
      } else if (newVideoIndex >= videoList.length) {
        newVideoIndex = 0;
      }

      // 切換影片時重置到第一個攝影機
      const previousState = saveCurrentState();
      setCurrentVideoIndex(newVideoIndex);
      setCurrentCameraIndex(0);
      loadVideo(newVideoIndex, 0, previousState, null); // 切換影片時不計算角度
    }, [isListMode, currentVideoIndex, videoList, saveCurrentState, loadVideo]);
  
    // 初始化第一個影片
    useEffect(() => {
      // console.log("inside useEffect. initialVideoIndex: ", initialVideoIndex, " initialCameraIndex: ", initialCameraIndex)
      loadVideo(initialVideoIndex, initialCameraIndex);
    }, [initialVideoIndex, initialCameraIndex, loadVideo]);
  
    // 修改後的播放/暫停控制
    const handlePlayPause = useCallback(() => {
      // console.log(`[${instanceId.current}] handlePlayPause called`)
      const video = videoRef.current;
      if (!video) return;

      if (video.paused) {
        // console.log(`[${instanceId.current}] Video is paused, starting play`)
        // 播放前先暫停其他實例
        pauseOtherInstances();
        
        video.play()
          .then(() => {
            // console.log(`[${instanceId.current}] Play successful`)
            setIsPlaying(true);
          })
          .catch(error => {
            console.error(`[${instanceId.current}] Play error:`, error);
          });
      } else {
        // console.log(`[${instanceId.current}] Video is playing, pausing`)
        video.pause();
        setIsPlaying(false);
      }
    }, [pauseOtherInstances]);
  
    // 獲取當前相機角度（用於除錯）
    // const logCameraAngles = useCallback(() => {
    //   if (controlsRef.current && cameraRef.current) {
    //     console.log(`[${instanceId.current}] Camera angles:`, {
    //       yaw: controlsRef.current.getAzimuthalAngle() * (180 / Math.PI),
    //       pitch: controlsRef.current.getPolarAngle() * (180 / Math.PI),
    //       roll: cameraRef.current.rotation.z * (180 / Math.PI),
    //       fov: cameraRef.current.fov
    //     });
    //   }
    // }, []);
  
    // UI 顯示控制
    const showUI = useCallback(() => {
      setIsUIVisible(true);
      // 清除現有的計時器
      if (hideUITimeout.current) {
        clearTimeout(hideUITimeout.current);
      }
      // 設定新的隱藏計時器
      hideUITimeout.current = setTimeout(() => {
        setIsUIVisible(false);
      }, 3000); // 3秒後隱藏
    }, []);

    // 🆕 監聽 Three.js 相機準備狀態
    useEffect(() => {
      const checkCameraReady = () => {
        if (controlsRef.current && cameraRef.current) {
          // console.log(`[${instanceId.current}] ✅ Camera and controls are ready`);
          setCameraReady(true);
          return true;
        }
        return false;
      };

      // 立即檢查
      if (!checkCameraReady()) {
        // 如果還沒準備好，定期檢查
        const interval = setInterval(() => {
          if (checkCameraReady()) {
            clearInterval(interval);
          }
        }, 100);

        // 清理
        return () => clearInterval(interval);
      }
    }, []);
  
    // 處理滑鼠移動（桌面版）
    const handleMouseMove = useCallback((e) => {
      if (window.matchMedia('(min-width: 769px)').matches) {
        showUI();
      }
    }, [showUI]);
  
    // 處理觸控（手機版）
    const handleTouch = useCallback((e) => {
      if (window.matchMedia('(max-width: 768px)').matches) {
        e.preventDefault();
        showUI();
      }
    }, [showUI]);
  
    // 顯示提醒訊息
    const showAlert = useCallback((message) => {
      // 清除現有的 timeout
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }

      // 顯示新訊息
      setAlertState({
        visible: true,
        message: message
      });

      // 設定自動關閉
      alertTimeoutRef.current = setTimeout(() => {
        setAlertState(prev => ({
          ...prev,
          visible: false
        }));
      }, [3000]);
    }, []);
  
    // 處理禁用按鈕的點擊
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

    // 當頁面變為隱藏時暫停影片（避免背景播放浪費資源）
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

    // 組件卸載時的完整清理
    useEffect(() => {
      return () => {
        // 清理 HLS
        cleanupHls();
        
        // 清理計時器
        if (hideUITimeout.current) {
          clearTimeout(hideUITimeout.current);
        }
        if (alertTimeoutRef.current) {
          clearTimeout(alertTimeoutRef.current);
        }
        
        // 從全域實例管理中移除
        if (typeof window !== 'undefined' && window.videoInstances) {
          window.videoInstances.delete(instanceId.current);
        }
        
        // console.log(`[${instanceId.current}] Component unmounted and cleaned up`);
      };
    }, [cleanupHls]);

    // 🆕 暴露給外部使用的角度設定函式
    const setViewAngles = useCallback((yaw = null, pitch = null, roll = null) => {
      // console.log(`[${instanceId.current}] External call to set view angles`);
      setCameraAnglesWhenReady(yaw, pitch, roll);
      // setCameraAnglesWhenReady(yaw);
    }, [setCameraAnglesWhenReady]);

    // 🆕 將函式暴露給父組件
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
  
    return (
      <div 
        style={getWrapperStyle()}
        className={`video-wrapper relative ${containerClassName}`}
      >
        {/* 影片標題 - 只在嵌入式模式且有標題時顯示 */}
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
          onTouchStart={handleTouch}
          data-video-instance={instanceId.current} // 用於調試
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
                      // onChange={logCameraAngles}
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
                        handleCameraSwitch(-1); // 改為切換攝影機
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
                        handleCameraSwitch(1); // 改為切換攝影機
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
                    isVisible={isUIVisible}
                    onPlayPause={handlePlayPause}
                    onFullscreen={!isFullscreen ? handleFullscreen : null}
                  />
                </div>
              )}

              {/* Alert 組件 */}
              <Alert 
                message={alertState.message} 
                isVisible={alertState.visible} 
              />
            </div>
          </div>
        </div>
      </div>
    );
}

const ThreejsCanvas = React.forwardRef(ThreejsCanvasComponent);

export default ThreejsCanvas;