import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const COLORS = ["#DC2626", "#D97706", "#059669", "#7C3AED", "#DB2777"];

export function connectionIdToColor(connectionId: number): string {
  return COLORS[connectionId % COLORS.length];
}
export function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "비밀번호는 최소 8자 이상이어야 합니다.";
  }
  if (!/[A-Z]/.test(password)) {
    return "비밀번호에는 최소 하나의 대문자가 포함되어야 합니다.";
  }
  if (!/[a-z]/.test(password)) {
    return "비밀번호에는 최소 하나의 소문자가 포함되어야 합니다.";
  }
  if (!/[0-9]/.test(password)) {
    return "비밀번호에는 최소 하나의 숫자가 포함되어야 합니다.";
  }
  return null;
}
