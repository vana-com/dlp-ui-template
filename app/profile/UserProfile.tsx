"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { VanaDlpIntegration } from "../contribution/VanaDlpIntegration";
import { useUserData } from "./hooks/useUserData";

export function UserProfile() {
  const { userInfo, listeningData, isLoading, error } = useUserData();

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Spotify profile unavailable</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!userInfo) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Spotify Profile</CardTitle>
          <CardDescription>
            Sign in with Spotify to view your profile and contribute data.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16 border">
            <AvatarImage src="" alt={userInfo?.name} />
            <AvatarFallback>{userInfo?.name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{userInfo.name}</CardTitle>
            <CardDescription className="flex items-center gap-2">
              {userInfo.email}
              {userInfo.country && (
                <Badge variant="outline">{userInfo.country}</Badge>
              )}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Account ID</p>
            <p className="font-mono text-xs">{userInfo.id}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Plan</p>
            <p className="capitalize">{userInfo.product || "Free"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Locale</p>
            <p>{userInfo.locale || "en"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Listening Data</p>
            <p>
              {listeningData
                ? `${listeningData.topArtists.length} artists / ${listeningData.recentTracks.length} tracks`
                : "Not loaded"}
            </p>
          </div>
        </CardContent>
      </Card>

      <VanaDlpIntegration />
    </div>
  );
}
