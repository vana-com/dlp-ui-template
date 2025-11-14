import { LockKeyhole } from "lucide-react";
import { UserInfo } from "./types";

type ContributionSummaryProps = {
  userInfo: UserInfo;
  thoughtText?: string;
  isEncrypted?: boolean;
};

export function ContributionSummary({
  userInfo,
  thoughtText,
  isEncrypted = false,
}: ContributionSummaryProps) {
  const thoughtPreview = thoughtText
    ? thoughtText.length > 100
      ? `${thoughtText.slice(0, 100)}...`
      : thoughtText
    : null;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md border dark:border-gray-700">
      <h3 className="text-sm font-medium mb-2">
        {isEncrypted ? "Contributed Thought Summary:" : "Thought to be contributed:"}
      </h3>
      
      {thoughtPreview && thoughtText && (
        <div className="mb-3 p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-700 dark:text-gray-300 italic">
            &ldquo;{thoughtPreview}&rdquo;
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {thoughtText.length} characters
          </p>
        </div>
      )}
      
      <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
        <li>• Contributor: {userInfo.name}</li>
        <li>• Email: {userInfo.email}</li>
        <li>• Storage: Your Google Drive</li>
      </ul>
      
      <p className="text-xs mt-2 text-gray-500 dark:text-gray-400">
        <LockKeyhole className="h-3 w-3 inline mr-1" />
        {isEncrypted
          ? "This thought has been encrypted and stored in your Google Drive."
          : "This thought will be encrypted and stored in your Google Drive."}
      </p>
    </div>
  );
}
