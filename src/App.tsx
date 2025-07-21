import { useConvexAuth } from "convex/react";
import { SignIn } from "./components/auth/SignIn";
import AuthenticatedApp from "./AuthenticatedApp";

export default function App() {
  const { isAuthenticated } = useConvexAuth();

  if (!isAuthenticated) {
    return <SignIn />;
  }

  return <AuthenticatedApp />;
}