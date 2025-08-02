import { useTheme } from "@/hooks/useTheme";
import { Button } from "../ui/button";

const THEMES = ["light", "dark", "midnight", "gruvbox", "blue", "monochrome"];

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  return (
    <>
      <div>
        <h3 className="text-lg font-medium">theme</h3>
        <p className="text-sm text-muted-foreground mt-0">
          select a color theme for the application.
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          {THEMES.map((themeName) => (
            <Button
              key={themeName}
              variant={theme === themeName ? "secondary" : "outline"}
              onClick={() =>
                setTheme(
                  themeName as
                    | "light"
                    | "dark"
                    | "midnight"
                    | "gruvbox"
                    | "blue"
                    | "monochrome",
                )
              }
              className="capitalize"
            >
              {themeName}
            </Button>
          ))}
        </div>
      </div>
    </>
  );
}