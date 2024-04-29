export interface UserInfo {
  signerUuid: string;
  fid: string;
}

export interface FrameContent {
  order: number;
  text: string;
  imgLink: string;
  uuid: string;
}

export interface MyCastsStatType {
  totalFollowers?: number | 0;
  totalCasts: number | 0;
  totalLikes: number | 0;
  totalReplies: number | 0;
  totalRecasts: number | 0;
  casts: Array<MyCasts>;
}

interface MyCasts {
  text: string;
  linkToCast: string;
  likes: number;
  replies: number;
  recasts: number;
  timestamp: string;
}
