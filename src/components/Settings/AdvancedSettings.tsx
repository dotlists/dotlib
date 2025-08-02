import { Button } from "../ui/button";
import { Check, Plus, Trash, } from "lucide-react";
import { api, type Id } from "@/lib/convex";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { Octokit } from "@octokit/rest";
import { toast } from "sonner";
import { Label } from "../ui/label";

interface AdvancedSettingsProps {
  selectedListId: Id<"lists"> | null;
}

export function AdvancedSettings({ selectedListId }: AdvancedSettingsProps) {
  const generateAuthKey = useMutation(api.auth.generateAuthKey);
  const getAuthKey = useQuery(api.auth.getAuthKey);

  const addLinkedRepo = useMutation(api.github.addLinkedRepo);
  const removeLinkedRepo = useMutation(api.github.removeLinkedRepo);
  const associatedRepos = useQuery(api.github.getLinkedRepos, {
    listId: selectedListId == null ? undefined : selectedListId,
  });

  const [currentlyEditing, setCurrentlyEditing] = useState<
    { repo: string; owner: string }[]
  >([]);
  
  return (
    <>
      {/* authentication key */}
      <div>
        <h3 className="text-lg font-medium">authentication key</h3>
        <p className="text-sm text-muted-foreground mt-0">
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
      {/* gh issues integration */}
      <div>
        {associatedRepos && (
          <>
            <h3 className="text-lg font-medium">github integration</h3>
            <p className="text-sm text-muted-foreground mt-0">
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
                              toast("Repo does not exist :(");
                              return;
                            }
                            addLinkedRepo({
                              listId: selectedListId!,
                              repo: edit,
                            });
                            toast(`Linked repository @${edit.owner}/${edit.repo}`, {
                              description: `Press the GitHub icon in the status bar to sync issues`,
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
    </>
  );
}