"use client";
import ScreenLayout from "../layout";
import { useApp } from "@/Context/AppContext";

const Home = () => {
  const { displayName, pfp } = useApp();

  return (
    <ScreenLayout>
      <main className="flex flex-col flex-grow justify-center items-center">
        {displayName && pfp ? (
          <>
            <p className="text-3xl">
              Welcome to WarpDrive{" "}
              {displayName && (
                <span className="font-medium">{displayName}</span>
              )}
              ... 🚀
            </p>
          </>
        ) : (
          <p>Just a second...</p>
        )}
      </main>
    </ScreenLayout>
  );
};

export default Home;
