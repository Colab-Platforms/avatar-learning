"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { ConfirmationDialog } from "@/components/ui";
import { useUploadProfileImage } from "@/hooks/mutations/useUploadProfileImage";
import { useRemoveProfileImage } from "@/hooks/mutations/useRemoveProfileImage";
import { toast } from "sonner";
import type { AuthUser } from "@/store/authSlice";

export function ProfileAvatarUpload({ user }: { user: AuthUser }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const uploadMutation = useUploadProfileImage();
  const removeMutation = useRemoveProfileImage();
  const isBusy = uploadMutation.isPending || removeMutation.isPending;

  const openPicker = () => {
    if (isBusy) return;
    inputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    uploadMutation.mutate(file);
  };

  const handleRemoveClick = () => {
    if (isBusy || !user.profileImage) return;
    setShowConfirm(true);
  };

  const handleConfirmRemove = () => {
    removeMutation.mutate(undefined, {
      onSuccess: () => setShowConfirm(false),
      onError: () => setShowConfirm(false),
    });
  };


  return (
    <div className="flex flex-col items-start gap-3">
      <div className="relative group shrink-0">
        <button
          type="button"
          onClick={openPicker}
          disabled={isBusy}
          className={cn(
            "relative block rounded-2xl border-4 border-white shadow-md overflow-hidden transition-transform duration-200",
            !isBusy && "hover:scale-[1.02] active:scale-[0.98]",
            isBusy && "opacity-80 cursor-wait",
          )}
          aria-label={
            user.profileImage ? "Change profile photo" : "Upload profile photo"
          }
        >
          <UserAvatar
            profileImage={user.profileImage}
            firstName={user.firstName}
            lastName={user.lastName}
            email={user.email}
            size="xl"
            rounded="2xl"
            showSkeleton
            className="border-0"
          />

          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity duration-200",
              !isBusy && "group-hover:opacity-100",
              isBusy && "opacity-100",
            )}
          >
            {isBusy ? (
              <Loader2 className="h-5 w-5 animate-spin text-white" />
            ) : (
              <Camera className="h-5 w-5 text-white" />
            )}
          </div>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-1">
        <button
          type="button"
          onClick={openPicker}
          disabled={isBusy}
          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-2 text-[12px] font-semibold text-brand-700 transition-all duration-200 hover:bg-brand-100 active:scale-[0.97] disabled:opacity-60 cursor-pointer"
        >
          {uploadMutation.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Camera className="h-3.5 w-3.5" />
          )}
          {user.profileImage ? "Replace photo" : "Upload photo"}
        </button>

        {user.profileImage && (
          <button
            type="button"
            onClick={handleRemoveClick}
            disabled={isBusy}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-[12px] font-semibold text-red-600 transition-all duration-200 hover:bg-red-100 active:scale-[0.97] disabled:opacity-60 cursor-pointer"
          >
            {removeMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            Remove
          </button>
        )}
      </div>

      <ConfirmationDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmRemove}
        title="Remove Profile Photo"
        message="Are you sure you want to remove your profile photo? This will delete your current photo and restore the default avatar."
        confirmText="Remove"
        cancelText="Cancel"
        variant="danger"
        isLoading={removeMutation.isPending}
      />
    </div>
  );
}

