"use client";

import { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';

export default function CanvasResizer({ isFullscreen }) {
    const { gl, size, invalidate } = useThree();
    
    useEffect(() => {
        const handleResize = () => {
            // 延遲一點讓 DOM 完全更新
            setTimeout(() => {
                if (gl.domElement.parentElement) {
                    const parent = gl.domElement.parentElement;
                    const rect = parent.getBoundingClientRect();
                    
                    let width = rect.width;
                    let height = rect.height;
                    
                    // 如果不是全螢幕模式，強制使用 2:1 比例
                    if (!isFullscreen && width > 0) {
                        height = width / 2; // 2:1 比例
                    }
                    
                    // 只在尺寸真的有變化時才更新
                    if (width > 0 && height > 0) {
                        gl.setSize(width, height);
                        gl.setPixelRatio(window.devicePixelRatio);
                        invalidate(); // 觸發重新渲染
                    }
                }
            }, 100); // 給更多時間讓 CSS 轉換完成
        };

        // 當全螢幕狀態改變時觸發 resize
        handleResize();
        
        return () => {};
    }, [gl, isFullscreen, invalidate]); // 依賴 isFullscreen 狀態

    return null;
}