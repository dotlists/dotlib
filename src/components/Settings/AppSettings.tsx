import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { useTheme } from "@/hooks/useTheme";
import { useSettings } from "@/contexts/SettingsContext";
import { api } from "@/lib/convex";
import { useMutation, useQuery } from "convex/react";
import { useMemo } from "react";
import { ShareLinkComponent } from "../ui/ShareLink";

const THEMES = ["light", "dark", "midnight", "gruvbox", "blue", "monochrome"];

export function AppSettings() {
  const { theme, setTheme } = useTheme();
  const { isSimpleMode, setIsSimpleMode } = useSettings();

  const generateAuthKey = useMutation(api.auth.generateAuthKey);
  const getAuthKey = useQuery(api.auth.getAuthKey);
  const user = useQuery(api.main.getMyUserProfile);

  const calendarUrl = useMemo(() => {
    if (!user) return "";
    let convex_url = import.meta.env.VITE_CONVEX_URL;
    convex_url = convex_url.replace("https://", "webcal://");
    convex_url = convex_url.replace(".convex.cloud", ".convex.site");
    convex_url += `/calendar?userId=${user.userId}`;
    return convex_url;
  }, [user]);

  return (
    <>
      {/* theme switcher */}
      <div>
        <h3 className="text-lg font-medium">theme</h3>
        <p className="text-sm text-muted-foreground">
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
      {/* simple mode */}
      <div>
        <h3 className="text-lg font-medium">simple mode</h3>
        <p className="text-sm text-muted-foreground">
          hide advanced features for a cleaner interface.
        </p>
        <div className="flex items-center space-x-2 mt-2">
          <Switch
            id="simple-mode"
            checked={isSimpleMode}
            onCheckedChange={setIsSimpleMode}
          />
          <Label htmlFor="simple-mode">enable simple mode</Label>
        </div>
      </div>
      {/* calendar integration */}
      <div>
        <h3 className="text-lg font-medium">calendar integration</h3>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>subscribe to your tasks with due dates in your calendar app.</p>
          <ul className="list-disc list-inside pl-2">
            <li>
              <strong>for Google Calendar:</strong> go to{" "}
              <code className="bg-muted p-1 rounded">
                Settings &gt; Add Calendar &gt; From URL
              </code>{" "}
              and enter the link below.
            </li>
            <li>
              <strong>for other calendars:</strong> look for an option to
              import an iCal calendar and use the link below.
            </li>
          </ul>
          <p className="font-semibold text-destructive">
            do not share this link. anyone with this link can access your
            tasks.
          </p>
        </div>
        <div className="mt-2">
          <ShareLinkComponent link={calendarUrl} />
        </div>
      </div>
      {/* authentication key */}
      <div>
        <h3 className="text-lg font-medium">authentication key</h3>
        <p className="text-sm text-muted-foreground">
          generate a temporary key to authenticate external applications.
        </p>
        <div className="flex items-center space-x-2 mt-2">
          <Button
            key="generate-auth"
            variant="default"
            onClick={() => generateAuthKey()}
          >
            generate key
          </Button>
          <Label htmlFor="generate-auth">
            {getAuthKey === undefined ? "" : getAuthKey}
          </Label>
        </div>
      </div>
    </>
  );
}