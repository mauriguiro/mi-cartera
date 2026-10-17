'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function MobileBackGestureGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const touchState = useRef<{
    startX: number;
    startY: number;
    isEdgeStart: boolean;
    didSwipe: boolean;
    startPathname: string;
  } | null>(null);

  useEffect(() => {
    const EDGE_THRESHOLD = 28; // px from left or right screen edge
    const SWIPE_DISTANCE = 55; // px horizontal movement

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const screenWidth = window.innerWidth;
      const isEdgeStart =
        touch.clientX <= EDGE_THRESHOLD || touch.clientX >= screenWidth - EDGE_THRESHOLD;

      touchState.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        isEdgeStart,
        didSwipe: false,
        startPathname: window.location.pathname,
      };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touchState.current || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const dx = touch.clientX - touchState.current.startX;
      const dy = touch.clientY - touchState.current.startY;

      // Only mark as swipe if there is a clear horizontal movement
      if (Math.abs(dx) > 25 && Math.abs(dx) > Math.abs(dy) * 1.3) {
        touchState.current.didSwipe = true;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!touchState.current) return;
      const state = touchState.current;
      const changedTouch = e.changedTouches[0];
      if (!changedTouch) return;

      const dx = changedTouch.clientX - state.startX;
      const dy = changedTouch.clientY - state.startY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      // If user swiped inward from either edge and we are on an internal route
      if (state.isEdgeStart && absDx >= SWIPE_DISTANCE && absDx > absDy * 1.5) {
        const currentPath = window.location.pathname;
        if (currentPath !== '/' && currentPath === state.startPathname) {
          setTimeout(() => {
            if (window.location.pathname === state.startPathname && window.location.pathname !== '/') {
              const segments = state.startPathname.split('/').filter(Boolean);
              if (segments.length > 1) {
                router.replace(`/${segments[0]}`);
              } else {
                router.replace('/');
              }
            }
          }, 80);
        }
      }
    };

    // Only suppress clicks if an actual horizontal swipe gesture occurred
    const onClickCapture = (e: MouseEvent) => {
      if (!touchState.current) return;
      if (touchState.current.didSwipe) {
        e.stopPropagation();
        e.preventDefault();
        touchState.current = null;
      }
    };

    window.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
    window.addEventListener('touchmove', onTouchMove, { capture: true, passive: true });
    window.addEventListener('touchend', onTouchEnd, { capture: true, passive: true });
    window.addEventListener('click', onClickCapture, { capture: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart, { capture: true });
      window.removeEventListener('touchmove', onTouchMove, { capture: true });
      window.removeEventListener('touchend', onTouchEnd, { capture: true });
      window.removeEventListener('click', onClickCapture, { capture: true });
    };
  }, [pathname, router]);

  return null;
}
