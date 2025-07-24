// src/components/CreateUsername.tsx
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/lib/convex";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

export function CreateUsername() {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const createProfile = useMutation(api.users.createUserProfile);

  const handleCreateProfile = async () => {
    setError("");
    try {
      await createProfile({ username });
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="w-full max-w-xs">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Choose a Username
        </h1>
        <p className="text-muted-foreground mb-6 text-center">
          This will be your unique name for sharing and invitations.
        </p>
        <Input
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          placeholder="username"
          className="mb-2"
        />
        <Button onClick={handleCreateProfile} className="w-full">
          Create Profile
        </Button>
        {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
      </div>
    </div>
  );
}
