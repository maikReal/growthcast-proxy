import client from "@/clients/neynar";
import axios from "axios";
import { parseISO, addHours, isBefore } from "date-fns";
import { getMyFollowers, removeFollowers } from "./helpers";

export interface RecommendedUserProp {
  address: string;
  fname: string | null;
  username: string;
  fid: number;
  score: number;
  profileUrl?: string;
}

export interface RecommendedUserRankProp {
  fid: number;
  fname: string;
  username: string | null;
  rank: number;
  score: number;
  percentile: number;
}

export const getRecommendedUsers = async (
  fid: number,
  filterType?: string | null
) => {
  //   Fetch users with badges
  console.log(
    "[DEBUG - utils/powerUserRecommendations] Fetching all users with a power badge..."
  );
  const usersWithBadges = (
    await axios.get(`${process.env.NEXT_PUBLIC_DOMAIN}/api/power-users/badges`)
  ).data.result.fids as Array<number>;

  // Fetch recommended users for a specific FID
  console.log(
    "[DEBUG - utils/powerUserRecommendations] Fetch recommended users for a specific FID..."
  );
  let recommendedUsers = (
    await axios.get(
      `${process.env.NEXT_PUBLIC_DOMAIN}/api/power-users/openrank-recommend/${fid}`
    )
  ).data as RecommendedUserProp[];

  // Remove a fid info from the recommendation
  recommendedUsers = recommendedUsers.filter((item) => item.fid != fid);

  let filteredUsers = null;
  if (filterType) {
    console.log(
      "[DEBUG - utils/powerUserRecommendations] Applying different filters for the list of recommendations..."
    );
    filteredUsers = await applyFilters(
      recommendedUsers,
      filterType,
      usersWithBadges,
      fid
    );
  }
  return filteredUsers ? filteredUsers : recommendedUsers;
};

const applyFilters = async (
  recommendedUsers: RecommendedUserProp[],
  filterType: string,
  usersWithBadges: number[],
  fid: number
) => {
  let filterResult = null;
  if (filterType == "removeMyFollowers" || filterType == "all") {
    console.log(
      "[DEBUG - utils/powerUserRecommendations] Remove my followers..."
    );
    const fidFollowers = await getMyFollowers(fid);
    filterResult = removeFollowers(recommendedUsers, fidFollowers);
  }

  if (filterType == "removePowerUsers" || filterType == "all") {
    console.log(
      "[DEBUG - utils/powerUserRecommendations] Excluding power users..."
    );

    filterResult = excludePowerUsers(
      filterResult ? filterResult : recommendedUsers,
      usersWithBadges
    );
  }

  if (filterType == "remainActiveUsers" || filterType == "all") {
    console.log(
      "[DEBUG - utils/powerUserRecommendations] Filtering non-active users..."
    );
    console.log(filterResult ? true : false);
    filterResult = await filterNonActiveUsers(
      filterResult ? filterResult : recommendedUsers
    );
  }

  return filterResult;
};

const excludePowerUsers = (
  recommendedUsersFids: Array<RecommendedUserProp>,
  powerUsersFids: Array<number>
) => {
  let filteredFids = new Array<RecommendedUserProp>();
  recommendedUsersFids.map((user) => {
    if (!powerUsersFids.includes(user.fid)) {
      filteredFids.push({
        fid: user.fid,
        fname: user.fname,
        username: user.username,
        score: user.score,
        address: user.address,
      });
    }
  });

  return filteredFids;
};

const isIn48TimeFrame = (timestamp: string) => {
  const parsedDate = parseISO(timestamp);

  // Get the current date and time
  const currentDate = new Date();

  // Add 48 hours to the current date
  const datePlus48Hours = addHours(currentDate, 48);

  return isBefore(parsedDate, datePlus48Hours);
};

// Filter and leave only users that posted something for the last 48 hours
export const filterNonActiveUsers = async (
  users: Array<RecommendedUserProp>
) => {
  return users.filter(async (user) => {
    const { result } = await client.fetchAllCastsCreatedByUser(user.fid, {
      limit: 1,
    });
    if (result.casts.length > 0) {
      return isIn48TimeFrame(result.casts[0].timestamp);
    }
  });
};
