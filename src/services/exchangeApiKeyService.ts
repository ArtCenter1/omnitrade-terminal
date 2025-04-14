export interface CreateExchangeApiKeyDto {
  exchange_id: string;
  api_key: string;
  api_secret: string;
  key_nickname?: string;
}

export async function addExchangeApiKey(
  dto: CreateExchangeApiKeyDto
): Promise<any> {
  const response = await fetch("/api/exchange-api-keys", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(dto),
    credentials: "include", // send cookies for auth if needed
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Failed to add exchange API key");
  }
  return response.json();
}
