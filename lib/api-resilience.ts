export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
}

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;
  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      successThreshold: config.successThreshold || 2,
      timeout: config.timeout || 60000,
    };
  }

  getState(): CircuitState {
    if (this.state === CircuitState.OPEN) {
      if (this.lastFailureTime && Date.now() - this.lastFailureTime > this.config.timeout) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      }
    }
    return this.state;
  }

  recordSuccess(): void {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
      }
    }
  }

  recordFailure(): void {
    this.lastFailureTime = Date.now();
    this.failureCount++;

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }

  canExecute(): boolean {
    return this.getState() !== CircuitState.OPEN;
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
  }
}

class ExponentialBackoff {
  private baseDelay: number;
  private maxDelay: number;
  private maxRetries: number;

  constructor(baseDelay = 1000, maxDelay = 30000, maxRetries = 5) {
    this.baseDelay = baseDelay;
    this.maxDelay = maxDelay;
    this.maxRetries = maxRetries;
  }

  getDelay(retryCount: number): number {
    const delay = Math.min(
      this.baseDelay * Math.pow(2, retryCount),
      this.maxDelay
    );
    // Add jitter (±10%)
    const jitter = delay * 0.1 * (Math.random() * 2 - 1);
    return Math.max(0, delay + jitter);
  }

  canRetry(retryCount: number): boolean {
    return retryCount < this.maxRetries;
  }
}

export class ApiResilienceService {
  private static instance: ApiResilienceService;
  private circuitBreaker: CircuitBreaker;
  private exponentialBackoff: ExponentialBackoff;

  private constructor() {
    this.circuitBreaker = new CircuitBreaker();
    this.exponentialBackoff = new ExponentialBackoff();
  }

  static getInstance(): ApiResilienceService {
    if (!ApiResilienceService.instance) {
      ApiResilienceService.instance = new ApiResilienceService();
    }
    return ApiResilienceService.instance;
  }

  /**
   * Execute function with circuit breaker and retry logic
   */
  async execute<T>(
    fn: () => Promise<T>,
    onRetry?: (retryCount: number, delay: number) => void
  ): Promise<T> {
    if (!this.circuitBreaker.canExecute()) {
      throw new Error('Circuit breaker is OPEN. Service temporarily unavailable.');
    }

    let lastError: Error | null = null;
    let retryCount = 0;

    while (this.exponentialBackoff.canRetry(retryCount)) {
      try {
        const result = await fn();
        this.circuitBreaker.recordSuccess();
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        this.circuitBreaker.recordFailure();

        if (this.exponentialBackoff.canRetry(retryCount + 1)) {
          const delay = this.exponentialBackoff.getDelay(retryCount);
          console.log(`[ApiResilience] Retry ${retryCount + 1} after ${delay}ms`);
          onRetry?.(retryCount + 1, delay);
          await new Promise(resolve => setTimeout(resolve, delay));
        }

        retryCount++;
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }

  /**
   * Get circuit breaker state
   */
  getCircuitState(): CircuitState {
    return this.circuitBreaker.getState();
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker.reset();
  }

  /**
   * Check if service is available
   */
  isAvailable(): boolean {
    return this.circuitBreaker.canExecute();
  }
}

export const apiResilience = ApiResilienceService.getInstance();
