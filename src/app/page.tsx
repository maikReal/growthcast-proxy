"use client";
import { ScreenState, useApp } from "@/Context/AppContext";
import Home from "./Screens/Home";
import { getCurrentFilePath } from "@/utils/helpers";
import { logInfo } from "@/utils/v2/logs/sentryLogger";

const logsFilenamePath = getCurrentFilePath();

export default function Index() {
  const { screen } = useApp();
  logInfo(`[DEBUG - ${logsFilenamePath}] Current login app state: ${screen}`);

  if (screen === ScreenState.Home) {
    return <Home />;
  }

  return <></>;
}
