import sharp from "sharp";
import satori from "satori";
import { join } from "path";
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import { StreaksFrameImage } from "@/components/Frame/streaks";

const fontPath = join(process.cwd(), "public/Satoshi-Regular.ttf");
let fontData = fs.readFileSync(fontPath);

const boldFontPath = join(process.cwd(), "public/Satoshi-Bold.ttf");
let boldFontData = fs.readFileSync(boldFontPath);

export const GET = async (req: NextRequest, res: NextResponse) => {
  const getSvgImage = (
    username: string,
    streaks: string,
    isEmptyState: boolean
  ) => {
    return satori(
      <div
        // className={styles.frameContainer}
        style={{
          display: "flex",
          width: "100%",
          height: "540px",
          // overflow: "visible",
          // background: "#3D335D",
        }}
      >
        <div
          style={{
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "column",
            display: "flex",
            // background: "#222529",
            backgroundImage: `url(${process.env.NEXT_PUBLIC_DOMAIN}/frame-bg.png)`,
            backgroundSize: "cover", // Ensures the image covers the whole div
            backgroundPosition: "center",
            width: "100%",
            height: "100%",
            padding: "40px 40px",
          }}
        >
          <StreaksFrameImage
            username={username}
            streaks={streaks}
            isEmptyState={isEmptyState}
          />
        </div>
      </div>,
      {
        width: 1020,
        height: 540,
        fonts: [
          {
            data: fontData,
            name: "Satoshi",
            style: "normal",
            weight: 400,
          },
          {
            data: boldFontData,
            name: "Satoshi",
            style: "normal",
            weight: 900,
          },
        ],
      }
    );
  };
  console.log(req.url);
  if (req.method == "GET") {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get("username") || "";
    const streaks = searchParams.get("streaks") || "";
    let state = searchParams.get("state") || "";

    console.log("Current username: ", username);
    console.log("Current username streaks: ", streaks);

    if (state === "empty") {
      const svgImg = await getSvgImage(username, streaks, true);
      const pngBuffer = await sharp(Buffer.from(svgImg))
        .toFormat("png")
        .toBuffer();
      return new Response(pngBuffer, { status: 200 });
    }

    const svgImg = await getSvgImage(username, streaks, false);
    const pngBuffer = await sharp(Buffer.from(svgImg))
      .toFormat("png")
      .toBuffer();
    return new Response(pngBuffer, { status: 200 });
  }
};
