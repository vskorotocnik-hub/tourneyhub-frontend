/**
 * Retry helper for Prisma serializable transactions.
 * Retries on P2034 (serialization failure) with exponential jitter.
 */
export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      const isRetryable = err?.code === 'P2034' || err?.message?.includes('could not serialize');
      if (isRetryable && attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, 50 + Math.random() * 150));
        continue;
      }
      throw err;
    }
  }
  throw new Error('Max retries exceeded');
}
