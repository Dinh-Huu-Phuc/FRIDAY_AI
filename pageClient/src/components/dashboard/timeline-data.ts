import type { StaticImageData } from "next/image"

import fridayImageOne from "@/assets/img/FRIDAY_IMG1.png"
import fridayImageTwo from "@/assets/img/FRIDAY_IMG2.png"
import fridayImageThree from "@/assets/img/FRIDAY_IMG3.png"

export interface DashboardTimelineItem {
  id: string
  phase: string
  title: string
  description: string
  metric: string
  imageSrc: StaticImageData
  imageAlt: string
  accent: string
}

export const dashboardTimelineItems: DashboardTimelineItem[] = [
  {
    id: "runtime-sync",
    phase: "01 / Runtime Sync",
    title: "System telemetry locks into the command layer",
    description:
      "FRIDAY correlates backend state, safety mode, active window context, and agent readiness before accepting operator intent.",
    metric: "98.7% signal confidence",
    imageSrc: fridayImageOne,
    imageAlt: "FRIDAY command center visual",
    accent: "cyan",
  },
  {
    id: "visual-parse",
    phase: "02 / Visual Parse",
    title: "Screen observations become tactical context",
    description:
      "Recent screenshots, OCR hints, and window metadata are normalized into a high-fidelity operating picture for the next action.",
    metric: "42ms observation pass",
    imageSrc: fridayImageTwo,
    imageAlt: "FRIDAY tactical interface visual",
    accent: "blue",
  },
  {
    id: "task-orbit",
    phase: "03 / Task Orbit",
    title: "Memory, tools, and task state move in formation",
    description:
      "The dashboard surfaces active objectives, recent decisions, and execution risk so the agent stays inside the approved envelope.",
    metric: "12 active channels",
    imageSrc: fridayImageThree,
    imageAlt: "FRIDAY operating sequence visual",
    accent: "violet",
  },
]
