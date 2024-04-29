import { NextRequest } from "next/server";
import { NextApiResponse } from "next";

import {
  contentEncrypter,
  contentDecryptor,
  isAuth,
  nonAuthHttpResponse,
  successHttpResponse,
  apiErrorHttpNotAllowed,
  internalServerErrorHttpResponse,
} from "@/utils/helpers";

import { headers } from "next/headers";
import { postFramesThread } from "@/utils/neynar-requests";

export async function POST(request: NextRequest, response: NextApiResponse) {
  if (request.method === "POST") {
    const currentHeaders = headers();

    if (!isAuth(currentHeaders)) {
      return nonAuthHttpResponse();
    }

    try {
      const content = await request.json();

      const frameRdequest = await postFramesThread(content);

      console.log(frameRdequest);

      return successHttpResponse(frameRdequest);
    } catch (error) {
      console.log(error);
      return internalServerErrorHttpResponse(error);
    }
  } else {
    response.setHeader("Allow", ["POST"]);
    return apiErrorHttpNotAllowed(request.method);
  }
}
