import { FrameContent } from "@/types";
import axios from "axios";
import FormData from "form-data";
import { v4 as uuidv4 } from "uuid";
import { createCanvas, CanvasRenderingContext2D } from "canvas";
import {
  NeynarFrameCreationRequest,
  NeynarPageButton,
} from "@neynar/nodejs-sdk/build/neynar-api/v2";
import { NeynarFramePage } from "@neynar/nodejs-sdk/build/neynar-api/v2";

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      context.fillText(line, x, y);
      line = words[n] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  context.fillText(line, x, y);
}

export function createTextCanvas(text: string, width: number = 1910) {
  const height = width / 1.91;
  const canvas = createCanvas(width, height);
  const context = canvas.getContext("2d");

  context.fillStyle = "#FFFFFF"; // Background color white
  context.fillRect(0, 0, width, height);

  const fontSize = 28;
  context.font = `${fontSize}px Arial`; // Adjust to your preferred font
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#000000"; // Text color black

  const x = width / 2;
  const y = height / 2;
  const lineHeight = fontSize * 1.2;
  const maxWidth = width - 40; // Margin

  wrapText(context, text, x, y, maxWidth, lineHeight);

  const buffer = canvas.toBuffer();
  const imageUrl = buffer.toString("base64");
  return buffer;
}

const uploadFile = async (imageBuffer: Buffer) => {
  const formData = new FormData();
  formData.append("image", imageBuffer);

  try {
    const response = await axios.post(
      "https://api.imgur.com/3/image",
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Client-ID ${process.env.IMGUR_CLIENT_ID}`, // Replace YOUR_CLIENT_ID with your actual Imgur client ID
        },
      }
    );
    console.log(response);
    return response.data.data.link; // Return the link to the uploaded image
  } catch (error) {
    console.error("Failed to upload image:", error);
    return error;
  }
};

export const getImageLink = async (content: string) => {
  const imageBuffer = createTextCanvas(content, 1080);
  const link = await uploadFile(imageBuffer);
  console.log("Image link: ", link);
  return link;
};

export const generateSeveralFrameLinks = async (
  content: Array<FrameContent>
) => {
  // console.log(content);
  const tasks = content.map(async (item) => ({
    ...item,
    imgLink: await getImageLink(item.text),
  }));

  const castsWithImageLinks = await Promise.all(tasks);

  return castsWithImageLinks;
};

interface FramePageProps {
  currentPage: FrameContent | null;
  previousPage?: FrameContent;
  nextPage?: FrameContent;
}

// PREPARE A CONFIG FOR A FRAME CREATION
class FramePage {
  currentPage: FrameContent | null;
  previousPage?: FrameContent;
  nextPage?: FrameContent;

  constructor({ currentPage, previousPage, nextPage }: FramePageProps) {
    this.currentPage = currentPage;
    this.previousPage = previousPage;
    this.nextPage = nextPage;
  }

  isPreviousPage() {
    return this.previousPage ? true : false;
  }

  isNextPage() {
    return this.nextPage ? true : false;
  }

  hasTwoButtons() {
    return this.isNextPage() && this.isPreviousPage() ? true : false;
  }
}

export const generateFrameCreationRequest = async (
  data: Array<FrameContent>
) => {
  const threadLength = data.length;

  // console.log("Images data: ", data);

  let pages: Array<NeynarFramePage> = new Array<NeynarFramePage>();
  for (let i = 0; i < threadLength; i++) {
    const previousPage = i - 1 < 0 ? null : data[i - 1];
    const currentPage = data[i];
    const nextPage = i + 1 >= threadLength ? null : data[i + 1];

    // console.log("Iteration data: ", previousPage, currentPage, nextPage);
    let page;
    if (!previousPage && !nextPage) {
      page = new FramePage({ currentPage: currentPage });
    }

    if (previousPage && !nextPage) {
      page = new FramePage({
        currentPage: currentPage,
        previousPage: previousPage,
      });
    }

    if (!previousPage && nextPage) {
      page = new FramePage({ currentPage: currentPage, nextPage: nextPage });
    }

    if (previousPage && nextPage) {
      page = new FramePage({
        currentPage: currentPage,
        previousPage: previousPage,
        nextPage: nextPage,
      });
    }

    if (page) {
      // console.log("Page info: ", page);
      const pageTemplate = getOneFrameSettings(page, threadLength);

      pages.push(pageTemplate);
    }
  }

  const creationRequest: NeynarFrameCreationRequest = {
    name: `Thread`, // TODO: Think how to name each time by a new name
    pages: pages,
  };

  return creationRequest;
};

const getOneFrameSettings = (pages: FramePage, threadLength: number) => {
  if (!pages.currentPage) {
    throw new Error(
      "No pages found for the Frame creation request. Make sure that everything works properly"
    );
  }

  let framesButton: Array<NeynarPageButton> = new Array<NeynarPageButton>();

  if (pages.isPreviousPage()) {
    framesButton.push(
      generateButton(pages.previousPage!, pages.hasTwoButtons(), true)
    );
  }

  if (pages.isNextPage()) {
    framesButton.push(
      generateButton(pages.nextPage!, pages.hasTwoButtons(), false)
    );
  }

  const pageFrameTemplate: NeynarFramePage = {
    image: {
      url: pages.currentPage.imgLink,
      aspect_ratio: "1.91:1",
    },
    title: `Thread 🧵 // Page ${pages.currentPage.order}/${threadLength}`,
    buttons: framesButton,
    uuid: pages.currentPage.uuid,
    version: "vNext",
  };

  return pageFrameTemplate;
};

const generateButton = (
  page: FrameContent,
  hasTwoButtons: boolean,
  isPrevious: boolean
): NeynarPageButton => {
  return isPrevious
    ? {
        action_type: "post",
        next_page: {
          uuid: page?.uuid,
        },
        title: "<< Previous",
        index: 1,
      }
    : {
        action_type: "post",
        next_page: {
          uuid: page?.uuid,
        },
        title: "Next >>",
        index: hasTwoButtons ? 2 : 1,
      };
};
