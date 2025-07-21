import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button";
import { Github } from "lucide-react";

export function SignIn() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signIn } = useAuthActions();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      {!isLoading && !isAuthenticated && (
        <>
          <h1 className="text-4xl font-bold mb-8 text-foreground" style={{ fontFamily: 'Lora, serif' }}>
            Sign In
          </h1>
          <Button 
            onClick={() => void signIn("github")}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 rounded-lg flex items-center gap-3 text-lg font-medium transition-colors"
          >
            <Github size={24} />
            Continue with GitHub
          </Button>
        </>
      )}
    </div>
  );
}