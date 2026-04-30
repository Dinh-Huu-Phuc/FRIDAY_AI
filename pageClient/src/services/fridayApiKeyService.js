import * as fridayApiKeyApi from "@/api/fridayApiKeyApi"

export function verifyAndSaveKey(apiKey) {
  return fridayApiKeyApi.verifyFridayApiKey(apiKey)
}

export function getConnectedKeyStatus() {
  return fridayApiKeyApi.getFridayApiKeyStatus()
}

export function disconnectKey() {
  return fridayApiKeyApi.disconnectFridayApiKey()
}
