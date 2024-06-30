import { NextApiRequest, NextApiResponse } from "next";
import sharp from "sharp";
import satori from "satori";
import { join } from "path";
import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import styles from "./styles.module.css";
import { StreaksFrameImage } from "@/components/Frame/streaks";

const fontPath = join(process.cwd(), "public/Satoshi-Regular.ttf");
let fontData = fs.readFileSync(fontPath);

const boldFontPath = join(process.cwd(), "public/Satoshi-Bold.ttf");
let boldFontData = fs.readFileSync(boldFontPath);

export const GET = async (req: NextRequest, res: NextResponse) => {
  const getSvgImage = () => {
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
          {/* <div style={{}}> */}
          {/* <img
            style={{ width: "80px", height: "80px" }}
            src={`${process.env.NEXT_PUBLIC_DOMAIN}/growthcast-icon.png`}
          />
          <span style={{ color: "white", fontSize: "28px" }}>
            Welcome to the Frame
          </span> */}
          <StreaksFrameImage />
        </div>
        {/* </div> */}
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
    // console.log(req.query);
    // const step = req.query["step"];
    const { searchParams } = new URL(req.url);
    const step = searchParams.get("step");

    console.log(step);

    if (step === "1") {
      const svgImg = await getSvgImage();
      const pngBuffer = await sharp(Buffer.from(svgImg))
        .toFormat("png")
        .toBuffer();
      return new Response(pngBuffer, { status: 200 });
    }
  }
};

{
  /* <div
          style={{
            justifyContent: "flex-start",
            alignItems: "flex-start",
            flexDirection: "column",
            display: "flex",
            width: "100%",
            height: "100%",
            lineHeight: 1.2,
            fontSize: 14,
            position: "relative",
            fontFamily: "Satoshi",
            overflow: "visible",
            background: "#3D335D",
            padding: "30px",
          }}
        >
          <div>
            <img
              style={{ width: "80px", height: "80px" }}
              src={`${process.env.NEXT_PUBLIC_DOMAIN}/growthcast-icon.png`}
            />
            <div
              style={{
                justifyContent: "flex-start",
                alignItems: "center",
                flexDirection: "column",
                display: "flex",
                width: "100%",
                height: "100%",
                borderRadius: "20px",
                padding: "3px",
                lineHeight: 1.2,
                fontSize: 28,
                fontWeight: 900,
                position: "absolute",
                left: 0,
                top: 50,
                zIndex: "1",
                fontFamily: "Satoshi",
              }}
            >
              <span style={{ color: "white" }}>Welcome to the Frame</span>
            </div>
          </div>
        </div> */
}
