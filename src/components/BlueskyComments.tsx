import "bluesky-comments/bluesky-comments.css";
import { BlueskyComments } from "bluesky-comments";

interface Props {
  uri: string;
}

export default function BlueskyCommentsSection({ uri }: Props) {
  return (
    <div className="mt-12">
      <BlueskyComments
        uri={uri}
        onEmpty={(details) =>
          console.error("Failed to load comments:", details)
        }
      />
    </div>
  );
}
