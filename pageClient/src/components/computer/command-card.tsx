"use client"

import { Eye, Loader2, Play, Send, Wand2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

interface CommandCardProps {
  goal: string
  onGoalChange: (value: string) => void
  onObserve: () => void
  onPlan: () => void
  onExecute: () => void
  onRunCycle: () => void
  loadingAction?: "observe" | "plan" | "execute" | "run" | null
}

function LoadingIcon({ active }: { active: boolean }) {
  return active ? <Loader2 className="animate-spin" /> : null
}

export function CommandCard({
  goal,
  onGoalChange,
  onObserve,
  onPlan,
  onExecute,
  onRunCycle,
  loadingAction,
}: CommandCardProps) {
  return (
    <Card className="border-white/10 bg-white/[0.03]">
      <CardHeader>
        <CardTitle>Command Input</CardTitle>
        <CardDescription>
          Write a high-level goal and trigger one phase at a time or run a full
          single control cycle.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          value={goal}
          onChange={(event) => onGoalChange(event.target.value)}
          placeholder="Example: Observe the current screen, then safely open the terminal and check git status."
          className="min-h-28 resize-none border-white/10 bg-[#0f1419]"
        />

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onObserve} disabled={loadingAction !== null}>
            {loadingAction === "observe" ? <LoadingIcon active /> : <Eye />}
            Observe
          </Button>
          <Button variant="outline" onClick={onPlan} disabled={!goal.trim() || loadingAction !== null}>
            {loadingAction === "plan" ? <LoadingIcon active /> : <Wand2 />}
            Plan
          </Button>
          <Button variant="outline" onClick={onExecute} disabled={loadingAction !== null}>
            {loadingAction === "execute" ? <LoadingIcon active /> : <Send />}
            Execute
          </Button>
          <Button onClick={onRunCycle} disabled={!goal.trim() || loadingAction !== null}>
            {loadingAction === "run" ? <LoadingIcon active /> : <Play />}
            Run Cycle
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
