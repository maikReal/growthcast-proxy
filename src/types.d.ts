export interface UserInfo {
  signerUuid: string;
  fid: string;
}

export interface ThreadContent {
  order: number;
  text: string;
  imgLink?: string;
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

export interface ThreadCast {
  content: Array<ThreadContent>;
  signerUuid: string;
  channelId: string;
}

interface MyCasts {
  text: string;
  linkToCast: string;
  likes: number;
  replies: number;
  recasts: number;
  timestamp: string;
}

export interface Channel {
  channelName?: string;
  channelId: string;
}

export interface CastEmbedLinks {
  url: string;
}

export interface RequestData {
  fid: string;
  signerUuid?: string;
  metadata: {
    [key: string | number]: Object;
  };
}

export interface RequestData {
  fid: string;
  signerUuid?: string;
  metadata?: {
    [key: string | number]: Object;
  };
  iat: number;
  exp: number;
}
