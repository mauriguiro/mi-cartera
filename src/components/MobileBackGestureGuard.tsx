'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';

function getParentRoute(pathname: string): string | null {
  if (!pathname || pathname === '/') return null;
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length <= 1) {
    return '/';
  }
  return `/${segments[0]}`;
}

export default function MobileBackGestureGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const touchState = useRef<{
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    isEdgeStart: boolean;
    didSwipe: boolean;
    navigated: boolean;
    startPathname: string;
  } | null>(null);

  useEffect(() => {
    const EDGE_ZONE = 110; // generous left/right zone to account for phone cases and curved edges
    const MIN_SWIPE_X = 35; // minimum horizontal distance in px to trigger back

    const triggerBackIfNeeded = (state: NonNullable<typeof touchState.current>) => {
      if (state.navigated) return;
      const dx = state.lastX - state.startX;
      const dy = state.lastY - state.startY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      const screenWidth = window.innerWidth;
      const isLeftEdgeSwipeRight = state.startX <= EDGE_ZONE && dx >= MIN_SWIPE_X;
      const isRightEdgeSwipeLeft = state.startX >= screenWidth - EDGE_ZONE && dx <= -MIN_SWIPE_X;

      if ((isLeftEdgeSwipeRight || isRightEdgeSwipeLeft) && absDx > absDy * 1.25) {
        const parentRoute = getParentRoute(state.startPathname);
        if (parentRoute) {
          state.navigated = true;
          router.replace(parentRoute);
        }
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      const screenWidth = window.innerWidth;
      const isEdgeStart =
        touch.clientX <= EDGE_ZONE || touch.clientX >= screenWidth - EDGE_ZONE;

      touchState.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        lastX: touch.clientX,
        lastY: touch.clientY,
        isEdgeStart,
        didSwipe: false,
        navigated: false,
        startPathname: window.location.pathname,
      };
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touchState.current || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const state = touchState.current;
      state.lastX = touch.clientX;
      state.lastY = touch.clientY;

      const dx = state.lastX - state.startX;
      const dy = state.lastY - state.startY;

      if (Math.abs(dx) > 18 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        state.didSwipe = true;
      }

      // If user already completed a clear inward swipe from the edge, navigate immediately
      if (state.isEdgeStart && Math.abs(dx) >= 65 && Math.abs(dx) > Math.abs(dy) * 1.4) {
        triggerBackIfNeeded(state);
      }
    };

    const onTouchEndOrCancel = (e: TouchEvent) => {
      if (!touchState.current) return;
      const state = touchState.current;
      if (e.changedTouches && e.changedTouches.length > 0) {
        state.lastX = e.changedTouches[0].clientX;
        state.lastY = e.changedTouches[0].clientY;
      }
      triggerBackIfNeeded(state);
    };

    const onClickCapture = (e: MouseEvent) => {
      if (!touchState.current) return;
      if (touchState.current.didSwipe || touchState.current.navigated) {
        e.stopPropagation();
        e.preventDefault();
        touchState.current = null;
      }
    };

    window.addEventListener('touchstart', onTouchStart, { capture: true, passive: true });
    window.addEventListener('touchmove', onTouchMove, { capture: true, passive: true });
    window.addEventListener('touchend', onTouchEndOrCancel, { capture: true, passive: true });
    window.addEventListener('touchcancel', onTouchEndOrCancel, { capture: true, passive: true });
    window.addEventListener('click', onClickCapture, { capture: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart, { capture: true });
      window.removeEventListener('touchmove', onTouchMove, { capture: true });
      window.removeEventListener('touchend', onTouchEndOrCancel, { capture: true });
      window.removeEventListener('touchcancel', onTouchEndOrCancel, { capture: true });
      window.removeEventListener('click', onClickCapture, { capture: true });
    };
  }, [pathname, router]);

  return null;
}
