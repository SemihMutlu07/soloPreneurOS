import type { UserProfile } from "./types";

const STORAGE_KEY = "solopreneuros-profile";

export function getProfile(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function setProfile(profile: UserProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function hasCompletedOnboarding(): boolean {
  return getProfile() !== null;
}

export function clearProfile(): void {
  localStorage.removeItem(STORAGE_KEY);
}
