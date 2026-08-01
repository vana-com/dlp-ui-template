"use client";

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { useState } from "react";

export function LoginButton() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setIsLoading(true);
      await signIn("spotify", { callbackUrl: "/" });
    } catch (error) {
      console.error("Login failed", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={handleLogin} 
      disabled={isLoading} 
      className="flex items-center gap-2"
      size="lg"
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Signing in...
        </>
      ) : (
        <>
          <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" className="h-5 w-5" fill="#1DB954">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.6 0 12 0zm5.5 12c-.3 0-.5-.2-.5-.5v-3c0-.3.2-.5.5-.5.3 0 .5.2.5.5v3c0 .3-.2.5-.5.5zm-2 5.5c-.3 0-.5-.2-.5-.5v-3c0-.3.2-.5.5-.5.3 0 .5.2.5.5v3c0 .3-.2.5-.5.5zm-2-7c-.3 0-.5-.2-.5-.5v-3c0-.3.2-.5.5-.5.3 0 .5.2.5.5v3c0 .3-.2.5-.5.5zm-2 7c-.3 0-.5-.2-.5-.5v-3c0-.3.2-.5.5-.5.3 0 .5.2.5.5v3c0 .3-.2.5-.5.5zm-2-7c-.3 0-.5-.2-.5-.5v-3c0-.3.2-.5.5-.5.3 0 .5.2.5.5v3c0 .3-.2.5-.5.5zm6-9c2.7 0 5 2.3 5 5s-2.3 5-5 5-5-2.3-5-5 2.3-5 5-5z"/>
          </svg>
          Sign in with Spotify
        </>
      )}
    </Button>
  );
}
