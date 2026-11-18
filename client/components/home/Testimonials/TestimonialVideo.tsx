"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Loader2, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface TestimonialVideoProps {
  thumbnail: string;
  videoUrl: string;
  name: string;
  role: string;
  isActive: boolean;
  isVideoOpen: boolean;
  onVideoOpen: () => void;
  onVideoClose: () => void;
  className?: string;
}

export function TestimonialVideo({
  thumbnail,
  videoUrl,
  name,
  role,
  isActive,
  isVideoOpen,
  onVideoOpen,
  onVideoClose,
  className,
}: TestimonialVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const resetVideo = useCallback(() => {
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
    setIsPaused(false);
    setIsPlaying(false);
    onVideoClose();
  }, [onVideoClose]);

  useEffect(() => {
    if (!isActive) {
      resetVideo();
    }
  }, [isActive, resetVideo]);

  useEffect(() => {
    if (!isVideoOpen || !isActive) {
      setIsPlaying(false);
    }
  }, [isVideoOpen, isActive]);

  const attemptPlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (video.ended) {
        video.currentTime = 0;
      }
      await video.play();
      setIsPaused(false);
    } catch {
      setIsPaused(true);
    }
  }, []);

  useEffect(() => {
    if (!isVideoOpen || !isActive) return;

    const video = videoRef.current;
    if (!video) return;

    void video.play().catch(() => setIsPaused(true));
  }, [isVideoOpen, isActive]);

  const handlePlayClick = () => {
    if (!isVideoOpen) {
      onVideoOpen();
    } else {
      void attemptPlay();
    }
  };

  const handleVideoToggle = (event: React.MouseEvent) => {
    event.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.paused || video.ended) {
      if (video.ended) {
        video.currentTime = 0;
      }
      void video
        .play()
        .then(() => {
          setIsPaused(false);
        })
        .catch(() => {
          setIsPaused(true);
        });
    } else {
      video.pause();
      setIsPaused(true);
    }
  };

  const showThumbnail = !isVideoOpen || !isPlaying;

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl bg-black aspect-video",
        className,
      )}
    >
      {/* Thumbnail stays visible until the video is actually playing */}
      <motion.div
        aria-hidden={!showThumbnail}
        initial={false}
        animate={{ opacity: showThumbnail ? 1 : 0 }}
        transition={{ duration: 0.25 }}
        className={cn(
          "absolute inset-0 z-10",
          showThumbnail ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <Image
          src={thumbnail}
          alt={`${name}, ${role}`}
          fill
          sizes="(max-width: 768px) 100vw, 55vw"
          className="object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent pointer-events-none" />

        <div className="absolute bottom-4 left-4 right-4 z-10 pointer-events-none lg:hidden">
          <p className="text-sm font-bold uppercase tracking-wide text-white underline decoration-white/40 underline-offset-4">
            {name}
          </p>
          <p className="mt-1 text-xs text-white/85">{role}</p>
        </div>

        <div className="absolute bottom-5 left-5 z-10 hidden lg:block pointer-events-none">
          <p className="text-sm font-bold uppercase tracking-wide text-white">
            {name}
          </p>
          <p className="mt-0.5 text-xs text-white/85">{role}</p>
        </div>

        {!isVideoOpen && (
          <button
            type="button"
            onClick={handlePlayClick}
            className="absolute inset-0 z-20 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-inset"
            aria-label={`Watch ${name}'s story`}
          >
            <motion.span
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="group flex items-center gap-2.5 rounded-full border border-white/30 bg-white/75 px-4 py-2.5 text-sm font-semibold text-text shadow-lg backdrop-blur-md transition-colors duration-200 hover:bg-white sm:px-5 sm:py-3"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-text text-white transition-transform duration-200 group-hover:scale-105">
                <Play className="h-3.5 w-3.5 fill-current ml-0.5" />
              </span>
              Watch story
            </motion.span>
          </button>
        )}

        {isVideoOpen && !isPlaying && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20">
            <Loader2 className="h-8 w-8 animate-spin text-white" aria-hidden />
            <span className="sr-only">Loading video</span>
          </div>
        )}
      </motion.div>

      {isVideoOpen && isActive && (
        <video
          ref={videoRef}
          src={videoUrl}
          className="absolute inset-0 h-full w-full object-contain bg-black"
          playsInline
          autoPlay
          controls={false}
          controlsList="nodownload noplaybackrate noremoteplayback"
          disablePictureInPicture
          preload="auto"
          title={`${name} — success story`}
          onLoadedData={() => {
            void attemptPlay();
          }}
          onCanPlay={() => {
            void attemptPlay();
          }}
          onPlaying={() => {
            setIsPlaying(true);
            setIsPaused(false);
          }}
          onClick={handleVideoToggle}
          onPlay={() => setIsPaused(false)}
          onPause={() => setIsPaused(true)}
          onEnded={() => {
            setIsPaused(true);
          }}
          aria-label={`Video testimonial from ${name}`}
        />
      )}

      {isVideoOpen && isPlaying && (
        <>
          {/* Central play overlay when paused/ended */}
          <div
            onClick={handleVideoToggle}
            className={cn(
              "absolute inset-0 z-20 flex items-center justify-center bg-black/35 transition-all duration-300 cursor-pointer",
              isPaused ? "opacity-100" : "opacity-0 pointer-events-none",
            )}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{
                scale: isPaused ? 1 : 0.9,
                opacity: isPaused ? 1 : 0,
              }}
              transition={{ duration: 0.2 }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-text shadow-xl backdrop-blur-xs hover:bg-white hover:scale-110 active:scale-95 transition-all duration-200"
            >
              <Play className="h-6 w-6 fill-current ml-1 text-brand-600" />
            </motion.div>
          </div>

          {/* Bottom-right play/pause control */}
          {/* <button
            type="button"
            onClick={handleVideoToggle}
            className="absolute bottom-4 right-4 z-25 flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white backdrop-blur-sm transition-all duration-200 hover:bg-black/70 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
            aria-label={isPaused ? "Play video" : "Pause video"}
          >
            {isPaused ? (
              <Play className="h-5 w-5 fill-current ml-0.5" />
            ) : (
              <Pause className="h-5 w-5 fill-current" />
            )}
          </button> */}
        </>
      )}
    </div>
  );
}
