"use client";

import React, { useState, useEffect } from 'react';
import { Play, Pause, FastForward, Volume2, Maximize, Eye } from 'lucide-react';
import '@/styles/VideoControls.css';

function VideoControls({ videoRef, cameraRef, onPlayPause, onFullscreen }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [fov, setFov] = useState(90);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const timeUpdate = () => setCurrentTime(video.currentTime);
    const durationChange = () => setDuration(video.duration);
    const playStateChange = () => setIsPlaying(!video.paused);
    
    video.addEventListener('timeupdate', timeUpdate);
    video.addEventListener('durationchange', durationChange);
    video.addEventListener('play', playStateChange);
    video.addEventListener('pause', playStateChange);
    
    return () => {
      video.removeEventListener('timeupdate', timeUpdate);
      video.removeEventListener('durationchange', durationChange);
      video.removeEventListener('play', playStateChange);
      video.removeEventListener('pause', playStateChange);
    };
  }, [videoRef]);

  const handlePlayPause = () => {
    if (onPlayPause) {
      // 使用父元件傳來的函數（包含暫停其他實例的邏輯）
      onPlayPause();
    } else {
      // 備用方案：直接操作 video（保持向後相容）
      const video = videoRef.current;
      if (!video) return;

      if (video.paused) {
        video.play().catch(console.error);
      } else {
        video.pause();
      }
    }
  };

  const handleFastForward = () => {
    const video = videoRef.current;
    if (!video) return;

    // 快進 5 秒
    const newTime = Math.min(video.currentTime + 5, video.duration);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleFullscreen = () => {
    if (onFullscreen) {
      onFullscreen();
    }
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

  return (
    <div className="video-controls">
      <div className="flex max-md:flex-wrap max-md:gap-y-2 md:gap-x-6">
        <div className='controls-row'>
        <button 
          className="control-button play-pause-button"
          onClick={handlePlayPause}
          title={isPlaying ? '暫停' : '播放'}
        >
          {isPlaying ? <Pause size={20} className='shrink-0' /> : <Play size={20} className='shrink-0' />}
        </button>

        <button 
          className="control-button fast-forward-button"
          onClick={handleFastForward}
          title="快進 5 秒"
        >
          <FastForward size={20} className='shrink-0' />
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
          <Volume2 size={20} className='shrink-0' />
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
          <Eye size={20} className='shrink-0' />
          {/* <span className="fov-value">{fov}°</span> */}
          <input
            type="range"
            min="60"
            max="120"
            value={fov}
            onChange={handleFovChange}
            className="fov-slider"
            title={`視野: ${fov}°`}
          />
        </div>

        {onFullscreen && (
          <button 
            className="control-button fullscreen-button"
            onClick={handleFullscreen}
            title="全螢幕"
          >
            <Maximize size={20} className='shrink-0' />
          </button>
        )}
                </div>


      </div>
    </div>
  );
}

export default VideoControls;