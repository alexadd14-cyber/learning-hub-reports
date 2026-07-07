export const MOTTO = ["Access", "Aspire", "Achieve"] as const;

/** Colours matched to The Learning Hub report template */
export const brand = {
  purple: "#5D3B8E",
  purpleDark: "#4A2F73",
  purpleDeep: "#3D2560",
  lavender: "#E8E2F2",
  lavenderLight: "#F0ECF7",
  yellow: "#D9C54D",
  yellowBright: "#E8C547",
  cream: "#FAF6ED",
  goldText: "#8B7340",
  white: "#FFFFFF",
  text: "#5D3B8E",
  textMuted: "#5D3B8E",
  textSoft: "#888888",
  pageBg: "#FFFFFF",
} as const;

export function getSubjectLabel(subject: string): string {
  const labels: Record<string, string> = {
    maths: "Maths",
    english: "English",
    science: "Science",
  };
  return labels[subject] ?? subject;
}
