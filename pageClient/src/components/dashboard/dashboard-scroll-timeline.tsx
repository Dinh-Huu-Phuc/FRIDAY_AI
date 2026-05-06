"use client"

import { useEffect, useRef } from "react"
import { animate, onScroll, stagger } from "animejs"
import { Activity, Cpu, Radar } from "lucide-react"
import Image from "next/image"

import { dashboardTimelineItems } from "@/components/dashboard/timeline-data"
import { cn } from "@/lib/utils"

const accentClasses = {
  cyan: {
    text: "text-cyan-200",
    border: "border-cyan-300/30",
    glow: "shadow-[0_0_36px_rgba(34,211,238,0.22)]",
    wash: "from-cyan-400/20",
    dot: "bg-cyan-200 shadow-[0_0_24px_rgba(103,232,249,0.95)]",
  },
  blue: {
    text: "text-blue-200",
    border: "border-blue-300/30",
    glow: "shadow-[0_0_36px_rgba(96,165,250,0.2)]",
    wash: "from-blue-400/20",
    dot: "bg-blue-200 shadow-[0_0_24px_rgba(147,197,253,0.95)]",
  },
  violet: {
    text: "text-violet-200",
    border: "border-violet-300/30",
    glow: "shadow-[0_0_36px_rgba(167,139,250,0.2)]",
    wash: "from-violet-400/20",
    dot: "bg-violet-200 shadow-[0_0_24px_rgba(196,181,253,0.95)]",
  },
  amber: {
    text: "text-amber-200",
    border: "border-amber-300/30",
    glow: "shadow-[0_0_36px_rgba(251,191,36,0.18)]",
    wash: "from-amber-300/20",
    dot: "bg-amber-200 shadow-[0_0_24px_rgba(253,230,138,0.9)]",
  },
} as const

const orbitIcons = [Activity, Radar, Cpu]

function findScrollParent(element: HTMLElement | null) {
  let current = element?.parentElement ?? null

  while (current) {
    const style = window.getComputedStyle(current)
    if (/(auto|scroll|overlay)/.test(`${style.overflowY}${style.overflow}`)) {
      return current
    }
    current = current.parentElement
  }

  return window
}

