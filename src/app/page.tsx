"use client";
import { ScreenState, useApp } from "@/Context/AppContext";
import Home from "./Screens/Home";

export default function Index() {
  const { screen } = useApp();
  console.log(`[DEBUG - page.tsx] Current login app state: ${screen}`);

  if (screen === ScreenState.Home) {
    return <Home />;
  }

  return <></>;
}
