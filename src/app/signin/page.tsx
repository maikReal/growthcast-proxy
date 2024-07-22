"use client";
import { useApp } from "@/Context/AppContext";
import Signin from "../Screens/Signin";
import useLocalStorage from "@/hooks/use-local-storage-state";
import { UserInfo } from "@/types";
import { getCurrentFilePath } from "@/utils/helpers";
import { logInfo } from "@/utils/v2/logs/sentryLogger";

const logsFilenamePath = getCurrentFilePath();

export default function MySignIn() {
  const { screen } = useApp();
  logInfo(`[DEBUG - ${logsFilenamePath}] Current login app state: ${screen}`);
  const [user, _1, removeUser] = useLocalStorage<UserInfo>("user");

  if (user) {
    removeUser();
  }

  return <Signin />;
}
