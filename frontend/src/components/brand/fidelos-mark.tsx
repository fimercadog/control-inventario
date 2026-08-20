import { cn } from "@/lib/utils";

export function FidelOSMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={cn("shrink-0", className)} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="16" fill="currentColor" />
      <path d="M18 14H48V24H30V31H45V41H30V56H18V14Z" fill="white" />
      <path d="M39 41H48V50H39V41Z" fill="#C7D2FE" />
    </svg>
  );
}
