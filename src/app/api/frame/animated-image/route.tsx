import { NextRequest, NextResponse } from "next/server";
import { createCanvas } from "canvas";
import GIFEncoder from "gifencoder";

const generateLoaderImage = async () => {
  const width = 100;
  const height = 100;
  const encoder = new GIFEncoder(width, height);

  encoder.start();
  encoder.setRepeat(0); // 0 for repeat, -1 for no-repeat
  encoder.setDelay(100); // frame delay in ms
  encoder.setQuality(10); // image quality, 10 is default

  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d") as any;

  const numFrames = 10;
  const radius = 20;
  const centerX = width / 2;
  const centerY = height / 2;

  for (let i = 0; i < numFrames; i++) {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);

    const angle = (i / numFrames) * 2 * Math.PI;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    ctx.beginPath();
    ctx.arc(x, y, 10, 0, 2 * Math.PI);
    ctx.fillStyle = "white";
    ctx.fill();

    encoder.addFrame(ctx);
  }

  encoder.finish();

  return encoder.out.getData();
};

export const GET = async (req: NextRequest) => {
  try {
    const image = await generateLoaderImage();
    return new NextResponse(image, {
      status: 200,
      headers: { "Content-Type": "image/gif" },
    });
  } catch (error) {
    console.error(error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
};
