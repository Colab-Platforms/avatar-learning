export const PROFILE_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024;

export const PROFILE_IMAGE_ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export function validateProfileImageFile(file: File): string | null {
  if (
    !PROFILE_IMAGE_ALLOWED_TYPES.includes(
      file.type as (typeof PROFILE_IMAGE_ALLOWED_TYPES)[number],
    )
  ) {
    return "Unsupported file type. Allowed formats: JPG, JPEG, PNG, WEBP";
  }

  if (file.size > PROFILE_IMAGE_MAX_SIZE_BYTES) {
    return "File too large. Maximum size is 5MB";
  }

  return null;
}
