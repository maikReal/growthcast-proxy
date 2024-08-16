import { createSwaggerSpec } from "next-swagger-doc";

import "server-only";

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: "src/app/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Growthcast API endpoints",
        version: "1.0",
      },
    },
  });
  return spec;
};
