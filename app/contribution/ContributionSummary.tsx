import { LockKeyhole } from "lucide-react";
import { UserInfo } from "./types";
import type { SpotifyListeningData } from "@/lib/spotify/spotifyApi";

type ContributionSummaryProps = {
  userInfo: UserInfo;
  listeningData?: SpotifyListeningData;
  isEncrypted?: boolean;
};

export function ContributionSummary({
  userInfo,
  listeningData,
  isEncrypted = false,
}: ContributionSummaryProps) {
  return (
    <div className="bg-gray-50 p-3 rounded-md border">
      <h3 className="text-sm font-medium mb-2">
        {isEncrypted ? "Contributed Data Summary:" : "Data to be contributed:"}
      </h3>
      <ul className="text-xs space-y-1 text-gray-600">
        <li>• Spotify Profile: {userInfo.name}</li>
        <li>• Email: {userInfo.email}</li>
        {userInfo.locale && <li>• Locale: {userInfo.locale}</li>}
        {listeningData && (
          <>
            <li>• Top Artists: {listeningData.topArtists.slice(0, 3).join(", ")}</li>
            <li>• Recent Tracks: {listeningData.recentTracks.slice(0, 3).join(", ")}</li>
            <li>• Genres: {listeningData.genres.join(", ")}</li>
          </>
        )}
      </ul>
      <p className="text-xs mt-2 text-gray-500">
        <LockKeyhole className="h-3 w-3 inline mr-1" />
        {isEncrypted
          ? "This data has been encrypted for contribution."
          : "This data will be encrypted before contribution."}
      </p>
    </div>
  );
}
