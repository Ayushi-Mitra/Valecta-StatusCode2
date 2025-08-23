"use client";

import React from "react";
import LineBackground from "@/components/ui/LineBackground";
import { usePathname } from "next/navigation";

export default function LayoutWithBackground({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  return (
    <>
      {!isLanding && <LineBackground />}
      {children}
    </>
  );
}
