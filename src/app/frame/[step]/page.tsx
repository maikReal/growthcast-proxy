import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { step: number };
}): Promise<Metadata> {
  const baseUrl = process.env.NEXT_PUBLIC_DOMAIN || "";

  console.log(baseUrl, params.step);

  const step = params.step;
  if (step == 1) {
    return {
      title: "Base Name Service",
      openGraph: {
        title: "Base Name Service",
        images: [
          {
            url: `${baseUrl}/thumbnail.png`,
          },
        ],
      },
      other: {
        "fc:frame": "vNext",
        "fc:frame:image": `${baseUrl}/api/frame/image?step=1`,
        "fc:frame:post_url": `${baseUrl}/api?step=2`,
        "fc:frame:button:1": "Search",
        "fc:frame:input:text": "yourname.base",
      },
    };
  }

  return {};
}

export default function Frame({ params }: { params: { step: number } }) {
  //   return StartFrame();
}
