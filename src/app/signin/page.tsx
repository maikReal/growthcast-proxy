"use client";
import { useApp } from "@/Context/AppContext";
import Signin from "../Screens/Signin";
import useLocalStorage from "@/hooks/use-local-storage-state";
import { UserInfo } from "@/types";

export default function MySignIn() {
  const { screen } = useApp();
  console.log(`[AUTH_WEB] Current state: ${screen}`);
  const [user, _1, removeUser] = useLocalStorage<UserInfo>("user");

  if (user) {
    removeUser();
  }

  return <Signin />;
}
