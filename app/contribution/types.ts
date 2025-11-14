export type UserInfo = {
  id?: string;
  name: string;
  email: string;
  locale?: string;
};

/**
 * Thought data structure matching Thinker task expectations
 * This is the decrypted format that the task will receive
 */
export type ThoughtData = {
  contributor_id: string;
  thought: string;
  timestamp: string;
};

export type ContributionData = {
  contributionId: string;
  encryptedUrl: string;
  transactionReceipt: {
    hash: string;
    blockNumber?: number;
  };
  fileId?: number;
  thoughtData?: ThoughtData; // The original thought data
  keywords?: string[]; // Keywords extracted by the task (if available)
  teeProofData?: Record<string, unknown>;
  teeJobId?: number;
  rewardTxHash?: string;
};

export type DriveInfo = {
  percentUsed: number;
};
