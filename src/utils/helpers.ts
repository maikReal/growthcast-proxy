import jwt from "jsonwebtoken";
import { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";

if (!process.env.NEXT_PUBLIC_ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_KEY is not defined in .env or .env.development");
}

export const removeSearchParams = () => {
  window.history.replaceState({}, document.title, window.location.pathname);
};

export const generateCastLink = (castHash: string, fname: string) => {
  const warpcastBase = "https://warpcast.com";
  return `${warpcastBase}/${fname}/${castHash}`;
};

export const verifyAuth = (headers: ReadonlyHeaders) => {
  const authToken = headers.get("Authorization");

  const token = authToken && authToken.split(" ")[1];
  if (!token) return null;

  try {
    return jwt.verify(token, process.env.NEXT_PUBLIC_ENCRYPTION_KEY!);
  } catch (error) {
    return null;
  }
};

// HTTP ERRORS

export const nonAuthHttpResponse = () => {
  return new Response(
    JSON.stringify({ message: "Unauthorized: Invalid or missing token" }),
    {
      status: 401,
      headers: { "Access-Control-Allow-Origin": "https://warpcast.com" },
    }
  );
};

export const forbidenHttpResponse = () => {
  return new Response(
    JSON.stringify({ message: "Forbiden: request is restricted" }),
    {
      status: 403,
      headers: { "Access-Control-Allow-Origin": "https://warpcast.com" },
    }
  );
};

export const unprocessableHttpResponse = () => {
  return new Response(
    JSON.stringify({
      message:
        "Unprocessable request: Missing request metadata, check the request",
    }),
    {
      status: 422,
      headers: { "Access-Control-Allow-Origin": "https://warpcast.com" },
    }
  );
};

export const successHttpResponse = (data?: any) => {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "https://warpcast.com",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
};

export const internalServerErrorHttpResponse = (err: any) => {
  return new Response(JSON.stringify({ message: err }), {
    status: 500,
    headers: { "Access-Control-Allow-Origin": "https://warpcast.com" },
  });
};

export const apiErrorHttpResponse = (err: any) => {
  return new Response(JSON.stringify({ ...err.response.data }), {
    status: err.response.status,
    headers: { "Access-Control-Allow-Origin": "https://warpcast.com" },
  });
};

export const apiErrorHttpNotAllowed = (method: string) => {
  return new Response(
    JSON.stringify({ message: `Method ${method} Not Allowed` }),
    {
      status: 405,
      headers: { "Access-Control-Allow-Origin": "https://warpcast.com" },
    }
  );
};
