import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { X } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useSettings } from "@/contexts/SettingsContext";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { api } from "@/lib/convex";
import { useMutation, useQuery } from "convex/react";
import { useMemo } from "react";
import { ShareLinkComponent } from "./ui/ShareLink";

const THEMES = ["light", "dark", "gruvbox", "blue", "monochrome"];

interface SettingsProps {
  onClose: () => void;
}

export function Settings({ onClose }: SettingsProps) {
  const { theme, setTheme } = useTheme();
  const { isSimpleMode, setIsSimpleMode } = useSettings();
  const generateAuthKey = useMutation(api.auth.generateAuthKey);
  const getAuthKey = useQuery(api.auth.getAuthKey);
  const user = useQuery(api.main.getMyUserProfile);

  const calendarUrl = useMemo(() => {
    if (!user) return "";
    let convex_url = (import.meta.env as any).VITE_CONVEX_URL;
    convex_url = convex_url.replace('https://', 'webcal://');
    convex_url = convex_url.replace('.convex.cloud', '.convex.site');
    convex_url += `/calendar?userId=${user.userId}`;
    return convex_url;
  }, [user]);

  const modalContent = (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ type: "tween", ease: "easeOut", duration: 0.3 }}
      className="bg-background p-8 rounded-lg shadow-lg w-full max-w-md relative"
      onClick={(e) => e.stopPropagation()}
    >
      <h2 className="text-2xl font-bold mb-4">settings</h2>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-1 rounded-full text-gray-500 hover:text-gray-800 hover:bg-gray-200"
        aria-label="Close settings"
      >
        <X className="h-6 w-6" />
      </button>
      <div className="space-y-6">
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
                onClick={() => setTheme(themeName as "light" | "dark" | "gruvbox" | "blue" | "monochrome")}
                className="capitalize"
              >
                {themeName}
              </Button>
            ))}
          </div>
        </div>
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
        <div>
          <h3 className="text-lg font-medium">calendar integration</h3>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Subscribe to your tasks with due dates in your calendar app.</p>
            <ul className="list-disc list-inside pl-2">
              <li>
                <strong>For Google Calendar:</strong> Go to{" "}
                <code className="bg-muted p-1 rounded">Settings &gt; Add Calendar &gt; From URL</code>{" "}
                and enter the link below.
              </li>
              <li>
                <strong>For other calendars:</strong> Look for an option to import an
                iCal calendar and use the link below.
              </li>
            </ul>
            <p className="font-semibold text-destructive">
              Do not share this link. Anyone with this link can access your tasks.
            </p>
          </div>
          <div className="mt-2">
            <ShareLinkComponent link={calendarUrl} />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-medium">authentication key</h3>
          <p className="text-sm text-muted-foreground">
            generate a temporary key to authenticate external applications.
          </p>
          <div className="flex items-center space-x-2 mt-2">
            <Button
              key="generate-auth"
              variant="outline"
              onClick={() => generateAuthKey()}
            >
              generate key
            </Button>
            <Label htmlFor="generate-auth">{getAuthKey === undefined ? "" : getAuthKey}</Label>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      {modalContent}
    </motion.div>,
    document.body,
  );
}
