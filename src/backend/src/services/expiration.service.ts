import { ExpirationRepository, type ExpirationSweepResult } from "../repositories/expiration.repository.js";

export class ExpirationService {
  private running = false;

  constructor(private readonly repository = new ExpirationRepository()) {}

  async sweep(): Promise<ExpirationSweepResult> {
    if (this.running) return { submittedAttempts: 0, closedExams: 0 };
    this.running = true;
    try {
      return await this.repository.sweep();
    } finally {
      this.running = false;
    }
  }
}

export const startExpirationScheduler = (
  service = new ExpirationService(),
  intervalMs = Number(process.env.EXPIRATION_SWEEP_INTERVAL_MS ?? 60_000),
) => {
  const run = () => service.sweep().catch((error) => console.error("Expiration sweep failed:", error));
  void run();
  const timer = setInterval(run, intervalMs);
  timer.unref();
  return () => clearInterval(timer);
};
