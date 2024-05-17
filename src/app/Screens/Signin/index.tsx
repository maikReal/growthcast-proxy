import ScreenLayout from "../layout";
import { useCallback, useEffect, useState } from "react";
import { useApp } from "@/Context/AppContext";
import useLocalStorage from "@/hooks/use-local-storage-state";
import { ScreenState } from "@/Context/AppContext";

import SignInButton from "@/components/SignInButton";

const Signin = () => {
  const { screen, setScreen } = useApp();
  const [user, setUser, removeUser] = useLocalStorage("user");
  const [isClient, setIsClient] = useState(false);

  const publicDomain = process.env.NEXT_PUBLIC_DOMAIN;

  console.log("Public domain: ", publicDomain);
  console.log("Is client: ", isClient);
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
    window.onSignInSuccess = (data) => {
      // console.log("[DEBUG - Screens/Signin] User's auth data: ", {
      //   signerUuid: data.signer_uuid,
      //   fid: data.fid,
      // });

      localStorage.setItem(
        "user",
        JSON.stringify({
          signerUuid: data.signer_uuid,
          fid: data.fid,
        })
      );

      setUser({
        signerUuid: data.signer_uuid,
        fid: data.fid,
      });

      console.log("User", user);
      setSignerUuid(data.signer_uuid);
      setFid(data.fid);

      setScreen(ScreenState.Home);

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
    return <SignInButton />;
  }, []);

  return (
    <ScreenLayout>
      <main className="flex-grow flex flex-col items-center justify-center">
        <div className="mx-5 flex flex-col items-center justify-center">
          <h2 className="text-4xl font-extralight mb-4">
            {isClient && "Connect your Warpcast account"}
          </h2>
          {getButton()}
        </div>
      </main>
    </ScreenLayout>
  );
};

export default Signin;
