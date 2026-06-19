"use client";

import { AnimatePresence, motion } from "framer-motion";
import React, { useState, useEffect } from "react";
import "swiper/css";
import "swiper/css/effect-creative";
import "swiper/css/pagination";
import "swiper/css/autoplay";

import { cn } from "@/lib/utils";

const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<"mobile" | "smallTablet" | "largeTablet" | "desktop">(() => {
    // Initialize with correct value on mount to prevent flash
    if (typeof window === "undefined") return "desktop"; // SSR fallback
    const width = window.innerWidth;
    if (width < 768) return "mobile";
    if (width < 900) return "smallTablet";
    if (width < 1280) return "largeTablet";
    return "desktop";
  });

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setBreakpoint("mobile");
      } else if (width < 900) {
        setBreakpoint("smallTablet");
      } else if (width < 1280) {
        setBreakpoint("largeTablet");
      } else {
        setBreakpoint("desktop");
      }
    };

    // No need to call checkBreakpoint() immediately since state is initialized correctly
    window.addEventListener("resize", checkBreakpoint);
    return () => window.removeEventListener("resize", checkBreakpoint);
  }, []);

  return breakpoint;
};

const HoverExpand_001 = ({
  images,
  className,
}: {
  images: { src: string; alt: string; code: string }[];
  className?: string;
}) => {
  const [activeImage, setActiveImage] = useState<number | null>(1);
  const breakpoint = useBreakpoint();

  // Responsive configuration based on breakpoint
  const config = {
    mobile: {
      layout: "list" as const,
      numVisible: images.length,
      height: "min(20rem, 40vh)",
      padding: "px-0",
    },
    smallTablet: {
      layout: "horizontal" as const,
      numVisible: 3,
      expandedPercent: 50,
      collapsedPercent: 25,
      height: "min(24rem, 45vh)",
      gap: "gap-2",
      padding: "px-0",
    },
    largeTablet: {
      layout: "horizontal" as const,
      numVisible: 4,
      expandedPercent: 46,
      collapsedPercent: 18,
      height: "min(28rem, 50vh)",
      gap: "gap-3",
      padding: "px-0",
    },
    desktop: {
      layout: "horizontal" as const,
      numVisible: 6,
      expandedWidth: "27.65625rem", // 442px - original fixed size
      collapsedWidth: "9.21875rem", // 147px - original fixed size
      height: "min(36.875rem, 60vh)",
      gap: "gap-5",
      padding: "px-0",
      maxWidth: "max-w-[1200px]",
    },
  }[breakpoint];

  // Mobile: Vertical list layout
  if (config.layout === "list") {
    return (
      <motion.div
        initial={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        className={cn("relative w-full", config.padding, className)}
      >
        <div className="flex flex-col gap-4 w-full">
          {images.map((image, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, translateY: 10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              className="relative w-full overflow-hidden rounded-2xl"
              style={{ height: config.height }}
              onClick={() => setActiveImage(index)}
            >
              <img src={image.src} className="size-full object-cover" alt={image.alt} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              <div className="absolute bottom-4 left-4 right-4">
                <p className="text-sm text-white/90 font-medium">{image.code}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  // Horizontal layout for tablets and desktop
  return (
    <motion.div
      initial={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ duration: 0.3, delay: 0.5 }}
      className={cn("relative w-full", config.padding, className)}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={cn("w-full mx-auto", "maxWidth" in config ? config.maxWidth : "")}
      >
        <div className={cn("flex w-full items-center justify-center", config.gap)}>
          {images.slice(0, config.numVisible).map((image, index) => {
            const isActive = activeImage === index;

            // Desktop uses fixed widths, tablets use percentages
            const width =
              "expandedWidth" in config
                ? isActive
                  ? config.expandedWidth
                  : config.collapsedWidth
                : isActive
                  ? `${config.expandedPercent}%`
                  : `${config.collapsedPercent}%`;

            const initialWidth = "expandedWidth" in config ? config.collapsedWidth : `${config.collapsedPercent}%`;

            return (
              <motion.div
                key={index}
                className="relative cursor-pointer overflow-hidden rounded-3xl"
                initial={{ width: initialWidth, height: "20rem" }}
                animate={{ width, height: config.height }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                onClick={() => setActiveImage(index)}
                onHoverStart={() => setActiveImage(index)}
              >
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute h-full w-full bg-gradient-to-t from-black/40 to-transparent"
                    />
                  )}
                </AnimatePresence>
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute flex h-full w-full flex-col items-end justify-end p-4"
                    >
                      <p className="text-left text-xs text-white/50">{image.code}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
                <img src={image.src} className="size-full object-cover" alt={image.alt} />
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};

export { HoverExpand_001 };
