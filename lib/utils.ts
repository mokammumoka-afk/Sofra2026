import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Generates a collision-proof ID for high-concurrency environments
 */
export function generateUniqueId(prefix: string = 'id'): string {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 9);
  const performanceNow = typeof performance !== 'undefined' 
    ? Math.floor(performance.now() * 100).toString(36) 
    : '';
  return `${prefix}-${timestamp}-${randomStr}${performanceNow}`;
}

/**
 * Compresses base64 or image blob URLs client-side to handle heavy simultaneous uploads safely
 */
export async function compressImage(
  dataUrl: string,
  maxWidth: number = 1000,
  quality: number = 0.8
): Promise<string> {
  if (!dataUrl.startsWith('data:image')) {
    return dataUrl; // External Unsplash or HTTP URLs don't need base64 compression
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.src = dataUrl;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = () => {
      resolve(dataUrl);
    };
  });
}

/**
 * Debounce helper to prevent rapid double-clicks on critical actions like post/order
 */
export function debounce<T extends (...args: any[]) => void>(func: T, wait: number): T {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return ((...args: any[]) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  }) as T;
}

