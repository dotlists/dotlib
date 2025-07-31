import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Check, Plus, Trash, X } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useSettings } from "@/contexts/SettingsContext";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { api, type Id } from "@/lib/convex";
import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { ShareLinkComponent } from "./ui/ShareLink";
import { Octokit } from "@octokit/rest";

const THEMES = ["light", "dark", "midnight", "gruvbox", "blue", "monochrome"];

interface SettingsProps {
  onClose: () => void;
  selectedListId: Id<"lists"> | null;
}

export function Settings({ onClose, selectedListId }: SettingsProps) {
  const { theme, setTheme } = useTheme();
  const { isSimpleMode, setIsSimpleMode } = useSettings();

  const [currentlyEditing, setCurrentlyEditing] = useState<
    { repo: string; owner: string }[]
  >([]);

  const generateAuthKey = useMutation(api.auth.generateAuthKey);
  const addLinkedRepo = useMutation(api.github.addLinkedRepo);
  const removeLinkedRepo = useMutation(api.github.removeLinkedRepo);
  const getAuthKey = useQuery(api.auth.getAuthKey);
  const user = useQuery(api.main.getMyUserProfile);

  const associatedRepos = useQuery(api.github.getLinkedRepos, {
    listId: selectedListId == null ? undefined : selectedListId,
  });

  const calendarUrl = useMemo(() => {
    if (!user) return "";
    let convex_url = import.meta.env.VITE_CONVEX_URL;
    convex_url = convex_url.replace("https://", "webcal://");
    convex_url = convex_url.replace(".convex.cloud", ".convex.site");
    convex_url += `/calendar?userId=${user.userId}`;
    return convex_url;
  }, [user]);

  const modalContent = (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ type: "tween", ease: "easeOut", duration: 0.3 }}
      className="bg-background p-8 rounded-lg shadow-lg w-full max-w-2xl relative h-5/6 overflow-y-scroll overflow-x-hidden"
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
                onClick={() =>
                  setTheme(
                    themeName as
                      | "light"
                      | "dark"
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
        <div>
          {associatedRepos && (
            <>
              <h3 className="text-lg font-medium">github integration</h3>
              <p className="">
                dotlist supports syncing lists with issues from github
                repositoes
              </p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  listing {associatedRepos.repos.length} linked github
                  repositories for{" "}
                  <code className="bg-muted p-1 rounded">
                    {associatedRepos.name}
                  </code>
                </p>
                <div className="flex flex-wrap gap-2">
                  {associatedRepos.repos.map((repo, i) => (
                    <div className="flex !h-10 text-lg bg-primary text-primary-foreground rounded-full px-2" key={i}>
                      <a
                        href={`https://github.com/${repo.owner}/${repo.repo}`}
                        className="bg-transparent pt-1.5 border-none"
                      >{`${repo.owner}/${repo.repo}`}</a>
                      <Button
                        variant="ghost"
                        className="w-0 hover:bg-transparent my-auto"
                        onClick={() => {
                          if (selectedListId) {
                            removeLinkedRepo({
                              listId: selectedListId,
                              repo,
                            });
                          }
                        }}
                      >
                        <Trash className="text-destructive" strokeWidth={3} />
                      </Button>
                    </div>
                  ))}
                  {currentlyEditing.map((edit, index) => {
                    const disabled =
                      associatedRepos.repos.some(
                        (r) => r.owner === edit.owner && r.repo === edit.repo,
                      ) ||
                      edit.owner == "" ||
                      edit.repo == "";
                    return (
                      <div className="text-lg bg-secondary text-secondary-foreground flex !h-10 px-2 rounded-full" key={index}>
                        <input
                          className="bg-transparent w-24 text-center my-auto !outline-none"
                          placeholder="owner"
                          value={edit.owner}
                          onChange={(e) => {
                            const newOwner = e.target.value;
                            setCurrentlyEditing((edits) =>
                              edits.map((item, i) =>
                                i === index
                                  ? { ...item, owner: newOwner }
                                  : item,
                              ),
                            );
                          }}
                        />
                        <span className="text-lg my-auto">/</span>
                        <input
                          className="bg-transparent w-24 text-center !outline-none my-auto"
                          placeholder="repo name"
                          value={edit.repo}
                          onChange={(e) => {
                            const newRepo = e.target.value;
                            setCurrentlyEditing((edits) =>
                              edits.map((item, i) =>
                                i === index ? { ...item, repo: newRepo } : item,
                              ),
                            );
                          }}
                        />
                        <Button
                          variant="ghost"
                          className="w-0 h-10"
                          onClick={() => {
                            setCurrentlyEditing((edits) =>
                              edits.filter((_, i) => i !== index),
                            );
                          }}
                        >
                          <Trash className="text-destructive" strokeWidth={3} />
                        </Button>
                        <Button
                          variant="ghost"
                          className="w-0 !h-10"
                          disabled={disabled}
                          onClick={async () => {
                            if (!disabled && selectedListId) {
                              const octokit = new Octokit();
                              try {
                                await octokit.repos.get(edit);
                              }
                              catch {
                                alert("Repo does not exist.")
                                return;
                              }
                              addLinkedRepo({
                                listId: selectedListId!,
                                repo: edit,
                              });
                              setCurrentlyEditing((edits) =>
                                edits.filter((_, i) => i !== index),
                              );
                            }
                          }}
                        >
                          <Check
                            className={`${disabled ? "text-gray-400" : " text-green-500"}`}
                            strokeWidth={3}
                          />
                        </Button>
                      </div>
                    );
                  })}
                  <Button
                    variant="ghost"
                    className="w-4 h-8"
                    onClick={() => {
                      setCurrentlyEditing((edit) =>
                        edit.concat([{ owner: "", repo: "" }]),
                      );
                    }}
                  >
                    <Plus className="w-full h-full" />
                  </Button>
                </div>
              </div>
            </>
          )}
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
      {modalContent}
    </motion.div>,
    document.body,
  );
}
