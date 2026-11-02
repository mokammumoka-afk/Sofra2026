'use client';

import React, { useState } from 'react';

interface BrandLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showText?: boolean;
  textClassName?: string;
  className?: string;
  withBorder?: boolean;
  withGlow?: boolean;
  priority?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  size = 'md',
  showText = false,
  textClassName = '',
  className = '',
  withBorder = true,
  withGlow = false,
}) => {
  const [imageError, setImageError] = useState(false);

  // Size mapping
  const sizeMap = {
    xs: {
      box: 'w-6 h-6 rounded-lg',
      img: 'w-6 h-6',
      icon: 'w-3.5 h-3.5',
      text: 'text-xs',
      subtext: 'text-[8px]',
      badge: 'px-1 py-0.2 text-[8px]',
    },
    sm: {
      box: 'w-8 h-8 rounded-xl',
      img: 'w-8 h-8',
      icon: 'w-4 h-4',
      text: 'text-sm',
      subtext: 'text-[9px]',
      badge: 'px-1.5 py-0.2 text-[9px]',
    },
    md: {
      box: 'w-10 h-10 sm:w-11 sm:h-11 rounded-2xl',
      img: 'w-10 h-10 sm:w-11 sm:h-11',
      icon: 'w-5 h-5',
      text: 'text-base sm:text-lg',
      subtext: 'text-[10px]',
      badge: 'px-1.5 py-0.5 text-[10px]',
    },
    lg: {
      box: 'w-14 h-14 rounded-2xl sm:rounded-3xl',
      img: 'w-14 h-14',
      icon: 'w-7 h-7',
      text: 'text-lg sm:text-xl',
      subtext: 'text-xs',
      badge: 'px-2 py-0.5 text-xs',
    },
    xl: {
      box: 'w-20 h-20 sm:w-24 sm:h-24 rounded-3xl',
      img: 'w-20 h-20 sm:w-24 sm:h-24',
      icon: 'w-10 h-10',
      text: 'text-2xl',
      subtext: 'text-sm',
      badge: 'px-2.5 py-1 text-xs',
    },
    '2xl': {
      box: 'w-28 h-28 sm:w-32 sm:h-32 rounded-3xl',
      img: 'w-28 h-28 sm:w-32 sm:h-32',
      icon: 'w-14 h-14',
      text: 'text-3xl',
      subtext: 'text-base',
      badge: 'px-3 py-1 text-sm',
    },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* Visual Logo Container */}
      <div
        className={`relative shrink-0 overflow-hidden ${currentSize.box} ${
          withBorder ? 'border-2 border-amber-400/80 shadow-md shadow-orange-500/20' : ''
        } ${withGlow ? 'ring-4 ring-amber-400/30' : ''} bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 flex items-center justify-center`}
      >
        {!imageError ? (
          <img
            src="/sufra_logo.jpg"
            alt="شعار منصة سُفرة"
            className="w-full h-full object-cover select-none"
            referrerPolicy="no-referrer"
            onError={() => setImageError(true)}
            suppressHydrationWarning
          />
        ) : (
          /* High-Fidelity Vector Fallback if Image is not reachable */
          <div className="w-full h-full bg-gradient-to-tr from-orange-600 via-amber-500 to-yellow-400 flex flex-col items-center justify-center text-white p-1 text-center shadow-inner">
            <svg
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`${currentSize.icon} text-white drop-shadow-md`}
            >
              {/* Steaming Traditional Libyan Tagine / Pot */}
              <path
                d="M24 6C24 6 22 10 24 13C26 16 24 18 24 18"
                stroke="#FEF3C7"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <path
                d="M18 8C18 8 16 11 18 13C20 15 18 17 18 17"
                stroke="#FEF3C7"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.8"
              />
              <path
                d="M30 8C30 8 28 11 30 13C32 15 30 17 30 17"
                stroke="#FEF3C7"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.8"
              />
              {/* Lid Cone / Domed Tagine */}
              <path
                d="M24 18L10 32C9.5 32.5 10 34 11 34H37C38 34 38.5 32.5 38 32L24 18Z"
                fill="#FFFBEB"
                stroke="#78350F"
                strokeWidth="1.5"
              />
              {/* Knob */}
              <circle cx="24" cy="18" r="3" fill="#F59E0B" stroke="#78350F" strokeWidth="1.5" />
              {/* Base Platter */}
              <path
                d="M6 34C6 34 8 42 24 42C40 42 42 34 42 34H6Z"
                fill="#B45309"
                stroke="#78350F"
                strokeWidth="1.5"
              />
              <path
                d="M4 34H44"
                stroke="#FEF3C7"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-[7px] font-black tracking-tighter text-amber-950 uppercase leading-none mt-0.5">
              سُفرة
            </span>
          </div>
        )}
      </div>

      {/* Typography Label */}
      {showText && (
        <div className={`flex items-center gap-1.5 ${textClassName}`}>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className={`font-black tracking-tight text-stone-900 ${currentSize.text}`}>
                سُفـرة
              </span>
              <span
                className={`bg-orange-100 text-orange-800 font-extrabold rounded-full border border-orange-200 shrink-0 ${currentSize.badge}`}
              >
                ليبيا 🇱🇾
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
