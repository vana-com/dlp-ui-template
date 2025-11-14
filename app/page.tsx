"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { LoginButton } from "./auth/LoginButton";
import { UserProfile } from "./profile/UserProfile";

export default function Home() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b bg-white dark:bg-black py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <h1 className="text-xl font-bold">Thinker DLP</h1>
          {session && (
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1"
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </Button>
          )}
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            <p>Loading...</p>
          </div>
        ) : session ? (
          <div className="w-full max-w-2xl flex justify-center">
            <UserProfile />
          </div>
        ) : (
          <div className="flex flex-col items-center text-center space-y-8 max-w-2xl">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tight">
                Thinker DLP - Share Your Wisdom
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Contribute your reflective thoughts to the VANA network and earn rewards. 
                Your thoughts are encrypted and privately stored in your Google Drive.
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg w-full max-w-md space-y-4 text-center">
              <div className="space-y-2">
                <h3 className="font-semibold">How it works:</h3>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 text-left">
                  <li>• Connect your Google account</li>
                  <li>• Share short reflective thoughts (1-3 sentences)</li>
                  <li>• Your thoughts are encrypted client-side</li>
                  <li>• Encrypted thoughts stored in your Google Drive</li>
                  <li>• Earn rewards from the VANA network</li>
                </ul>
              </div>

              <div className="pt-4 flex justify-center">
                <LoginButton />
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        <div className="container mx-auto px-4">
          <p>Thinker DLP - Share reflective thoughts and earn rewards on the VANA network</p>
        </div>
      </footer>
    </div>
  );
}
