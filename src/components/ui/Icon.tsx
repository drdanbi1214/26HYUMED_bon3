import React from "react";

interface IconProps {
  children: React.ReactNode;
  size?: number;
  weight?: number;
  className?: string;
}

/**
 * 공용 SVG 아이콘 래퍼. <path>, <circle>, <line> 등을 children으로 넘김.
 *
 * <Icon><path d="..." /></Icon>
 */
export const Icon: React.FC<IconProps> = ({ children, size = 18, weight = 2, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={weight}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
);
