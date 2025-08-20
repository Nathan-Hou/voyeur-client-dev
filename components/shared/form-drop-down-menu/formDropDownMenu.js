"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Loader2 } from "lucide-react";

export const CustomSelect = ({ 
  value, 
  onChange, 
  error, 
  options, 
  placeholder,
  isLoading = false,
  disabled = false,
  onFocus,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [isCustomInput, setIsCustomInput] = useState(false);
    const dropdownRef = useRef(null);
    const inputRef = useRef(null);
    const [isFromOtherOption, setIsFromOtherOption] = useState(false);

    // Update searchTerm when value changes
    useEffect(() => {
      // 檢查 value 是否存在於選項中
      const selectedOption = options.find(opt => opt.value === value);
      if (selectedOption) {
        setSearchTerm(selectedOption.label);
        setIsCustomInput(false);
      } else if (value) {
        // 如果 value 不在選項中但有值，表示是自定義輸入
        setSearchTerm(value);
        setIsCustomInput(true);
      } else {
        setSearchTerm('');
        setIsCustomInput(false); // 重置 isCustomInput
      }
    }, [value, options]);

    // Handle click outside
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // 過濾選項，根據是否為自定義輸入決定過濾邏輯
    const filteredOptions = isCustomInput
      ? options.filter(option =>
          option.label.toLowerCase().includes(searchTerm.toLowerCase()))
      : options;

    const handleDropdownToggle = () => {
      if (!disabled && !isLoading) {
        setIsOpen(prev => !prev);
        setIsCustomInput(false); // 點擊箭頭時重置自定義輸入狀態
      }
    };

    const handleSelect = (option) => {
      if (option.value === 'other') {
        setIsCustomInput(true);
        setSearchTerm('');
        onChange('');
        setIsOpen(false);
        setIsFromOtherOption(true); // 使用者選擇自行輸入
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      } else {
        setIsCustomInput(false);
        onChange(option.value);
        setSearchTerm(option.label);
        setIsOpen(false);
      }
    };

    const handleInputChange = (e) => {
      if (disabled) return;
      
      const newValue = e.target.value;
      setSearchTerm(newValue);
      setIsOpen(true);
      
      // 檢查是否有完全匹配的選項
      const exactMatch = options.find(opt => 
        opt.label.toLowerCase() === newValue.toLowerCase()
      );

      if (exactMatch) {
        setIsCustomInput(false);
        onChange(exactMatch.value);
      } else {
        setIsCustomInput(true);
        onChange(newValue);
      }
    };

    const handleKeyDown = (e) => {
      if (disabled) return;

      if (e.key === 'Escape') {
        setIsOpen(false);
        if (isCustomInput) {
          setIsCustomInput(false);
          setSearchTerm('');
          onChange('');
        }
        return;
      }

      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
      } else if (e.key === 'Enter' && highlightedIndex !== -1) {
        e.preventDefault();
        handleSelect(filteredOptions[highlightedIndex]);
      }
    };

    const handleFocus = (e) => {
      if (onFocus) onFocus(e);
      if (!disabled && !isLoading && !isFromOtherOption) {
        setIsOpen(true);
      }
      // 重置標記
      setIsFromOtherOption(false);
    };

    return (
      <div className="relative w-full" ref={dropdownRef}>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled || isLoading}
            className={`
              border
              ${error ? 'border-red-500' : 'border-transparent'}
              ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
              focus:outline-none focus:border-blue-500
              transition-colors duration-200
            `}
            style={{width: "calc(100% - 2rem)"}}
          />
          <ChevronDown 
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400
              ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
              ${isOpen ? 'rotate-180' : ''}
              transition-transform duration-200
            `}
            onClick={handleDropdownToggle}
          />
        </div>
        
        {isOpen && !disabled && !isLoading && filteredOptions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
            {filteredOptions.map((option, index) => (
              <div
                key={option.value}
                onClick={() => handleSelect(option)}
                className={`
                  px-4 py-2 cursor-pointer
                  ${index === highlightedIndex ? 'bg-gray-100' : ''}
                  hover:bg-gray-100
                  transition-colors duration-150
                  ${option.value === 'other' ? 'border-t border-gray-200' : ''}
                `}
              >
                {option.label}
              </div>
            ))}
          </div>
        )}
      </div>
    );
};