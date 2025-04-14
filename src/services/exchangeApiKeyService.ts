export interface CreateExchangeApiKeyDto {
  exchange_id: string;
  api_key: string;
  api_secret: string;
  key_nickname?: string;
}

export interface TestApiKeyResponse {
  success: boolean;
  message: string;
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

// Function to test an existing API key
export async function testExchangeApiKey(
  apiKeyId: string
): Promise<TestApiKeyResponse> {
  const response = await fetch(`/api/exchange-api-keys/${apiKeyId}/test`, {
    method: "POST",
    headers: {
      // No Content-Type needed for a POST without a body usually,
      // but include if your backend specifically requires it.
      // "Content-Type": "application/json",
    },
    // No body needed for this specific test endpoint based on typical REST patterns for such actions
    credentials: "include", // send cookies for auth if needed
  });

  const data = await response.json().catch(() => ({})); // Attempt to parse JSON, default to empty object on failure

  if (!response.ok) {
    // Use message from response body if available, otherwise provide a default
    throw new Error(data.message || `Failed to test API key (ID: ${apiKeyId}). Status: ${response.status}`);
  }

  // Assuming the backend returns { success: boolean, message: string }
  // Type assertion might be needed if the Promise<any> is enforced elsewhere,
  // but defining the return type as Promise<TestApiKeyResponse> is better.
  return data as TestApiKeyResponse;
}
