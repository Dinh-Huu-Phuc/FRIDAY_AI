import { sendAgentChat } from "@/api/agentApi"

export function sendMessage(message, channel = "text") {
  return sendAgentChat({ message, channel })
}
