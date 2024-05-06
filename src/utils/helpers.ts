import crypto from "crypto";
import { toast } from "react-toastify";
import axios, { AxiosError } from "axios";
import { ErrorRes } from "@neynar/nodejs-sdk/build/neynar-api/v2";

const algorithm = "aes-256-cbc";
const secretKey = process.env.ENCRYPTION_KEY; // Ensure this is 32 bytes
const iv = process.env.ENCRYPTION_IV;

export const verifyUser = async (signerUuid: string, fid: string) => {
  let _isVerifiedUser = false;
  try {
    const {
      data: { isVerifiedUser },
    } = await axios.post("/api/verify-user", { signerUuid, fid });
    _isVerifiedUser = isVerifiedUser;
  } catch (err) {
    const { message } = (err as AxiosError).response?.data as ErrorRes;
    toast(message, {
      type: "error",
      theme: "dark",
      autoClose: 3000,
      position: "bottom-right",
      pauseOnHover: true,
    });
  }
  return _isVerifiedUser;
};

export const removeSearchParams = () => {
  window.history.replaceState({}, document.title, window.location.pathname);
};

export const generateCastLink = (castHash: string, fname: string) => {
  const warpcastBase = "https://warpcast.com";
  return `${warpcastBase}/${fname}/${castHash}`;
};

// AUTH ENCRYPTION
export const contentEncrypter = (content: string | null) => {
  if (!content) {
    throw new Error(`Content for encrypting can't be: ${content}`);
  }

  if (!secretKey || !iv) {
    throw new Error(
      "ENCRYPTION_KEY or/and ENCRYPTION_IV is not defined in .env"
    );
  }

  const cipher = crypto.createCipheriv(
    algorithm,
    Buffer.from(secretKey, "hex"),
    Buffer.from(iv, "hex")
  );
  let encrypted = cipher.update(content);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString("hex");
};

export const contentDecryptor = (hash: string | null) => {
  if (!hash) {
    throw new Error(`Content for decryption can't be: ${hash}`);
  }

  if (!secretKey || !iv) {
    // console.log("Secret vars:", secretKey, iv);
    throw new Error(
      "ENCRYPTION_KEY or/and ENCRYPTION_IV is not defined in .env"
    );
  }
  const decipher = crypto.createDecipheriv(
    algorithm,
    Buffer.from(secretKey, "hex"),
    Buffer.from(iv, "hex")
  );
  let decrypted = decipher.update(Buffer.from(hash, "hex"));
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
};

// const generateKeyAndIV = () => {
//   const secretKey = crypto.randomBytes(32); // 32 bytes for AES-256
//   const iv = crypto.randomBytes(16); // 16 bytes for the IV

//   console.log("Secret Key (Base64):", secretKey.toString("base64"));
//   console.log("IV (Base64):", iv.toString("base64"));

//   // Output as hex, if preferred
//   console.log("Secret Key (Hex):", secretKey.toString("hex"));
//   console.log("IV (Hex):", iv.toString("hex"));
// };

export const isAuth = (headersList: any) => {
  if (process.env.AUTH_TOKEN === "dev") {
    return true;
  }

  const authHeader = headersList.get("x-custom-auth");
  console.log("Original:", authHeader);

  if (!authHeader) {
    nonAuthHttpResponse();
  }

  const authHeaderDecrypted = contentDecryptor(authHeader);
  console.log("Decrypted:", authHeaderDecrypted);
  const authHeaderSplitted = authHeaderDecrypted?.split("_");
  console.log("Splitted:", authHeaderSplitted);

  if (!authHeaderSplitted) {
    nonAuthHttpResponse();
  }

  const authKey = authHeaderSplitted[authHeaderSplitted?.length - 1];

  const expectedToken = "1234Token";

  console.log(authKey, expectedToken);

  if (!authKey || authKey !== expectedToken) {
    // If the token is invalid or not provided, return a 401 Unauthorized response
    return false;
  }

  return true;
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

export const successHttpResponse = (data?: any) => {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { "Access-Control-Allow-Origin": "https://warpcast.com" },
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
