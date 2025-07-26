import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { setCookie, getCookie } from "@/lib/utils";

const THEMES = ["light", "dark", "gruvbox", "blue", "monochrome"];

export function Settings() {
  const [theme, setTheme] = useState("light");
  const [isSimpleMode, setIsSimpleMode] = useState(false);

  useEffect(() => {
    const storedTheme = getCookie("theme") || "light";
    const storedSimpleMode = localStorage.getItem("simpleMode") === "true";
    setTheme(storedTheme);
    setIsSimpleMode(storedSimpleMode);
    document.documentElement.className = storedTheme;
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    setCookie("theme", newTheme, 365);
    document.documentElement.className = newTheme;
  };

  const handleSimpleModeChange = (checked: boolean) => {
    setIsSimpleMode(checked);
    localStorage.setItem("simpleMode", String(checked));
    // This will require a page reload to apply simple mode context correctly
    window.location.reload();
  };

  const themeDisplayNames: { [key: string]: string } = {
    light: "Gruvbox Light",
    dark: "Dark",
    gruvbox: "Gruvbox Dark",
    blue: "Blue",
    monochrome: "Monochrome",
  };

  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="text-lg font-medium">Theme</h3>
        <p className="text-sm text-muted-foreground">
          Select a color theme for the application.
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          {THEMES.map((themeName) => (
            <Button
              key={themeName}
              variant={theme === themeName ? "secondary" : "outline"}
              onClick={() => handleThemeChange(themeName)}
              className="capitalize"
            >
              {themeDisplayNames[themeName]}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-medium">Simple Mode</h3>
        <p className="text-sm text-muted-foreground">
          Hide advanced features for a cleaner interface.
        </p>
        <div className="flex items-center space-x-2 mt-2">
          <Switch
            id="simple-mode"
            checked={isSimpleMode}
            onCheckedChange={handleSimpleModeChange}
          />
          <Label htmlFor="simple-mode">Enable Simple Mode</Label>
        </div>
      </div>
    </div>
  );
}
