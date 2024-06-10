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
  if (process.env.NEXT_PUBLIC_DEV_MODE) {
    return true;
  }

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
// TODO: Fix all HTTP responses and standardize it

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

const httpResponse = (responseBody: any, ...params: any) => {
  return new Response(JSON.stringify(responseBody), {
    status: params.status,
    headers: {
      "Access-Control-Allow-Origin": "https://warpcast.com",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
};

export const generateApiResponse = (
  response: Response | { status: number; statusText?: string },
  body?: any
) => {
  switch (response.status) {
    case 200:
    case 201:
    case 202:
    case 204:
      return httpResponse(body, { status: response.status });

    // 3xx Redirection
    case 301:
      return httpResponse(
        {
          message:
            "Moved Permanently: The requested resource has been permanently moved to a new URL.",
        },
        { status: response.status }
      );
    case 302:
      return httpResponse(
        {
          message:
            "Found: The requested resource is temporarily available at a different URL.",
        },
        { status: response.status }
      );
    case 304:
      return httpResponse(
        {
          message:
            "Not Modified: The resource has not been modified since the last request.",
        },
        { status: response.status }
      );
    case 400:
      return httpResponse(
        {
          message:
            "Bad Request: The server could not understand the request due to invalid syntax.",
        },
        { status: response.status }
      );
    case 401:
      return httpResponse(
        {
          message: "Unauthorized: Access is denied due to invalid credentials.",
        },
        { status: response.status }
      );
    case 403:
      return httpResponse(
        {
          message:
            "Forbidden: You do not have permission to access this resource.",
        },
        { status: response.status }
      );
    case 404:
      return httpResponse(
        { message: "Not Found: The requested resource could not be found." },
        { status: response.status }
      );
    case 429:
      return httpResponse(
        {
          message:
            "Too Many Requests: You have sent too many requests in a given amount of time.",
        },
        { status: response.status }
      );
    case 500:
      return httpResponse(
        {
          message:
            "Internal Server Error: The server encountered an error and could not complete your request.",
        },
        { status: response.status }
      );
    case 502:
      return httpResponse(
        {
          message:
            "Bad Gateway: The server received an invalid response from the upstream server.",
        },
        { status: response.status }
      );
    case 503:
      return httpResponse(
        {
          message:
            "Service Unavailable: The server is currently unable to handle the request.",
        },
        { status: response.status }
      );
    default:
      return httpResponse(
        { message: `Unexpected error: ${response.statusText}` },
        {
          status: response.status,
        }
      );
  }
};
