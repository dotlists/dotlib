// src/components/CommentSection.tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "@/lib/convex";
import { useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import type { Id } from "@/lib/convex";

interface CommentSectionProps {
  itemId: Id<"items">;
}

export function CommentSection({ itemId }: CommentSectionProps) {
  const comments = useQuery(api.comments.getComments, { itemId });
  const addComment = useMutation(api.comments.addComment);
  const [newComment, setNewComment] = useState("");

  const handleAddComment = () => {
    if (newComment.trim() !== "") {
      addComment({ itemId, text: newComment.trim() });
      setNewComment("");
    }
  };

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
      <h4 className="font-bold mb-2">comments</h4>
      <div className="space-y-2">
        {comments?.map((comment) => (
          <div key={comment._id} className="text-sm">
            <span className="font-semibold">{comment.author}: </span>
            <span>{comment.text}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="add a comment..."
          className="text-sm"
        />
        <Button onClick={handleAddComment} size="sm">
          send
        </Button>
      </div>
    </div>
  );
}