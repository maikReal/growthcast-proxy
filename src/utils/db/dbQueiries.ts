import { pool } from "./database";

// It meansthat we're getting a user's data that was X days ago
// Later on UI we would compare it to understand how the stat changed
export type Period = "all" | "7days" | "14days" | "30days";

// Use one of the format: "all" | "7days" | "30days" | "90days" to get ino about a users casts
export const getFidCasts = async (fid: number, period: Period) => {
  const client = await pool.connect();
  try {
    let query = `
      WITH filtered_casts AS (
        SELECT
          jsonb_array_elements(casts) AS "cast",
          "totalFollowers"
        FROM
          public.warpdrive
        WHERE
          fid = $1
      )
      SELECT
        jsonb_agg("cast") FILTER (WHERE period = 'current') AS "currentCasts",
        COUNT("cast") FILTER (WHERE period = 'current') AS "currentTotalCasts",
        MAX("totalFollowers") AS "totalFollowers",
        SUM(("cast" ->> 'likes')::integer) FILTER (WHERE period = 'current') AS "currentTotalLikes",
        SUM(("cast" ->> 'recasts')::integer) FILTER (WHERE period = 'current') AS "currentTotalRecasts",
        SUM(("cast" ->> 'replies')::integer) FILTER (WHERE period = 'current') AS "currentTotalReplies",
        jsonb_agg("cast") FILTER (WHERE period = 'previous') AS "previousCasts",
        COUNT("cast") FILTER (WHERE period = 'previous') AS "previousTotalCasts",
        SUM(("cast" ->> 'likes')::integer) FILTER (WHERE period = 'previous') AS "previousTotalLikes",
        SUM(("cast" ->> 'recasts')::integer) FILTER (WHERE period = 'previous') AS "previousTotalRecasts",
        SUM(("cast" ->> 'replies')::integer) FILTER (WHERE period = 'previous') AS "previousTotalReplies"
      FROM (
        SELECT
          "cast",
          "totalFollowers",
          CASE
            WHEN ("cast" ->> 'timestamp')::timestamp >= $2 AND ("cast" ->> 'timestamp')::timestamp < $3 THEN 'current'
            WHEN ("cast" ->> 'timestamp')::timestamp >= $4 AND ("cast" ->> 'timestamp')::timestamp < $5 THEN 'previous'
            ELSE NULL
          END AS period
        FROM
          filtered_casts
      ) subquery
      WHERE period IS NOT NULL;
    `;
    const now = new Date();
    let startDateCurrent: Date | null = null;
    let endDateCurrent: Date | null = null;
    let startDatePrevious: Date | null = null;
    let endDatePrevious: Date | null = null;

    switch (period) {
      case "7days":
        startDateCurrent = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
        endDateCurrent = now;
        startDatePrevious = new Date(
          startDateCurrent.getTime() - 7 * 24 * 60 * 60 * 1000
        ); // 14 days ago
        endDatePrevious = startDateCurrent;
        break;
      case "14days":
        startDateCurrent = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000); // 14 days ago
        endDateCurrent = now;
        startDatePrevious = new Date(
          startDateCurrent.getTime() - 14 * 24 * 60 * 60 * 1000
        ); // 28 days ago
        endDatePrevious = startDateCurrent;
        break;
      case "30days":
        startDateCurrent = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
        endDateCurrent = now;
        startDatePrevious = new Date(
          startDateCurrent.getTime() - 30 * 24 * 60 * 60 * 1000
        ); // 60 days ago
        endDatePrevious = startDateCurrent;
        break;
      default:
        // Handle the 'all' case if needed
        break;
    }

    const queryParams: any[] = [fid];
    if (
      startDateCurrent &&
      endDateCurrent &&
      startDatePrevious &&
      endDatePrevious
    ) {
      queryParams.push(startDateCurrent.toISOString());
      queryParams.push(endDateCurrent.toISOString());
      queryParams.push(startDatePrevious.toISOString());
      queryParams.push(endDatePrevious.toISOString());
    }

    console.log(queryParams);
    const selectResult = await client.query(query, queryParams);

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
      INSERT INTO warpdrive ("fid", "totalCasts", "totalLikes", "totalReplies", "totalRecasts", "totalFollowers", "casts")
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

export const isFidExists = async (fid: number): Promise<boolean> => {
  const client = await pool.connect();
  try {
    const query = `
      SELECT 1
      FROM public.warpdrive
      WHERE fid = $1
    `;

    const result = await client.query(query, [fid]);
    return result.rows.length > 0;
  } catch (err) {
    console.error("Error checking if FID exists:", err);
    return false;
  } finally {
    client.release();
  }
};

export const isFidDataUpdated = async (fid: number): Promise<boolean> => {
  const client = await pool.connect();
  try {
    const query = `
      SELECT "lastDateUpd"
      FROM public.warpdrive
      WHERE fid = $1
    `;

    const result = await client.query(query, [fid]);

    if (result.rows.length === 0) {
      // FID does not exist in the table
      return false;
    }

    const lastDateUpd = result.rows[0].lastdateupd as Date;
    const currentTime = new Date();
    const timeDifference =
      (currentTime.getTime() - new Date(lastDateUpd).getTime()) / (1000 * 60); // difference in minutes

    return timeDifference < 30;
  } catch (err) {
    console.error("Error checking if FID was updated within 30 minutes:", err);
    return false;
  } finally {
    client.release();
  }
};

export const updateFidData = async (
  fid: number,
  data: UserData
): Promise<boolean> => {
  const client = await pool.connect();
  try {
    const query = `
      UPDATE public.warpdrive
      SET 
        "totalCasts" = $1,
        "totalLikes" = $2,
        "totalReplies" = $3,
        "totalRecasts" = $4,
        "casts" = $5,
        "totalFollowers" = $6,
        "lastDateUpd" = CURRENT_TIMESTAMP
      WHERE fid = $7
    `;

    const values = [
      data.totalCasts,
      data.totalLikes,
      data.totalReplies,
      data.totalRecasts,
      JSON.stringify(data.casts), // Convert the casts array to JSON string
      data.totalFollowers,
      fid,
    ];

    const result = await client.query(query, values);
    return result.rowCount > 0; // Return true if at least one row was updated
  } catch (err) {
    console.error("Error updating FID data:", err);
    return false;
  } finally {
    client.release();
  }
};
