import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "../ui/button";
import { useMutation } from "convex/react";
import { api } from "@/lib/convex";
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";

interface DeleteConfirmationProps {
  onClose: () => void;
}

function DeleteConfirmation({ onClose }: DeleteConfirmationProps) {
  const { signOut } = useAuthActions();
  const deleteAccount = useMutation(api.main.deleteUserProfile);
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "var(--muted, #adb5bd)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ type: "tween", ease: "easeOut", duration: 0.3 }}
        className="bg-background p-0 rounded-lg shadow-lg w-full max-w-xl relative h-4/9 overflow-x-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b sticky top-0 h-14 z-50 bg-background">
          <h2 className="text-2xl font-bold">delete account</h2>
          <button
            onClick={onClose}
            className="absolute top-3 right-2 p-1 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-200"
            aria-label="Close settings"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <h3 className="p-6 pb-0 font-medium text-destructive text-lg">
          are you sure you want to do this?
        </h3>
        <p className="p-6 pt-0 pb-3 text-sm font-medium">
          this action is not reversible. by doing this, you are deleting your user account, along with all of your lists, 
          their items, and any other data associated with your account. ownership of your teams will be transferred to the 
          next admin, or if not applicable, the next member in the team. if you are the only member of the team, the team  
          and all lists and items within the team will be deleted.
        </p>
        <div className="flex items-center space-x-2 mt-2">
          <Button
            variant={"destructive"}
            onClick={() => {
              deleteAccount();
              signOut();
            }}
            className="ml-6 cursor-pointer"
          >
            delete account
          </Button>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}

export function AccountSettings() {
  const { signOut } = useAuthActions();
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
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
          deletes your user account and all your user data (lists, items, etc).
        </p>
        <div className="flex items-center space-x-2 mt-2">
          <Button
            variant={"destructive"}
            onClick={() => {
              setIsDeleteConfirmationOpen(true);
            }}
            className="cursor-pointer"
          >
            delete account
          </Button>
        </div>
      </div>
      <AnimatePresence>
        {isDeleteConfirmationOpen && (
          <DeleteConfirmation
            onClose={() => setIsDeleteConfirmationOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}