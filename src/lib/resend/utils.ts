// Resend API utility functions

export function isValidResendApiKey(apiKey: string): boolean {
  return apiKey.startsWith('re_') && apiKey.length > 10;
}

export function formatResendError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred with the Resend API';
}
