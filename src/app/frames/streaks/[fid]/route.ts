import { NextRequest } from "next/server";
import { GET as defaultGET } from "@/app/frames/route";

// for backward compatibility
const handleRequest = (
  req: NextRequest,
  { params: urlParams }: { params: any }
) => defaultGET(req, { params: { userFid: urlParams.fid } });

export const GET = handleRequest;
export const POST = handleRequest;
