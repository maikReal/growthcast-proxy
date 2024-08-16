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

/**
 * @swagger
 * /api/refresh-token:
 *   post:
 *     summary: Refresh JWT token
 *     description: Generate a new JWT token if the previous one has expired
 *     produces:
 *       - application/json
 *     requestBody:
 *       description: The request body must contain the expired JWT token
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: The expired JWT token.
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: A new JWT token that can be used for authorization
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: The new JWT access token
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */
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
