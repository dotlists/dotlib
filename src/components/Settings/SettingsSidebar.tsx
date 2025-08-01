import { type SettingsPanels } from "./Settings";

type SettingsSidebarProps = {
  activePanel: SettingsPanels;
  setActivePanel: (panel: SettingsPanels) => void;
};

export function SettingsSidebar({ activePanel, setActivePanel }: SettingsSidebarProps) {
  const panels: { key: SettingsPanels; label: string }[] = [
    { key: "app", label: "app" },
    { key: "advanced", label: "advanced" },
  ];

  return (
    <nav className="md:block bg-tertiary min-w-45 p-4">
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