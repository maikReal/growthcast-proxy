import { RequestData } from "@/types";
import jwt from "jsonwebtoken";

if (!process.env.NEXT_PUBLIC_ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_KEY is not defined in .env or .env.development");
}

export class AuthService {
  // private static token: string | null = null
  private static decodedData: RequestData | null = null;

  // Check if the token is valid and not expired
  static async isTokenValid(token: string): Promise<boolean> {
    try {
      const decoded = jwt.verify(
        token,
        process.env.NEXT_PUBLIC_ENCRYPTION_KEY!
      ) as RequestData;
      this.decodedData = decoded;
      return !!decoded.fid;
    } catch (error) {
      return false; // Token is invalid or expired
    }
  }

  static getDecodedData() {
    return this.decodedData;
  }
}
