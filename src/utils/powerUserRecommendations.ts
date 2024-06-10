import client from "@/clients/neynar";
import axios from "axios";
import { parseISO, addHours, isBefore } from "date-fns";

interface RecommendedUsers {
  message: Array<RecommendedUserProp>;
}

interface RecommendedUsersRanks {
  message: Array<RecommendedUserRankProp>;
}

interface RecommendedUserProp {
  address: string;
  fname: string | null;
  username: string;
  fid: number;
  score: number;
}

interface RecommendedUserRankProp {
  fid: number;
  fname: string;
  username: string | null;
  rank: number;
  score: number;
  percentile: number;
}

export const getRecommendedUsers = async (fid: number) => {
  //   Fetch users with badges
  const usersWithBadges = (
    await axios.get(`${process.env.NEXT_PUBLIC_DOMAIN}/api/power-users/badges`)
  ).data.result.fids as Array<number>;

  // console.log("Badges: ", usersWithBadges);

  // Fetch recommended users for a specific FID
  const recommendedUsers = (
    await axios.get(
      `${process.env.NEXT_PUBLIC_DOMAIN}/api/power-users/openrank-recommend/${fid}`
    )
  ).data as RecommendedUsers;

  // console.log("Recs: ", recommendedUsers);

  const getRecommendedUsersFids = getFids(recommendedUsers.message);
  //
  // console.log("fids: ", getRecommendedUsersFids);

  // Get ranks of recommended users
  const recommendedUsersRanks = (
    await axios.post(
      `${process.env.NEXT_PUBLIC_DOMAIN}/api/power-users/openrank-ranks`,
      {
        fids: getRecommendedUsersFids,
      }
    )
  ).data as RecommendedUsersRanks;

  console.log("Ranks+Recs: ", recommendedUsersRanks);

  const recommendedUsersNoBadge = excludePowerUsers(
    recommendedUsersRanks.message,
    usersWithBadges
  );

  console.log("Recs without badges: ", recommendedUsersNoBadge);

  return recommendedUsersNoBadge;

  // Generate the best users to interact with
};

const getFids = (recommendations: Array<RecommendedUserProp>) => {
  return recommendations.map((value) => {
    return value.fid;
  });
};

const excludePowerUsers = (
  recommendedUsersFids: Array<RecommendedUserRankProp>,
  powerUsersFids: Array<number>
) => {
  let filteredFids = new Array<RecommendedUserRankProp>();
  recommendedUsersFids.map((user) => {
    if (!powerUsersFids.includes(user.fid)) {
      filteredFids.push({
        fid: user.fid,
        fname: user.fname,
        username: user.username,
        rank: user.rank,
        score: user.score,
        percentile: user.percentile,
      });
    }
  });

  return filteredFids;
};

interface ActiveUsersProp {
  fid: number;
  fname: string | null;
  username: string | null;
  rank: number;
  score: number;
  percentile: number;
}

const isIn48TimeFrame = (timestamp: string) => {
  const parsedDate = parseISO(timestamp);

  // Get the current date and time
  const currentDate = new Date();

  // Add 48 hours to the current date
  const datePlus48Hours = addHours(currentDate, 48);

  // console.log(
  //   isBefore(parsedDate, datePlus48Hours),
  //   parsedDate,
  //   datePlus48Hours
  // );

  return isBefore(parsedDate, datePlus48Hours);
};

// Filter and leave only users that posted something for the last 48 hours
export const filterNonActiveUsers = async (users: Array<ActiveUsersProp>) => {
  const activeUsers = new Array<ActiveUsersProp>();

  console.log(typeof users);

  return users.filter(async (user) => {
    const { result } = await client.fetchAllCastsCreatedByUser(user.fid, {
      limit: 1,
    });
    // console.log(result);
    if (result.casts.length > 0) {
      return isIn48TimeFrame(result.casts[0].timestamp);
      // if (isIn48TimeFrame(result.casts[0].timestamp)) {
      //   activeUsers.push(user);
      //   console.log(user);
      // }
    }
  });

  // users.map(async (user) => {
  //   const { result } = await client.fetchAllCastsCreatedByUser(user.fid, {
  //     limit: 1,
  //   });
  //   // console.log(result);
  //   if (result.casts.length > 0) {
  //     if (isIn48TimeFrame(result.casts[0].timestamp)) {
  //       activeUsers.push(user);
  //       console.log(user);
  //     }
  //   }
  // });

  // console.log(activeUsers);
  // return activeUsers;
};
