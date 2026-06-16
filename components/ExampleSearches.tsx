"use client";

import { exampleSearches } from "@/lib/examples";

interface ExampleSearchesProps {
  onPick: (name: string, university: string) => void;
  disabled?: boolean;
}

export function ExampleSearches({ onPick, disabled }: ExampleSearchesProps) {
  return (
    <div className="example-searches" aria-labelledby="example-searches-label">
      <p className="example-searches-label" id="example-searches-label">
        Sample lookups
      </p>
      <ul className="example-links">
        {exampleSearches.map((example) => (
          <li key={`${example.name}-${example.university}`}>
            <button
              type="button"
              className="text-link"
              disabled={disabled}
              onClick={() => onPick(example.name, example.university)}
            >
              {example.name}
            </button>
            <span className="example-meta">
              , {example.label}, {example.university}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
