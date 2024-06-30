export const StartFrame = () => {
  return {
    title: "Growthcast",
    openGraph: {
      title: "Growthcast",
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_VIEW_BASE_URL}/thumbnail.png`,
        },
      ],
    },
    other: {
      "fc:frame": "vNext",
      "fc:frame:image": `${process.env.NEXT_PUBLIC_VIEW_BASE_URL}/api/frame/image?step=1`,
      "fc:frame:post_url": `${process.env.NEXT_PUBLIC_VIEW_BASE_URL}/api?step=2`,
      "fc:frame:button:1": "Search",
      "fc:frame:input:text": "yourname.base",
    },
  };
};
