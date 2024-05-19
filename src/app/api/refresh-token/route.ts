import {
  apiErrorHttpNotAllowed,
  forbidenHttpResponse,
  nonAuthHttpResponse,
  successHttpResponse,
} from "@/utils/helpers";
import jwt from "jsonwebtoken";
import { NextApiResponse } from "next";
import { NextRequest } from "next/server";

if (
  !process.env.NEXT_PUBLIC_ENCRYPTION_KEY ||
  !process.env.NEXT_PUBLIC_REFRESH_ENCRYPTION_KEY
) {
  throw "NEXT_PUBLIC_ENCRYPTION_KEY or NEXT_PUBLIC_REFRESH_ENCRYPTION_KEY are not undentified";
}

export async function POST(request: NextRequest, response: NextApiResponse) {
  if (request.method === "POST") {
    const { token } = await request.json();

    if (!token) {
      return nonAuthHttpResponse();
    }

    try {
      const user = jwt.verify(
        token,
        process.env.NEXT_PUBLIC_REFRESH_ENCRYPTION_KEY!
      );
      const newAccessToken = jwt.sign(
        { username: user },
        process.env.NEXT_PUBLIC_ENCRYPTION_KEY!,
        {
          expiresIn: "15m",
        }
      );
      return successHttpResponse({ accessToken: newAccessToken });
    } catch (error) {
      return forbidenHttpResponse();
    }
  } else {
    return apiErrorHttpNotAllowed(request.method);
  }
}