export function DashboardScrollTimeline() {
  const sectionRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return
    const scrollParent = findScrollParent(section)

    const intro = Array.from(section.querySelectorAll<HTMLElement>("[data-timeline-intro]"))
    const line = section.querySelector<SVGLineElement>("[data-timeline-line]")
    const stops = Array.from(section.querySelectorAll<HTMLElement>("[data-timeline-stop]"))
    const cards = Array.from(section.querySelectorAll<HTMLElement>("[data-timeline-card]"))
    const images = Array.from(section.querySelectorAll<HTMLElement>("[data-timeline-image]"))
    const glows = Array.from(section.querySelectorAll<HTMLElement>("[data-timeline-glow]"))
    const dots = Array.from(section.querySelectorAll<HTMLElement>("[data-timeline-dot]"))
    const textLines = Array.from(section.querySelectorAll<HTMLElement>("[data-timeline-text]"))

    if (!line) return
    const container = scrollParent instanceof Window ? undefined : scrollParent

    const introAnimation = animate(intro, {
      opacity: [0, 1],
      y: [28, 0],
      filter: ["blur(10px)", "blur(0px)"],
      delay: stagger(80),
      duration: 980,
      ease: "outExpo",
      autoplay: onScroll({
        container,
        target: section,
        enter: "top bottom-=18%",
        leave: "top center",
      }),
    })

    const lineAnimation = animate(line, {
      strokeDashoffset: [1200, 0],
      opacity: [0.15, 1],
      ease: "outQuart",
      autoplay: onScroll({
        container,
        target: section,
        enter: "top bottom",
        leave: "bottom top",
        sync: 0.25,
      }),
    })

    const cardAnimations = cards.map((card, index) => {
      const image = images[index]
      const glow = glows[index]
      const dot = dots[index]
      const copy = textLines.filter((node) => node.getAttribute("data-timeline-index") === String(index))
      const stop = stops[index]
      const direction = index % 2 === 0 ? 1 : -1

      return [
        animate(card, {
          opacity: [0.72, 1, 1, 0.72],
          y: [36, 0, 0, -36],
          scale: [1, 1, 1, 1],
          filter: ["none", "none", "none", "none"],
          ease: "linear",
          autoplay: onScroll({
            container,
            target: stop,
            enter: "top bottom",
            leave: "bottom top",
            sync: 0.22,
          }),
        }),
        animate(image, {
          opacity: [0.72, 1, 1, 0.72],
          x: [direction * 8, 0, 0, direction * -8],
          y: [8, 0, 0, -8],
          rotate: [0, 0, 0, 0],
          scale: [1, 1, 1, 1],
          filter: [
            "brightness(1.2) contrast(1.2) saturate(1.2)",
            "brightness(1.38) contrast(1.26) saturate(1.34)",
            "brightness(1.38) contrast(1.26) saturate(1.34)",
            "brightness(1.2) contrast(1.2) saturate(1.2)",
          ],
          ease: "linear",
          autoplay: onScroll({
            container,
            target: stop,
            enter: "top bottom",
            leave: "bottom top",
            sync: 0.18,
          }),
        }),
        animate(copy, {
          opacity: [0.78, 1, 1, 0.78],
          x: [direction * -28, 0, 0, direction * 28],
          y: [28, 0, 0, -28],
          delay: stagger(58),
          ease: "linear",
          autoplay: onScroll({
            container,
            target: stop,
            enter: "top bottom",
            leave: "bottom top",
            sync: 0.25,
          }),
        }),
        animate(glow, {
          opacity: [0.22, 0.72, 0.72, 0.22],
          scale: [0.65, 1.18, 1.18, 0.8],
          ease: "linear",
          autoplay: onScroll({
            container,
            target: stop,
            enter: "top bottom",
            leave: "bottom top",
            sync: 0.16,
          }),
        }),
        animate(dot, {
          opacity: [0.25, 1, 1, 0.25],
          scale: [0.75, 1.45, 1.45, 0.85],
          boxShadow: [
            "0 0 0 rgba(103,232,249,0)",
            "0 0 36px rgba(103,232,249,0.95)",
            "0 0 36px rgba(103,232,249,0.95)",
            "0 0 14px rgba(103,232,249,0.45)",
          ],
          ease: "linear",
          autoplay: onScroll({
            container,
            target: stop,
            enter: "top bottom",
            leave: "bottom top",
            sync: 0.16,
          }),
        }),
      ]
    })

    const pulse = animate(glows, {
      opacity: [0.22, 0.56],
      scale: [0.94, 1.06],
      duration: 1800,
      alternate: true,
      loop: true,
      ease: "inOutSine",
    })

    const activeObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const card = entry.target as HTMLElement
          const index = Number(card.dataset.timelineIndex)
          const dot = dots[index]
          if (!dot) return

          animate(dot, {
            scale: entry.isIntersecting ? 1.65 : 1,
            opacity: entry.isIntersecting ? 1 : 0.5,
            duration: 620,
            ease: "outExpo",
          })
        })
      },
      {
        root: scrollParent instanceof Window ? null : scrollParent,
        threshold: 0.48,
      }
    )

    cards.forEach((card) => activeObserver.observe(card))

    return () => {
      activeObserver.disconnect()
      pulse.revert()
      introAnimation.revert()
      lineAnimation.revert()
      cardAnimations.flat().forEach((animation) => animation.revert())
    }
  }, [])

  return (
    <section ref={sectionRef} className="relative overflow-clip bg-black">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(34,211,238,0.13),transparent_28%),radial-gradient(circle_at_82%_48%,rgba(251,191,36,0.1),transparent_26%),linear-gradient(180deg,#000_0%,#07090d_42%,#000_100%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:44px_44px] opacity-30" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle,rgba(255,255,255,0.16)_1px,transparent_1px)] bg-[size:18px_18px] opacity-[0.045]" />

      <div className="relative px-4 py-20 sm:px-6 lg:px-10">
        <div className="mx-auto w-full max-w-[1280px]">
          <div className="mb-10 max-w-3xl">
            <div data-timeline-intro className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-200/8 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-100 opacity-0 shadow-[0_0_34px_rgba(34,211,238,0.12)]">
              <span className="size-1.5 rounded-full bg-cyan-100 shadow-[0_0_18px_rgba(165,243,252,0.95)]" />
              Command Timeline
            </div>
            <h2 data-timeline-intro className="max-w-3xl text-3xl font-semibold leading-tight text-white opacity-0 [text-shadow:0_0_34px_rgba(34,211,238,0.18)] sm:text-4xl lg:text-5xl">
              Scroll through the FRIDAY operating sequence.
            </h2>
            <p data-timeline-intro className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400 opacity-0 sm:text-base">
              A cinematic readout of how telemetry, visual context, task state, and human approval converge inside the dashboard.
            </p>
          </div>

          <div className="relative pb-[22vh]">
            <div className="absolute left-4 top-0 hidden h-full w-5 -translate-x-1/2 md:block lg:left-1/2">
              <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-cyan-200/10" />
              <svg className="absolute inset-0 h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 20 1200" aria-hidden="true">
                <line
                data-timeline-line
                  x1="10"
                  x2="10"
                  y1="0"
                  y2="1200"
                  stroke="rgb(103 232 249)"
                  strokeWidth="1.25"
                  strokeDasharray="1200"
                  strokeDashoffset="1200"
                  vectorEffect="non-scaling-stroke"
                  className="drop-shadow-[0_0_16px_rgba(103,232,249,0.9)]"
                />
              </svg>
            </div>

            <div className="grid">
              {dashboardTimelineItems.map((item, index) => {
                const accent = accentClasses[item.accent as keyof typeof accentClasses]
                const OrbitIcon = orbitIcons[index % orbitIcons.length]
                const alignRight = index % 2 === 0

                return (
                  <div key={item.id} data-timeline-stop className="relative min-h-[115vh] py-[12vh]">
                    <article
                      data-timeline-card
                      data-timeline-index={index}
                      className={cn(
                        "sticky top-[16vh] grid min-h-[430px] gap-0 overflow-hidden opacity-100 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center",
                        alignRight ? "" : ""
                      )}
                    >

                      <div
                        data-timeline-dot
                        className={cn(
                          "absolute top-8 hidden size-3 rounded-full opacity-50 md:block",
                          accent.dot,
                          alignRight ? "-left-[2.42rem] lg:-left-[2.43rem]" : "-right-[2.42rem] lg:-right-[2.43rem]"
                        )}
                      />

                      <div
                        className={cn(
                          "mx-6 max-w-[680px] rounded-lg border border-cyan-100/20 bg-white/[0.045] p-9 shadow-[0_0_42px_rgba(34,211,238,0.08),inset_0_1px_0_rgba(255,255,255,0.08)] md:mx-14 lg:p-11",
                          alignRight ? "md:order-1 md:justify-self-end" : "md:order-2 md:justify-self-start"
                        )}
                      >
                        <p data-timeline-text data-timeline-index={index} className={cn("text-[12px] font-bold uppercase tracking-[0.22em] opacity-100", accent.text)}>
                          {item.phase}
                        </p>
                        <h3 data-timeline-text data-timeline-index={index} className="mt-5 text-4xl font-bold leading-tight text-white opacity-100">
                          {item.title}
                        </h3>
                        <p data-timeline-text data-timeline-index={index} className="mt-6 max-w-[58ch] text-[17px] font-semibold leading-8 text-white/90 opacity-100">
                          {item.description}
                        </p>
                        <div data-timeline-text data-timeline-index={index} className="mt-8 inline-flex w-fit items-center gap-2 rounded-full border border-cyan-100/20 bg-cyan-100/10 px-3.5 py-2 text-xs font-semibold text-white opacity-100">
                          <span className={cn("size-1.5 rounded-full", accent.dot)} />
                          {item.metric}
                        </div>
                      </div>

                      <div
                        data-timeline-parallax
                        className={cn(
                          "relative h-[390px] w-[calc(100%-7rem)] overflow-hidden rounded-lg border bg-white/[0.035] md:w-[calc(100%-8rem)]",
                          accent.border,
                          accent.glow,
                          alignRight ? "md:order-2 md:justify-self-start md:ml-14 md:mr-0" : "md:order-1 md:ml-0 md:mr-14 md:justify-self-end"
                        )}
                      >
                        <div data-timeline-glow className={cn("absolute inset-8 rounded-full bg-radial opacity-20 blur-2xl", accent.wash)} />
                        <Image
                          data-timeline-image
                          src={item.imageSrc}
                          alt={item.imageAlt}
                          fill
                          quality={100}
                          priority={index === 0}
                          className="z-10 object-cover opacity-100"
                          placeholder="blur"
                          sizes="(min-width: 1280px) 720px, (min-width: 768px) 48vw, 92vw"
                        />
                        <div className="absolute inset-0 z-20 bg-[linear-gradient(135deg,rgba(255,255,255,0.02),transparent_30%,rgba(0,0,0,0.01))]" />
                        <OrbitIcon className={cn("absolute bottom-3 right-3 z-30 size-5", accent.text)} />
                      </div>
                    </article>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
