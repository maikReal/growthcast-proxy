import { NextRequest } from "next/server";
import { headers } from "next/headers";
import {
  nonAuthHttpResponse,
  internalServerErrorHttpResponse,
  verifyAuth,
  generateApiResponse,
} from "@/utils/helpers";
import axios from "axios";
import { addSubscriberToDatabase } from "@/utils/db/dbQueiries";

export const GET = async (
  request: NextRequest,
  { params }: { params: { fid: number } }
) => {
  const currentHeaders = headers();

  if (!verifyAuth(currentHeaders)) {
    return nonAuthHttpResponse();
  }

  try {
    console.log(
      "[DEBUG - api/webhook/start-tracking-fid/[fid]] Gettting current FIDs that we're already tracking..."
    );

    let { data } = await axios.get(
      `${process.env.NEXT_PUBLIC_DOMAIN}/api/webhook/get-current-subscribers`,
      {
        headers: {
          Origin: process.env.NEXT_PUBLIC_DOMAIN,
        },
      }
    );

    console.log("current subscribers list: ", data);

    if (!data || !data.includes(Number(params.fid))) {
      console.log("here");
      if (!data) {
        data = [Number(params.fid)];
      } else {
        data.push(Number(params.fid));
      }

      console.log(
        "[DEBUG - api/webhook/start-tracking-fid/[fid]] Addin a subsriber to database..."
      );
      const isSubscriberAdded = await addSubscriberToDatabase(params.fid);

      console.log("updated subscribers list: ", data);

      if (isSubscriberAdded) {
        console.log(
          "[DEBUG - api/webhook/start-tracking-fid/[fid]] Updating webhook settings..."
        );

        const options = {
          method: "PUT",
          headers: {
            accept: "application/json",
            api_key: `${process.env.NEXT_PUBLIC_NEYNAR_API_KEY}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            subscription: { "cast.created": { author_fids: data } },
            name: `${process.env.NEYNAR_WEBHOOK_NAME}`,
            url: `${process.env.NEYNAR_WEBHOOK_URL}`,
            webhook_id: `${process.env.NEYNAR_WEBHOOK_ID}`,
          }),
        };

        const updateRequestResponse = await fetch(
          `${process.env.NEXT_PUBLIC_NEYNAR_HOST}/v2/farcaster/webhook`,
          options
        );

        if (updateRequestResponse.ok) {
          let isCastedToday = await axios.get(
            `${process.env.NEXT_PUBLIC_DOMAIN}/api/webhook/is-casted-today/${params.fid}`,
            {
              headers: {
                Origin: process.env.NEXT_PUBLIC_DOMAIN,
              },
            }
          );

          console.log(
            `[DEBUG - api/webhook/start-tracking-fid/[fid]] The FID ${params.fid} is casted today? -> ${isCastedToday.data}...`
          );

          return generateApiResponse({ status: 200 }, true);
        } else {
          return generateApiResponse({ status: 502 });
        }
      }
    }

    console.log(
      "[DEBUG - api/webhook/start-tracking-fid/[fid]] The fid is already in the subscribers list..."
    );

    return generateApiResponse({ status: 200 }, true);
  } catch (error) {
    console.error(error);
    return internalServerErrorHttpResponse(error);
  }
};
