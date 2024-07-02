/* eslint-disable react/jsx-key */
import { Button } from "frames.js/next";
import { frames } from "./frames";
import { NextRequest } from "next/server";
import { getUserDataForFid } from "frames.js";
import axios from "axios";

const startTrackUser = async (fid: string) => {
  let { data } = await axios.get(
    `${process.env.NEXT_PUBLIC_DOMAIN}/api/webhook/start-tracking-fid/${fid}`,
    {
      headers: {
        Origin: process.env.NEXT_PUBLIC_DOMAIN,
      },
    }
  );
};

const calcualteStreaks = async (fid: string) => {
  let { data } = await axios.get(
    `${process.env.NEXT_PUBLIC_DOMAIN}/api/webhook/get-fid-streaks/${fid}`,
    {
      headers: {
        Origin: process.env.NEXT_PUBLIC_DOMAIN,
      },
    }
  );

  return data;
};

const handleRequest = async (
  req: NextRequest,
  { params: urlParams }: { params: any }
) => {
  console.log("[DEBUG - frames/route.tsx] User URL params:", urlParams);
  return await frames(async (ctx) => {
    const baseUrl = process.env.NEXT_PUBLIC_DOMAIN || "";

    const message = ctx.message;

    let fid = null;
    let username = null;
    let streaks = null;
    let isEmptyState = null;

    if (urlParams) {
      // get username and info => render image
      // return frame
      fid = urlParams?.userFid;
      username = (await getUserDataForFid({ fid }))?.username;
    }

    if (message) {
      username = message?.requesterUserData?.username;
      fid = message?.requesterFid;
    }

    console.log("[DEBUG - frames/route.tsx] User FID: ", fid);
    if (fid) {
      try {
        await startTrackUser(fid);

        streaks = await calcualteStreaks(fid);

        console.log("[DEBUG - frames/route.tsx] User streaks: ", streaks);

        isEmptyState = "non-empty";
      } catch (error) {
        console.error(
          "[ERROR - frames/route.tsx] Error during the fetching info about fid casts",
          error
        );
        isEmptyState = "empty";

        return {
          image: `${baseUrl}/api/frame/image?state=${isEmptyState}&username=${username}&streaks=${streaks}`,
          buttons: [
            <Button
              action="post"
              target={{ query: { username: username, streaks: streaks } }}
            >
              Get my streaks
            </Button>,
          ],
        };
      }
    } else {
      isEmptyState = "empty";

      return {
        image: `${baseUrl}/api/frame/image?state=${isEmptyState}&username=${username}&streaks=${streaks}`,
        buttons: [
          <Button
            action="post"
            target={{ query: { username: username, streaks: streaks } }}
          >
            Get my streaks
          </Button>,
        ],
      };
    }

    return {
      image: `${baseUrl}/api/frame/image?state=${isEmptyState}&username=${username}&streaks=${streaks}`,
      buttons: [
        <Button
          action="post"
          target={{ query: { username: username, streaks: streaks } }}
        >
          Get my streaks
        </Button>,
        <Button
          action="link"
          target={`https://warpcast.com/~/compose?${new URLSearchParams({
            text: `send it higher ↑\n\nhow high is your cast streak?`,
            "embeds[]": `${process.env.NEXT_PUBLIC_DOMAIN}/frames/streaks/${fid}`,
          }).toString()}`}
        >
          Share
        </Button>,
      ],
    };
  })(req);
};

export const GET = handleRequest;
export const POST = handleRequest;
