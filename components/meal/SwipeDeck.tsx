"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  motion,
  useAnimation,
  useMotionValue,
  useTransform,
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
  const rightOverlay = useTransform(x, [60, 120], [0, 0.7]);
  const leftOverlay = useTransform(x, [-120, -60], [0.7, 0]);
  const rightBadge = useTransform(x, [80, 140], [0, 1]);
  const leftBadge = useTransform(x, [-140, -80], [1, 0]);
  const [isAnimating, setIsAnimating] = useState(false);
  const [flashRight, setFlashRight] = useState(false);

  const triggerSwipe = useCallback(
    async (direction: SwipeDirection) => {
      if (!front || isAnimating) return;
      setIsAnimating(true);

      if (direction === "right") {
        setFlashRight(true);
        window.setTimeout(() => setFlashRight(false), 200);
      }

      await controls.start({
        x: direction === "right" ? 600 : -600,
        rotate: direction === "right" ? 20 : -20,
        opacity: 0,
        transition: { duration: 0.3 },
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
    if (pendingSwipe && front && !isAnimating) {
      triggerSwipe(pendingSwipe);
    }
  }, [pendingSwipe, front, isAnimating, triggerSwipe]);

  useEffect(() => {
    controls.set({ x: 0, rotate: 0, opacity: 1 });
    x.set(0);
  }, [front?.id, controls, x]);

  const overlayBadgeClass = useMemo(
    () =>
      "absolute top-5 rounded-full border-2 px-4 py-2 font-display text-xl italic",
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
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.x > 120) {
              triggerSwipe("right");
            } else if (info.offset.x < -120) {
              triggerSwipe("left");
            } else {
              controls.start({
                x: 0,
                rotate: 0,
                transition: { type: "spring", stiffness: 300, damping: 25 },
              });
            }
          }}
          style={{ x, rotate }}
          animate={controls}
        >
          <div className="relative h-full">
            <MealCard meal={front} />
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-card"
              style={{ opacity: rightOverlay, backgroundColor: "#EAF5EE" }}
            />
            <motion.div
              className="pointer-events-none absolute inset-0 rounded-card"
              style={{ opacity: leftOverlay, backgroundColor: "#EDEAE4" }}
            />
            <motion.div
              className={`${overlayBadgeClass} left-5 -rotate-12 border-green text-green`}
              style={{ opacity: rightBadge }}
            >
              Cook this 🍳
            </motion.div>
            <motion.div
              className={`${overlayBadgeClass} right-5 rotate-12 border-border-strong text-text-secondary`}
              style={{ opacity: leftBadge }}
            >
              Skip
            </motion.div>
            {flashRight ? (
              <div
                className="pointer-events-none absolute inset-0 rounded-card"
                style={{ backgroundColor: "rgba(234, 245, 238, 0.7)" }}
              />
            ) : null}
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
