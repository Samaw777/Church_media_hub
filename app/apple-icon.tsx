import { ImageResponse } from "next/og";
import { TallyMark } from "@/lib/tallyMark";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(<TallyMark size={180} />, size);
}
