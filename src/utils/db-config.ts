import { Pool } from "pg";
import { getCurrentFilePath } from "./helpers";
import { logInfo } from "./v2/logs/sentryLogger";

const logsFilenamePath = getCurrentFilePath();

// Define the configuration of the database
const poolConfig = {
  user: process.env.POSTGRES_V2_USER,
  host: process.env.POSTGRES_V2_HOST,
  database: process.env.POSTGRES_V2_DATABASE,
  password: process.env.POSTGRES_V2_PASSWORD,
  port: 5432,
  ssl: {
    rejectUnauthorized: false, // Ensures the server certificate is valid
  },
};

logInfo(
  `[DEBUG - ${logsFilenamePath}] 🛜 Establishing the shared Pool database connection...`
);
export const sharedDatabasePool = new Pool(poolConfig);
logInfo(
  `[DEBUG - ${logsFilenamePath}] 🛜 The shared Pool database connection is succesfully established!`
);
