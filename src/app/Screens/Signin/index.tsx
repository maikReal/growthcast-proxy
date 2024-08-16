import ScreenLayout from "../layout";
import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/Context/AppContext";
import useLocalStorage from "@/hooks/use-local-storage-state";
import { ScreenState } from "@/Context/AppContext";
import axios from "axios";

import SignInButton from "@/components/SignInButton";
import { Loader } from "@/components/loader";
import { getCurrentFilePath } from "@/utils/helpers";
import { logInfo } from "@/utils/v2/logs/sentryLogger";

const logsFilenamePath = getCurrentFilePath();

const Signin = () => {
  const { screen, setScreen } = useApp();
  const [user, setUser, removeUser] = useLocalStorage("user");
  const [isClient, setIsClient] = useState(false);
  const [isSignInBtnClicked, setIsSignInBtnClicked] = useState(false);
  const [isConnectedWarpcast, setIsConnectedWarpcast] = useState(false);

  const publicDomain = process.env.NEXT_PUBLIC_DOMAIN;

  logInfo(`[DEBUG - ${logsFilenamePath}] Is a user client?: ${isClient}`);
  if (!publicDomain) {
    throw new Error("NEXT_PUBLIC_DOMAIN is not defined in .env");
  }

  useEffect(() => {
    // Identify or create the script element
    let script = document.getElementById(
      "siwn-script"
    ) as HTMLScriptElement | null;

    if (!script) {
      script = document.createElement("script");
      script.id = "siwn-script";
      document.body.appendChild(script);
    }

    // Set attributes and source of the script
    script.src = "https://neynarxyz.github.io/siwn/raw/1.2.0/index.js";
    script.async = true;
    script.defer = true;

    document.body.appendChild(script);

    return () => {
      // Remove the script from the body
      if (script) {
        document.body.removeChild(script);
      }

      // Remove the button if it exists
      let button = document.getElementById("siwn-button");
      if (button && button.parentElement) {
        button.parentElement.removeChild(button);
      }
    };
  }, []);

  const { setSignerUuid, setFid } = useApp();

  useEffect(() => {
    window.onSignInSuccess = async (signinInfo) => {
      setIsConnectedWarpcast(true);

      localStorage.setItem(
        "user",
        JSON.stringify({
          signerUuid: signinInfo.signer_uuid,
          fid: signinInfo.fid,
        })
      );

      setUser({
        signerUuid: signinInfo.signer_uuid,
        fid: signinInfo.fid,
      });

      logInfo(`[DEBUG - ${logsFilenamePath}] Signed in user info: ${user}`);
      setSignerUuid(signinInfo.signer_uuid);
      setFid(signinInfo.fid);

      setScreen(ScreenState.Home);

      // Check if we have info about a user
      const { data } = await axios.get<{ response: boolean }>(
        `/api/v2/is-existing/${signinInfo.fid}`
      );

      logInfo(
        `[DEBUG - ${logsFilenamePath}] Did we fetched user's historical data?: ${data.response}`
      );

      if (data.response) {
        // Update data if we have historical data
        axios.get(`/api/v2/update-fid-history/${signinInfo.fid}`);

        // logInfo(
        //   `[DEBUG - ${logsFilenamePath}] Was user data updated?: ${data.response}`
        // );
      } else {
        // Start fetching historical data
        axios.get(`/api/v2/fetch-fid-history/${signinInfo.fid}`);

        // logInfo(
        //   `[DEBUG - ${logsFilenamePath}] Was user data fetched?: ${data.response}`
        // );
      }

      setTimeout(() => {
        window.location.href = publicDomain;
      }, 6000);
    };

    return () => {
      delete window.onSignInSuccess; // Clean up the global callback
    };
  }, []);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getButton = useCallback(() => {
    const handleClick = () => {
      setIsSignInBtnClicked(true);
    };

    return (
      <button style={{ background: "transparent" }} onClick={handleClick}>
        <SignInButton />
      </button>
    );
  }, []);

  return (
    <ScreenLayout>
      <main className="flex-grow flex flex-col items-center justify-center">
        <div className="mx-5 flex flex-col items-center justify-center">
          <h2 className="text-4xl font-extralight mb-4">
            {isSignInBtnClicked
              ? isConnectedWarpcast
                ? "Linking your Warpcast account with Growthcast"
                : "Login to your Warpcast account on the new tab"
              : isClient && "Connect your Warpcast account"}
          </h2>
          {isSignInBtnClicked ? <Loader /> : getButton()}
        </div>
      </main>
    </ScreenLayout>
  );
};

export default Signin;
