"use client";
import Button from "@/components/Button";
import ScreenLayout from "../layout";
import { useApp } from "@/Context/AppContext";

const Home = () => {
  const { displayName, pfp } = useApp();

  return (
    <ScreenLayout>
      <main className="flex flex-col flex-grow justify-center items-center gap-y-[25px]">
        {displayName && pfp ? (
          <>
            <p className="text-3xl">
              Welcome to WarpDrive{" "}
              {displayName && (
                <span className="font-medium">{displayName}</span>
              )}
              ... 🚀
            </p>
            <Button
              title="Open Warpcast"
              onClick={() => {
                location.href = `https://warpcast.com/`;
              }}
            />
          </>
        ) : (
          <p>Just a second...</p>
        )}
      </main>
    </ScreenLayout>
  );
};

export default Home;
