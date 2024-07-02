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
      {/* <footer className="flex flex-col justify-center items-center gap-y-6 text-center p-4">
        The best tool to imrpove your Warpcast account
        <Link href="https://warpcast.com/growthcast" target="_blank">
          Follow us on <span className="font-bold">Warpcast</span>
        </Link>
      </footer> */}
    </div>
  );
};

export default ScreenLayout;
