"use client";

import { Logo } from "@/components/icons/Growthcast";
import Link from "next/link";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

const ScreenLayout = ({ children }: Props) => {
  return (
    <div className="flex flex-col min-h-screen text-white">
      <header className="flex justify-center items-center m-10">
        <div className="flex items-center">
          <Logo />
        </div>
      </header>
      {children}
    </div>
  );
};

export default ScreenLayout;
