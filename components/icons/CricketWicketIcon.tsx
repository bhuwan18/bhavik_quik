import type { SVGProps } from "react";

export default function CricketWicketIcon({
  size = 24,
  className,
  strokeWidth = 2,
  ...props
}: SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      <path d="m6 2 4 2" />
      <path d="m14 3 4-1" />
      <circle cx="12" cy="13" r="2" />
      <path d="M6 7v15" />
      <path d="m13 7-.3 4.1" />
      <path d="M12.5 14.9 12 22" />
      <path d="M18 7v15" />
    </svg>
  );
}
