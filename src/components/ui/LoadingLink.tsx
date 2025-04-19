"use client";

import React from "react";
import Link from "next/link";
import { useLoading } from "@/context/loadingContext";

type LoadingLinkProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  activeClassName?: string;
  isActive?: boolean;
  delay?: number; // Optional delay in ms
};

export default function LoadingLink({
  href,
  children,
  className,
  activeClassName,
  isActive,
  delay = 100,
  ...props
}: LoadingLinkProps & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const { setIsLoading } = useLoading();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Don't trigger loading for external links or anchor links
    if (href.startsWith("http") || href.startsWith("#")) {
      return;
    }
    
    // Don't trigger loading if the user is pressing modifier keys (opening in new tab, etc.)
    if (e.metaKey || e.ctrlKey || e.shiftKey) {
      return;
    }
    
    // Start loading animation
    setIsLoading(true);
    
    // Add an artificial delay if specified
    if (delay > 0) {
      setTimeout(() => {}, delay);
    }
  };
  
  const combinedClassName = `${className || ""} ${isActive ? activeClassName || "" : ""}`.trim();

  return (
    <Link 
      href={href} 
      className={combinedClassName || undefined}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Link>
  );
} 