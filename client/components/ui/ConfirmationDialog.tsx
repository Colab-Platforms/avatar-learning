"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Trash2, LogOut, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "brand";
  isLoading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "brand",
  isLoading = false,
}: ConfirmationDialogProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, isLoading]);

  // Prevent scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleConfirm = async () => {
    await onConfirm();
  };

  // Determine Icon based on variant
  const getIcon = () => {
    switch (variant) {
      case "danger":
        return (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 border border-red-200 text-red-600">
            <Trash2 className="h-6 w-6" />
          </div>
        );
      case "warning":
        return (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 border border-amber-200 text-amber-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
        );
      case "brand":
      default:
        return (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 border border-brand-200 text-brand-600">
            <LogOut className="h-6 w-6" />
          </div>
        );
    }
  };

  // Button styles based on variant
  const getConfirmButtonClasses = () => {
    switch (variant) {
      case "danger":
        return "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500 shadow-sm shadow-red-200 hover:shadow-md";
      case "warning":
        return "bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-500 shadow-sm shadow-amber-200 hover:shadow-md";
      case "brand":
      default:
        return "bg-brand-500 hover:bg-brand-600 text-white focus:ring-brand-500 shadow-sm shadow-brand-200 hover:shadow-md";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            onClick={() => {
              if (!isLoading) onClose();
            }}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{
              type: "spring",
              duration: 0.35,
              bounce: 0.15,
            }}
            ref={modalRef}
            className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-[0_20px_50px_rgba(15,23,42,0.15)] z-10 flex flex-col items-center text-center"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            {/* Close Button */}
            {!isLoading && (
              <button
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 rounded-lg p-1 text-text-subtle hover:bg-surface-alt hover:text-text transition-colors duration-150"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* Accent Icon */}
            <div className="mb-4 mt-2">{getIcon()}</div>

            {/* Title */}
            <h3
              id="modal-title"
              className="text-[17px] font-semibold text-text tracking-tight mb-2 px-1"
            >
              {title}
            </h3>

            {/* Message Description */}
            <p className="text-[13px] text-text-muted leading-relaxed mb-6 px-2">
              {message}
            </p>

            {/* Action Buttons */}
            <div className="flex w-full items-center gap-3">
              <button
                type="button"
                disabled={isLoading}
                onClick={onClose}
                className="flex-1 inline-flex items-center justify-center rounded-xl border border-border bg-white px-4 py-2.5 text-[13px] font-semibold text-text-muted hover:bg-surface-alt active:scale-[0.98] transition-all duration-150 disabled:opacity-50 select-none cursor-pointer"
              >
                {cancelText}
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={handleConfirm}
                className={cn(
                  "flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] font-semibold transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-75 select-none cursor-pointer",
                  getConfirmButtonClasses()
                )}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Processing…</span>
                  </>
                ) : (
                  <span>{confirmText}</span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
