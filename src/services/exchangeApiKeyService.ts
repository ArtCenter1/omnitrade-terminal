import { getAuth } from "firebase/auth"; // Import getAuth
import { app } from "@/integrations/firebase/client"; // Import Firebase app instance

const auth = getAuth(app); // Get the auth service instance

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
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated.");
  }
  const token = await user.getIdToken();

  const response = await fetch("/api/exchange-api-keys", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      'Authorization': `Bearer ${token}`, // Add Authorization header
    },
    body: JSON.stringify(dto),
    // credentials: "include", // Remove or keep based on whether cookies are still needed alongside token auth
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
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User not authenticated.");
  }
  const token = await user.getIdToken();

  const response = await fetch(`/api/exchange-api-keys/${apiKeyId}/test`, {
    method: "POST",
    headers: {
      // "Content-Type": "application/json", // Keep commented or remove if not needed
      'Authorization': `Bearer ${token}`, // Add Authorization header
    },
    // No body needed for this specific test endpoint
    // credentials: "include", // Remove or keep based on whether cookies are still needed alongside token auth
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
