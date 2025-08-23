"use client";

import React from "react";

import { usePathname } from "next/navigation";

export default function LayoutWithBackground({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  return (
    <>
      {children}
    </>
  );
}
