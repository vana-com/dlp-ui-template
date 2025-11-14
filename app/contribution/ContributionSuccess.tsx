import { Button } from "@/components/ui/button";
import { CheckCircle, ExternalLink, Plus } from "lucide-react";
import { ContributionSteps } from "./ContributionSteps";
import { ContributionSummary } from "./ContributionSummary";
import { UserKeywords } from "./UserKeywords";
import { ContributionData, UserInfo } from "./types";
import { getTransactionUrl } from "../../contracts/chains";
import { useAccount } from "wagmi";

type ContributionSuccessProps = {
  contributionData: ContributionData;
  completedSteps: number[];
  shareUrl?: string;
  userInfo: UserInfo;
  onReset?: () => void;
};

export function ContributionSuccess({
  contributionData,
  completedSteps,
  userInfo,
  onReset,
}: ContributionSuccessProps) {
  // Determine how many steps were completed (now 4 steps total)
  const fullyCompleted = completedSteps.includes(4);
  const taskProcessed = completedSteps.includes(3);

  const thoughtText = contributionData.thoughtData?.thought;
  const { address: walletAddress } = useAccount();
  
  // Get contributor ID (wallet address or email)
  const contributorId = walletAddress || userInfo.email;

  return (
    <div className="space-y-4">
      <div className="bg-green-50 dark:bg-green-950 p-4 rounded-md flex items-center">
        <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 mr-3" />
        <div className="flex-1">
          <h3 className="font-medium text-green-800 dark:text-green-200">
            Thought Contributed Successfully!
          </h3>
          <p className="text-sm text-green-700 dark:text-green-300">
            {fullyCompleted
              ? "Your thought has been successfully processed and your reward has been claimed."
              : taskProcessed
              ? "Your thought has been successfully processed by the Thinker task."
              : "Your thought has been successfully contributed to the blockchain."}
          </p>
        </div>
      </div>

      <div className="space-y-3 bg-slate-50 p-4 rounded-md text-sm">
        <h3 className="font-medium">Contribution Details</h3>

        <div className="grid grid-cols-2 gap-2">
          <div className="text-muted-foreground">File ID</div>
          <div className="font-mono text-xs truncate">
            {contributionData.fileId || "Processing..."}
          </div>

          <div className="text-muted-foreground">Transaction Hash</div>
          <div className="font-mono text-xs truncate flex items-center">
            <span className="truncate">
              {contributionData.transactionReceipt?.hash || "Pending..."}
            </span>
            {contributionData.transactionReceipt?.hash && (
              <a
                href={getTransactionUrl(contributionData.transactionReceipt.hash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 ml-1"
              >
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          {fullyCompleted && (
            <>
              <div className="text-muted-foreground">Reward Transaction</div>
              <div className="font-mono text-xs truncate flex items-center">
                <span className="truncate">
                  {contributionData.rewardTxHash || "Pending..."}
                </span>
                {contributionData.rewardTxHash && (
                  <a
                    href={getTransactionUrl(contributionData.rewardTxHash)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 ml-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {taskProcessed && contributionData.teeProofData && (
        <div className="space-y-3 bg-slate-50 dark:bg-slate-900 p-4 rounded-md text-sm">
          <h3 className="font-medium">Task Processing Results</h3>
          <div className="max-h-48 overflow-y-auto bg-slate-100 dark:bg-slate-800 p-2 rounded-md font-mono text-xs">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(contributionData.teeProofData, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* User Keywords - Show insights from their contributions */}
      {taskProcessed && contributorId && (
        <UserKeywords contributorId={contributorId} autoLoad={false} />
      )}

      {/* Stepper UI showing completed steps */}
      <ContributionSteps currentStep={0} completedSteps={completedSteps} />

      {/* Show the contributed thought */}
      {userInfo && thoughtText && (
        <ContributionSummary
          userInfo={userInfo}
          thoughtText={thoughtText}
          isEncrypted={true}
        />
      )}

      {/* Option to contribute another thought */}
      {onReset && (
        <Button 
          onClick={onReset} 
          variant="outline" 
          className="w-full"
        >
          <Plus className="mr-2 h-4 w-4" />
          Contribute Another Thought
        </Button>
      )}
    </div>
  );
}
