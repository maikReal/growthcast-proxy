import { headers } from "next/headers";
import {
  nonAuthHttpResponse,
  internalServerErrorHttpResponse,
  verifyAuth,
  generateApiResponse,
} from "@/utils/helpers";
import { getCurrentWebhookUserFids } from "@/utils/db/dbQueiries";

export const GET = async () => {
  const currentHeaders = headers();

  if (!verifyAuth(currentHeaders)) {
    return nonAuthHttpResponse();
  }

  try {
    console.log(
      "[DEBUG - api/webhook/get-current-subscribers/[fid]] Getting the list of webhook subscribers..."
    );
    const currentSubscribersList = await getCurrentWebhookUserFids();

    return generateApiResponse({ status: 200 }, currentSubscribersList);
  } catch (error) {
    console.error(error);
    return internalServerErrorHttpResponse(error);
  }
};
