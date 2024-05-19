import { apiErrorHttpNotAllowed, successHttpResponse } from "@/utils/helpers";
import jwt from "jsonwebtoken";
import { NextApiResponse } from "next";
import { NextRequest } from "next/server";

if (
  !process.env.NEXT_PUBLIC_ENCRYPTION_KEY ||
  !process.env.NEXT_PUBLIC_REFRESH_ENCRYPTION_KEY
) {
  throw "ENCRYPTION_KEY or REFRESH_SECRET_KEY are not undentified";
}

export async function POST(request: NextRequest, response: NextApiResponse) {
  if (request.method === "POST") {
    const { username } = await request.json();
    const accessToken = jwt.sign(
      { username },
      process.env.NEXT_PUBLIC_ENCRYPTION_KEY!,
      {
        expiresIn: "1m", // 15m
      }
    );
    const refreshToken = jwt.sign(
      { username },
      process.env.NEXT_PUBLIC_REFRESH_ENCRYPTION_KEY!,
      {
        expiresIn: "7d",
      }
    );

    return successHttpResponse({ accessToken, refreshToken });
  } else {
    return apiErrorHttpNotAllowed(request.method);
  }
}
