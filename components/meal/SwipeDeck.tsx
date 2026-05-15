"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  motion,
  useAnimation,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "framer-motion";

import type { MealFeedItem } from "../../types";
import MealCard from "./MealCard";

type SwipeDirection = "left" | "right";

type SwipeDeckProps = {
  meals: MealFeedItem[];
  pendingSwipe?: SwipeDirection | null;
  onSwipe: (meal: MealFeedItem, direction: SwipeDirection) => void;
  onPendingHandled?: () => void;
};

export default function SwipeDeck({
  meals,
  pendingSwipe,
  onSwipe,
  onPendingHandled,
}: SwipeDeckProps) {
  const [front, second] = meals;
  const controls = useAnimation();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-300, 300], [-15, 15]);
  const rightOverlay = useTransform(x, [60, 120], [0, 0.8]);
  const leftOverlay = useTransform(x, [-120, -60], [0.8, 0]);
  const rightBadge = useTransform(x, [80, 140], [0, 1]);
  const leftBadge = useTransform(x, [-140, -80], [1, 0]);
  const rightIconScale = useTransform(x, [80, 140], [0.8, 1.2]);
  const leftIconScale = useTransform(x, [-140, -80], [1.2, 0.8]);
  const hintOpacity = useTransform(x, [-50, 0, 50], [0, 0.6, 0]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [flashRight, setFlashRight] = useState(false);
  const [flashLeft, setFlashLeft] = useState(false);

  const frontId = front?.id;

  const triggerSwipe = useCallback(
    async (direction: SwipeDirection) => {
      if (!front || isAnimating) return;
      setIsAnimating(true);

      if (direction === "right") {
        setFlashRight(true);
        window.setTimeout(() => setFlashRight(false), 300);
      } else {
        setFlashLeft(true);
        window.setTimeout(() => setFlashLeft(false), 300);
      }

      await controls.start({
        x: direction === "right" ? 600 : -600,
        rotate: direction === "right" ? 20 : -20,
        opacity: 0,
        transition: { duration: 0.35, ease: "easeOut" },
      });

      onSwipe(front, direction);

      controls.set({ x: 0, rotate: 0, opacity: 1 });
      x.set(0);
      setIsAnimating(false);
      onPendingHandled?.();
    },
    [controls, front, isAnimating, onPendingHandled, onSwipe, x],
  );

  useEffect(() => {
    if (pendingSwipe && frontId && !isAnimating) {
      triggerSwipe(pendingSwipe);
    }
  }, [pendingSwipe, frontId, isAnimating, triggerSwipe]);

  useEffect(() => {
    controls.set({ x: 0, rotate: 0, opacity: 1 });
    x.set(0);
  }, [frontId, controls, x]);

  const overlayBadgeClass = useMemo(
    () =>
      "absolute top-6 rounded-full border-2 px-6 py-3 font-display text-2xl italic font-bold shadow-lg",
    [],
  );

  return (
    <div className="relative h-[520px] w-full">
      {second ? (
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 0.94, y: 14, opacity: 0.55 }}
          animate={{ scale: 0.94, y: 14, opacity: 0.55 }}
        >
          <MealCard meal={second} />
        </motion.div>
      ) : null}

      {front ? (
        <motion.div
          key={front.id}
          className="absolute inset-0"
          drag={isAnimating ? false : "x"}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          dragMomentum={false}
          onDragEnd={(_, info) => {
            if (info.offset.x > 100) {
              triggerSwipe("right");
            } else if (info.offset.x < -100) {
              triggerSwipe("left");
            } else {
              controls.start({
                x: 0,
                rotate: 0,
                transition: { type: "spring", stiffness: 400, damping: 30 },
              });
            }
          }}
          style={{ x, rotate }}
          animate={controls}
          whileTap={{ scale: 0.98 }}
        >
          <div className="relative h-full">
            <MealCard meal={front} />
            
            {/* Swipe overlays */}
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-card"
              style={{ opacity: rightOverlay, backgroundColor: "#EAF5EE" }}
            />
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-card"
              style={{ opacity: leftOverlay, backgroundColor: "#EDEAE4" }}
            />
            
            {/* Action badges */}
            <motion.div
              className={`${overlayBadgeClass} left-6 -rotate-12 border-green bg-white/95 text-green shadow-xl`}
              style={{ opacity: rightBadge, scale: rightIconScale }}
            >
              <span className="flex items-center gap-2">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Save
              </span>
            </motion.div>
            <motion.div
              className={`${overlayBadgeClass} right-6 rotate-12 border-border-strong bg-white/95 text-text-secondary shadow-xl`}
              style={{ opacity: leftBadge, scale: leftIconScale }}
            >
              <span className="flex items-center gap-2">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Skip
              </span>
            </motion.div>
            
            {/* Flash effects */}
            <AnimatePresence>
              {flashRight ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="pointer-events-none absolute inset-0 rounded-card bg-green/20"
                />
              ) : null}
              {flashLeft ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="pointer-events-none absolute inset-0 rounded-card bg-red/10"
                />
              ) : null}
            </AnimatePresence>

            {/* Large swipe hint overlay */}
            <motion.div
              className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-8"
              style={{ opacity: hintOpacity }}
            >
              <p className="text-xs font-medium text-text-secondary">
                Swipe to decide
              </p>
            </motion.div>
          </div>
        </motion.div>
      ) : (
        <div className="flex h-full items-center justify-center rounded-card border border-dashed border-border bg-surface-2 text-sm text-text-tertiary">
          Finding your next meal...
        </div>
      )}
    </div>
  );
}