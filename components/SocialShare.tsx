"use client";

import { useCallback, useState } from "react";
import { shareChannels, uiCopy } from "@/lib/copy";
import { buildProfessorShareUrl, buildShareText } from "@/lib/site";

interface SocialShareProps {
  professorName: string;
  university: string;
  rating?: number;
}

function openShareWindow(url: string) {
  window.open(url, "_blank", "noopener,noreferrer,width=640,height=720");
}

export function SocialShare({ professorName, university, rating }: SocialShareProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = buildProfessorShareUrl(professorName, university);
  const shareText = buildShareText(professorName, university, rating);

  const handleShare = useCallback(
    async (channelId: (typeof shareChannels)[number]["id"]) => {
      const encodedUrl = encodeURIComponent(shareUrl);
      const encodedText = encodeURIComponent(shareText);

      switch (channelId) {
        case "x":
          openShareWindow(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`);
          break;
        case "facebook":
          openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`);
          break;
        case "linkedin":
          openShareWindow(
            `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
          );
          break;
        case "whatsapp":
          openShareWindow(`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`);
          break;
        case "copy":
          try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
          } catch {
            window.prompt("Copy this link:", shareUrl);
          }
          break;
      }
    },
    [shareText, shareUrl],
  );

  return (
    <section className="share-block" aria-labelledby="share-heading">
      <div className="share-head">
        <h3 id="share-heading">{uiCopy.shareHeading}</h3>
        <p className="share-sub">{uiCopy.shareSub}</p>
      </div>
      <p className="share-links">
        {shareChannels.map((channel, index) => {
          const isCopy = channel.id === "copy";
          const label = isCopy && copied ? channel.copiedLabel : channel.label;

          return (
            <span key={channel.id}>
              {index > 0 && <span className="share-sep"> · </span>}
              <button
                type="button"
                className="text-link share-link"
                onClick={() => handleShare(channel.id)}
              >
                {label}
              </button>
            </span>
          );
        })}
      </p>
    </section>
  );
}
