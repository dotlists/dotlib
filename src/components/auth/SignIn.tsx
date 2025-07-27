import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import { Github, Chrome } from "lucide-react";

export function SignIn() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn } = useAuthActions();

  return (
    <div className="flex flex-col items-center justify-center bg-background">
      {!isLoading && !isAuthenticated && (
        <div className="flex flex-col gap-4 w-full">
          <Button 
            onClick={() => void signIn("github")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg flex items-center justify-center gap-3 text-lg font-medium transition-colors"
          >
            <Github size={24} />
            continue with github
          </Button>
          <Button 
            onClick={() => void signIn("google")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg flex items-center justify-center gap-3 text-lg font-medium transition-colors"
          >
            <Chrome size={24} />
            continue with google
          </Button>
        </div>
      )}
    </div>
  );
}