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

/**
 * @swagger
 * /api/auth:
 *   post:
 *     summary: Generate the JWT authorization token
 *     description: Generate the JWT authorization token
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: A successful response containing the JWT tokens
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: The JWT access token
 *                 refreshToken:
 *                   type: string
 *                   description: The JWT refresh token
 *               example:
 *                 accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 refreshToken: "dGhpcy1pcy1hLXJlZnJlc2gtdG9rZW4tZXhhbXBsZQ=="
 */
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
