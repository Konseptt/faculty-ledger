"use client";

import { bookmarkCopy } from "@/lib/copy";
import type { ProfessorResultWithMeta } from "@/lib/types";

interface ProfessorProfileProps {
  data: ProfessorResultWithMeta;
  isFavorited?: boolean;
  onToggleFavorite?: () => void;
}

export function ProfessorProfile({ data, isFavorited, onToggleFavorite }: ProfessorProfileProps) {
  const bookmarkLabel = isFavorited ? bookmarkCopy.saved : bookmarkCopy.save;

  return (
    <section className="profile-block" id="result-profile" tabIndex={-1}>
      {data.photoUrl ? (
        <figure className="portrait-frame">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.photoUrl}
            alt={`Photo of ${data.fullName}`}
            className="portrait-photo"
            loading="lazy"
          />
          {data.facultyProfileUrl && (
            <figcaption className="photo-credit">
              <a
                href={data.facultyProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View faculty profile page (opens in new tab)"
              >
                Photo source
              </a>
            </figcaption>
          )}
        </figure>
      ) : (
        <div className="portrait-placeholder" aria-label="No photo available" role="img" />
      )}

      <h2 className="profile-name">{data.fullName}</h2>

      {onToggleFavorite && (
        <button
          type="button"
          className="text-link bookmark-link"
          onClick={onToggleFavorite}
          aria-pressed={isFavorited}
        >
          {bookmarkLabel}
        </button>
      )}

      <p className="profile-meta">{data.department}</p>
      <p className="profile-meta">{data.university}</p>
      <p className="profile-since">Teaching since {data.teachingSince}</p>
    </section>
  );
}
