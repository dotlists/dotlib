import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "../ui/button";


export function AccountSettings() {
  const { signOut } = useAuthActions();
  return (
    <>
      <div>
        <h3 className="text-lg font-medium">sign out</h3>
        <p className="text-sm text-muted-foreground mt-0">
          signs you out of your account. you can log back in from the landing page.
        </p>
        <div className="flex items-center space-x-2 mt-2">
          <Button
            onClick={signOut}
          >
            sign out
          </Button>
        </div>
      </div>
      <div>
        <h3 className="text-lg font-medium">delete account</h3>
        <p className="text-sm font-semibold text-destructive mt-0">
          deletes your user account. THIS CAN NOT BE UNDONE! (not yet implemented lol)
        </p>
        <div className="flex items-center space-x-2 mt-2">
          <Button
            variant={"destructive"}
            onClick={() => {
              // todo: implement account deletion
            }}
          >
            delete account
          </Button>
        </div>
      </div>
    </>
  );
}