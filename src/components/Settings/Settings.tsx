import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { type Id } from "@/lib/convex";
import { AppSettings } from "./AppSettings";
import { AdvancedSettings } from "./AdvancedSettings";
import { SettingsSidebar } from "./SettingsSidebar";
import { useState } from "react";
import { AccountSettings } from "./AccountSettings";
import { ThemeSettings } from "./ThemeSettings";

interface SettingsProps {
  onClose: () => void;
  selectedListId: Id<"lists"> | null;
}

export type SettingsPanels = "account" | "app" | "theme" | "advanced"

export function Settings({ onClose, selectedListId }: SettingsProps) {
  const [activePanel, setActivePanel] = useState<SettingsPanels>("app");

  const content = (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
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
        className="bg-background p-0 rounded-lg shadow-lg w-full max-w-4xl relative h-5/6 overflow-x-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-4 py-3 border-b sticky top-0 h-14 z-50 bg-background">
          <h2 className="text-2xl font-bold">settings</h2>
          <button
            onClick={onClose}
            className="absolute top-3 right-2 p-1 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-200"
            aria-label="Close settings"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="flex flex-row flex-1 h-[calc(100%-3.5rem)]">
          <SettingsSidebar 
            activePanel={activePanel}
            setActivePanel={setActivePanel}
          />
          <div className="space-y-6 h-full w-full border-l p-6 overflow-y-auto">
            {activePanel === "account" && <AccountSettings />}
            {activePanel === "app" && <AppSettings />}
            {activePanel === "theme" && <ThemeSettings />}
            {activePanel === "advanced" && <AdvancedSettings selectedListId={selectedListId}/>}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  return createPortal(content, document.body);
}
