"use client";

import { useState } from "react";
import { BottomNav } from "./BottomNav";
import { usePathname } from "next/navigation";

export function NavigationWrapper() {
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Only show add button functionality on the log page
  const handleAddClick = () => {
    if (pathname === "/") {
      // Dispatch a custom event that the log page can listen to
      window.dispatchEvent(new CustomEvent("openAddModal"));
    }
  };

  return <BottomNav onAddClick={handleAddClick} />;
}
