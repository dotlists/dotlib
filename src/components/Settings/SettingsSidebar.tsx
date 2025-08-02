import { Palette, Settings, Settings2, User2 } from "lucide-react";
import { type SettingsPanels } from "./Settings";
import type { JSX } from "react";

type SettingsSidebarProps = {
  activePanel: SettingsPanels;
  setActivePanel: (panel: SettingsPanels) => void;
};

export function SettingsSidebar({ activePanel, setActivePanel }: SettingsSidebarProps) {
  const panels: { key: SettingsPanels; label: JSX.Element }[] = [
    { key: "account", label: <><User2 className="size-5 mr-2" /> account</> },
    { key: "app", label: <><Settings className="size-5 mr-2" /> app</> },
    { key: "theme", label: <><Palette className="size-5 mr-2" /> theme</> },
    { key: "advanced", label: <><Settings2 className="size-5 mr-2" /> advanced</> },
  ];

  return (
    <nav className="md:block bg-tertiary min-w-45 p-3 pt-1">
      <ul>
        {panels.map(({ key, label }) => (
          <li
            key={key}
            onClick={() => setActivePanel(key)}
            className={`transition-all flex items-center justify-start text-start cursor-pointer p-1.5 m-0 rounded ${
              activePanel === key ? "bg-muted/50 text-muted-foreground" : "hover:bg-accent/30"
            }`}
          >
            {label}
          </li>
        ))}
      </ul>
    </nav>
  );
}