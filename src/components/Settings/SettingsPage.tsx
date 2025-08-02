// src/components/Settings/SettingsPage.tsx
import { type Id } from "@/lib/convex";
import { AppSettings } from "./AppSettings";
import { AdvancedSettings } from "./AdvancedSettings";
import { SettingsSidebar } from "./SettingsSidebar";
import { useState } from "react";
import { AccountSettings } from "./AccountSettings";
import { ThemeSettings } from "./ThemeSettings";

export type SettingsPanels = "account" | "app" | "theme" | "advanced"

interface SettingsPageProps {
    selectedListId: Id<"lists"> | null;
}

export function SettingsPage({ selectedListId }: SettingsPageProps) {
  const [activePanel, setActivePanel] = useState<SettingsPanels>("app");
  return (
    <div className="flex flex-row flex-1 h-full bg-background">
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
  );
}
