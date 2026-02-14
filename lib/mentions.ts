import React from "react";

// Pattern: @FirstName.LastName (e.g., @John.Doe)
const MENTION_REGEX = /@([A-Za-zÀ-ÿ]+)\.([A-Za-zÀ-ÿ]+)/g;

export interface ParsedMention {
  firstName: string;
  lastName: string;
  fullMatch: string;
}

/**
 * Extract all @mentions from text
 */
export function parseMentions(text: string): ParsedMention[] {
  const mentions: ParsedMention[] = [];
  let match;
  const regex = new RegExp(MENTION_REGEX);
  while ((match = regex.exec(text)) !== null) {
    mentions.push({
      firstName: match[1],
      lastName: match[2],
      fullMatch: match[0],
    });
  }
  return mentions;
}

/**
 * Render text with @mentions as clickable links
 */
export function renderTextWithMentions(
  text: string,
  mentionMap?: Map<string, string> // fullMatch -> userId
): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;
  const regex = new RegExp(MENTION_REGEX);

  while ((match = regex.exec(text)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const fullMatch = match[0];
    const userId = mentionMap?.get(fullMatch);

    if (userId) {
      parts.push(
        React.createElement(
          "a",
          {
            key: `mention-${match.index}`,
            href: `/players/${userId}`,
            className: "text-pitch-400 hover:text-pitch-300 font-medium transition-colors",
          },
          fullMatch
        )
      );
    } else {
      parts.push(
        React.createElement(
          "span",
          {
            key: `mention-${match.index}`,
            className: "text-pitch-400 font-medium",
          },
          fullMatch
        )
      );
    }

    lastIndex = match.index + fullMatch.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}
