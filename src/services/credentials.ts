const CREDENTIAL_ID = 'han-chat-openrouter'

export function isCredentialApiAvailable(): boolean {
  return typeof window !== 'undefined' && 'PasswordCredential' in window
}

export async function loadApiKey(): Promise<string | null> {
  if (!isCredentialApiAvailable()) {
    return null
  }

  try {
    const credential = await navigator.credentials.get({
      password: true,
      mediation: 'silent',
    } as CredentialRequestOptions)

    if (credential && 'password' in credential) {
      return (credential as PasswordCredential).password ?? null
    }

    return null
  } catch {
    return null
  }
}

export async function saveApiKey(apiKey: string): Promise<void> {
  if (!isCredentialApiAvailable()) {
    throw new Error('Credential Management API is not available in this browser')
  }

  const credential = new PasswordCredential({
    id: CREDENTIAL_ID,
    password: apiKey,
    name: 'OpenRouter API Key',
  })

  await navigator.credentials.store(credential)
}
