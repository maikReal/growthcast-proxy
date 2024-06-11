import { pool } from "./database";

export type Period = "all" | "7days" | "30days" | "90days";

// Use one of the format: "all" | "7days" | "30days" | "90days" to get ino about a users casts
export const getFidCasts = async (fid: number, period: Period) => {
  const client = await pool.connect();
  try {
    let query = `
        WITH filtered_casts AS (
  SELECT
    jsonb_array_elements(casts) AS "cast"
  FROM
    public.warpdrive
  WHERE
    fid = $1
)
SELECT
  jsonb_agg("cast") AS casts,
  COUNT("cast") AS total_casts,
  SUM(("cast" ->> 'likes')::integer) AS total_likes,
  SUM(("cast" ->> 'recasts')::integer) AS total_recasts,
  SUM(("cast" ->> 'replies')::integer) AS total_replies
FROM
  filtered_casts
    `;

    // Date filter based on period
    const now = new Date();
    let startDate: Date | null = null;

    switch (period) {
      case "7days":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
        break;
      case "30days":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
        break;
      case "90days":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 90 days ago
        break;
      case "all":
      default:
        break;
    }

    if (startDate) {
      query += `
        WHERE
          ("cast" ->> 'timestamp')::timestamp >= $2
      `;
    }

    const queryParams: any[] = [fid];
    if (startDate) {
      queryParams.push(startDate.toISOString());
    }

    const selectResult = await client.query(query, queryParams);
    // console.log("Query Result:", selectResult.rows[0]);

    return selectResult.rows[0];
  } catch (err) {
    console.error("[ERROR - utils/db/dbQueries] Error executing query:", err);
  } finally {
    client.release();
  }
};

interface Cast {
  text: string;
  linkToCast: string;
  likes: number;
  replies: number;
  recasts: number;
  timestamp: string;
}

export interface UserData {
  fid: number;
  totalCasts: number;
  totalLikes: number;
  totalReplies: number;
  totalRecasts: number;
  totalFollowers: number;
  casts: Cast[];
}

export const addFidCasts = async (data: UserData) => {
  const client = await pool.connect();
  try {
    const query = `
      INSERT INTO warpdrive (fid, totalCasts, totalLikes, totalReplies, totalRecasts, totalFollowers, casts)
      VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb)
    `;
    const values = [
      data.fid,
      data.totalCasts,
      data.totalLikes,
      data.totalReplies,
      data.totalRecasts,
      data.totalFollowers,
      JSON.stringify(data.casts),
    ];
    await client.query(query, values);
    console.log("[DEBUG - utils/db/dbQueries] Data inserted successfully");
  } catch (error) {
    console.error("[ERROR - utils/db/dbQueries] Error inserting data:", error);
    throw error;
  } finally {
    client.release();
  }
};

export const isUserExists = async (fid: number): Promise<boolean> => {
  const client = await pool.connect();
  try {
    const query = "SELECT 1 FROM public.warpdrive WHERE fid = $1 LIMIT 1";
    const res = await client.query(query, [fid]);

    // If the row exists, the result's row count will be greater than 0
    return res.rowCount > 0;
  } catch (err) {
    console.error(
      "[ERROR - utils/db/dbQueries] Error checking row existence:",
      err
    );
    throw err; // Rethrow the error for further handling if necessary
  } finally {
    client.release();
  }
};
