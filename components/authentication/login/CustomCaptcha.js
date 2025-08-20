"use client";

import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

const CustomCaptcha = ({ onValidate }) => {
  const [captchaText, setCaptchaText] = useState('');
  const [userInput, setUserInput] = useState('');
  const [randomLines, setRandomLines] = useState([]);
  const [randomDots, setRandomDots] = useState([]);

  const generateCaptchaText = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let text = '';
    for (let i = 0; i < 4; i++) {
    text += chars.charAt(Math.random() * chars.length);
    }
    return text;
  };

  const generateRandomLine = () => {
    const x1 = Math.random() * 120;
    const y1 = Math.random() * 50;
    const x2 = Math.random() * 120;
    const y2 = Math.random() * 50;
    const x3 = Math.random() * 120;
    const y3 = Math.random() * 50;
    return `M ${x1} ${y1} Q ${x2} ${y2} ${x3} ${y3}`;
  };

  const generateRandomDots = () => {
    let dots = [];
    for (let i = 0; i < 50; i++) {
        dots.push({
            x: Math.random() * 120,
            y: Math.random() * 50
        });
    }
    return dots;
  };

  const refreshCaptcha = () => {
    setCaptchaText(generateCaptchaText());
    setRandomLines(Array(8).fill(0).map(() => generateRandomLine()));
    setRandomDots(generateRandomDots());
    setUserInput('');
  };

  useEffect(() => {
    refreshCaptcha();
  }, []);

  const handleInputChange = (e) => {
    const input = e.target.value.toUpperCase();
    setUserInput(input);
    onValidate(input === captchaText);
  };

    // 在服務端渲染時返回基本結構
    if (!captchaText) {
        return (
            <div className="w-full">
            <div className="flex items-center mb-2">
                <label htmlFor="captcha" className="block text-sm font-medium text-gray-700">
                驗證碼
                </label>
            </div>
            <div className="flex flex-row gap-2 items-center">
                <div className="flex-shrink-0 relative">
                <div className="w-[120px] h-[50px] border border-white rounded-lg bg-black" />
                </div>
                <input
                type="text"
                id="captcha"
                className="block flex-1 min-w-0 rounded-lg border-gray-300 shadow-sm"
                placeholder="輸入驗證碼"
                disabled
                />
            </div>
            </div>
        );
    }

  return (
    <div className="w-full mt-2.5 2xl:mt-5 pe-8">
      <div className="flex flex-row gap-2 items-center">
        <input
          type="text"
          id="captcha"
          value={userInput}
          onChange={handleInputChange}
          maxLength={4}
          className="block flex-1 min-w-0 border border-white/75 bg-black text-white !leading-[3] rounded-[10px] px-6 input-focus-border"
          placeholder="請輸入驗證碼"
        />
        <div className="flex-shrink-0 relative">
          <svg width="120" height="50" className="border border-white/75 rounded-[10px]">
            {/* 背景 - 改為黑色 */}
            <rect width="120" height="50" fill="#000000" />
            
            {/* 干擾線 - 改為淺色系 */}
            {[...Array(8)].map((_, i) => (
              <path
                key={`line-${i}`}
                d={generateRandomLine()}
                fill="none"
                stroke="#64748b"
                strokeWidth="1"
                opacity="0.6"
              />
            ))}
            
            {/* 干擾點 - 改為淺色系 */}
            {generateRandomDots().map((dot, i) => (
              <circle
                key={`dot-${i}`}
                cx={dot.x}
                cy={dot.y}
                r="1"
                fill="#94a3b8"
                opacity="0.7"
              />
            ))}
            
            {/* 驗證碼文字 - 改為白色 */}
            <text
              x="50%"
              y="50%"
              dominantBaseline="middle"
              textAnchor="middle"
              fontSize="24"
              fontFamily="monospace"
              fill="#ffffff"
              letterSpacing="0.1em"
              transform="rotate(-5)"
            >
              {captchaText}
            </text>
          </svg>
          
          <button
            onClick={refreshCaptcha}
            type="button"
            className="absolute -right-8 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full"
            aria-label="重新產生驗證碼"
          >
            <RefreshCw className="w-4 h-4 text-white" />
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default CustomCaptcha;