import axios from "axios";
import neynarClient from "@/clients/neynar";
import { getCurrentFilePath } from "@/utils/helpers";
import { logError } from "../logs/sentryLogger";
import { DatabaseManager } from "./databaseManager";

export interface UserInfo {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  follower_count: number;
  following_count: number;
  verifications: object;
}

interface FetchedUserData {
  followStats: { followers: number; followings: number };
  userRestData: UserInfo;
}

const logsFilenamePath = getCurrentFilePath();

export class UserInfoManager {
  private fid: number;
  private dbManager: DatabaseManager;

  // Methods:
  // - Add user info
  // - Update user info
  // - Is user info exists

  constructor(fid: number) {
    this.fid = fid;
    this.dbManager = DatabaseManager.getInstance();
  }

  /**
   * Fetching user info from Neynat API
   *
   * @returns
   */
  private async fetchUserInfo(): Promise<UserInfo | null> {
    let userData: UserInfo | null = null;
    try {
      const { users } = await neynarClient.fetchBulkUsers([this.fid]);

      if (users && users.length > 0) {
        userData = users[0] as UserInfo;
      }
    } catch (error) {
      logError(
        `[ERROR - ${logsFilenamePath}] Error fetching user data: ${error}`
      );
    }

    return !userData ? null : userData;
  }

  /**
   *  The method to add information about the FID to the user-info table. You can fetch info from this table later
   *
   *
   * @returns {object}
   */
  public async addUserInfo(): Promise<boolean> {
    let fetchedUserData: UserInfo | null = await this.fetchUserInfo();

    try {
      if (fetchedUserData) {
        const query = `
            INSERT INTO users_info (fid, username, display_name, pfp_url, followers, followings, verified_address)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;

        const queryParams = [
          this.fid,
          fetchedUserData.username,
          fetchedUserData.display_name,
          fetchedUserData.pfp_url,
          fetchedUserData.follower_count,
          fetchedUserData.following_count,
          JSON.stringify(fetchedUserData.verifications),
        ];

        this.dbManager.executeQuery(query, queryParams);
      } else {
        logError(
          `[ERROR - ${logsFilenamePath}] Couldn't find a user with the provided FID: ${this.fid}`
        );
        return false;
      }
    } catch (error) {
      logError(
        `[ERROR - ${logsFilenamePath}] Error fetching user data: ${error}`
      );
      return false;
    }
    return true;
  }

  /**
   * The method to get the current number of followers for a specific fid
   *
   * @returns {number}
   */
  public async getUserInfo(): Promise<UserInfo | null> {
    const query = `
          SELECT 
            fid,
            username,
            display_name,
            pfp_url,
            followers,
            followings,
            verified_address
          FROM users_info
          WHERE fid = $1 and is_data_fetched = TRUE
          LIMIT 1
        `;
    const result = await this.dbManager.executeQuery(query, [this.fid]);
    return result ? result.rows[0] : null;
  }

  /**
   * Update already existing user info data in the table
   *
   * @returns
   */
  public async updateUserInfo(): Promise<boolean> {
    let fetchedUserData: UserInfo | null = await this.fetchUserInfo();

    try {
      if (fetchedUserData) {
        const query = `
                UPDATE users_info
                SET username = $2,
                    display_name = $3,
                    pfp_url = $4,
                    followers = $5,
                    followings = $6,
                    verified_address = $7,
                    is_data_fetched = TRUE
                WHERE fid = $1
            `;

        const queryParams = [
          this.fid,
          fetchedUserData.username,
          fetchedUserData.display_name,
          fetchedUserData.pfp_url,
          fetchedUserData.follower_count,
          fetchedUserData.following_count,
          JSON.stringify(fetchedUserData.verifications),
        ];

        await this.dbManager.executeQuery(query, queryParams);
      } else {
        logError(
          `[ERROR - ${logsFilenamePath}] Couldn't find a user with the provided FID: ${this.fid}`
        );
        return false;
      }
    } catch (error) {
      logError(
        `[ERROR - ${logsFilenamePath}] Error fetching user data: ${error}`
      );
      return false;
    }
    return true;
  }

  /**
   * Check if a FID info was fetched and added to the user_info database
   *
   * @param {number} [fid] - the fid that we need to check in the user_info table
   * @returns
   */
  private async isUserInfoExists(fid: number) {
    const res = await this.dbManager.executeQuery(
      "SELECT 1 FROM users_info WHERE fid = $1",
      [fid]
    );

    return res ? res.rowCount > 0 : false;
  }

  /**
   * Method to mark that the historical data fetching for the fid in the user-info table is completed
   *
   * @returns
   */
  public async markUserDataAsFetched() {
    const isExist = await this.isUserInfoExists(this.fid);

    try {
      if (isExist) {
        const res = await this.dbManager.executeQuery(
          "UPDATE users_info SET is_data_fetched = TRUE WHERE fid = $1",
          [this.fid]
        );

        if (!res || res.rowCount === 0) {
          logError(
            `[ERROR - ${logsFilenamePath}] Can't update data for FID ${this.fid} on the user_info table. Fid does not exist...`
          );
          return false;
        }

        return true;
      }

      return false;
    } catch (err) {
      logError(
        `[ERROR - ${logsFilenamePath}] Error while during the update of the user_info data for FID: ${this.fid}...`
      );
      return false;
    }
  }
}
