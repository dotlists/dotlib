import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useRef, useState } from "react";
import { toast } from "sonner"; // Assuming Sonner is integrated
import { Eye, EyeOff } from "lucide-react"; // Assuming lucide-react is available

export function ShareLinkComponent({ link }: { link: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showLink, setShowLink] = useState(false);

  const handleCopy = async () => {
    if (inputRef.current) {
      await navigator.clipboard.writeText(inputRef.current.value);
      toast("Link copied!", {
        description: "The shareable link has been copied to your clipboard.",
      });
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <div className="relative flex items-center w-full">
        <Input
          ref={inputRef}
          value={link}
          readOnly
          type={showLink ? "text" : "password"}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShowLink((prev) => !prev)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted"
          aria-label={showLink ? "Hide link" : "Show link"}
        >
          {showLink ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button onClick={() => void handleCopy()}>Copy Link</Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Copy</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
