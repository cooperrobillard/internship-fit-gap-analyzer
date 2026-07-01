import { renderSocialCard, socialCardSize } from "@/lib/social-card";

export const alt = "Job Fit & Skill-Gap Analyzer — rule-based career planning workspace";
export const size = socialCardSize;
export const contentType = "image/png";

export default function Image() {
  return renderSocialCard();
}
