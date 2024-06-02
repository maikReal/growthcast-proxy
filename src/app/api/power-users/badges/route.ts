// Get the list of all users with a Warpcast power badge

import { NextRequest } from "next/server";
import { headers } from "next/headers";
import {
  nonAuthHttpResponse,
  internalServerErrorHttpResponse,
  successHttpResponse,
  verifyAuth,
  apiErrorHttpNotAllowed,
} from "@/utils/helpers";

export const GET = async (request: NextRequest) => {
  const currentHeaders = headers();

  if (!verifyAuth(currentHeaders)) {
    return nonAuthHttpResponse();
  }

  console.log(
    "[DEBUG - api/power-users/] Fetching users with a power badge..."
  );

  try {
    const powerUsersRequestResponse = await fetch(
      `${process.env.NEXT_PUBLIC_WARPCAST_HOST}/v2/power-badge-users`
    )
      .then(async (response) => {
        if (response.ok) {
          response = await response.json();
          return successHttpResponse(response);
        } else {
          if (response.status == 500) {
            return internalServerErrorHttpResponse(response);
          }
          if (response.status == 405) {
            return apiErrorHttpNotAllowed(request.method);
          }
          if (response.status == 401) {
            return nonAuthHttpResponse();
          }
        }
      })
      .catch((error) => {
        const errorMessage = `Some issues while processing a request: ${error}`;
        console.log(errorMessage);
        return internalServerErrorHttpResponse(errorMessage);
      });
    return powerUsersRequestResponse;
  } catch (error) {
    return internalServerErrorHttpResponse(error);
  }
};
