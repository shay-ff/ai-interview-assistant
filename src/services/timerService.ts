export class TimerService {
  private timerId: number | null = null;
  private startTime: number | null = null;
  // private _duration: number = 0; // Unused property
  private remainingTime: number = 0;
  private onTick: ((remaining: number) => void) | null = null;
  private onComplete: (() => void) | null = null;
  private isActive: boolean = false;
  private paused: boolean = false;

  startTimer(
    duration: number,
    onTick: (remaining: number) => void,
    onComplete: () => void
  ): void {
    // Don't start if already running
    if (this.isActive) {
      return;
    }

    // Handle edge cases
    if (duration <= 0) {
      onComplete();
      return;
    }

    // this._duration = duration; // Unused property assignment
    this.remainingTime = duration;
    this.onTick = onTick;
    this.onComplete = onComplete;
    this.startTime = Date.now();
    this.isActive = true;
    this.paused = false;

    this.tick();
  }

  private tick(): void {
    if (!this.isActive || this.paused) {
      return;
    }

    try {
      if (this.onTick) {
        this.onTick(this.remainingTime);
      }
    } catch (error) {
      console.error('Timer onTick callback error:', error);
    }

    if (this.remainingTime <= 0) {
      this.complete();
      return;
    }

    this.remainingTime--;
    this.timerId = window.setTimeout(() => this.tick(), 1000);
  }

  private complete(): void {
    this.isActive = false;
    this.paused = false;
    this.remainingTime = 0;
    
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }

    try {
      if (this.onComplete) {
        this.onComplete();
      }
    } catch (error) {
      console.error('Timer onComplete callback error:', error);
    }
  }

  pauseTimer(): void {
    if (!this.isActive || this.paused) {
      return;
    }

    this.paused = true;
    this.isActive = false;

    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  resumeTimer(): void {
    if (!this.paused) {
      return;
    }

    this.paused = false;
    this.isActive = true;
    this.tick();
  }

  resetTimer(): void {
    this.isActive = false;
    this.paused = false;
    this.remainingTime = 0;
    // this._duration = 0; // Unused property assignment
    this.startTime = null;
    this.onTick = null;
    this.onComplete = null;

    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  getCurrentTime(): number {
    return this.remainingTime;
  }

  isRunning(): boolean {
    return this.isActive && !this.paused;
  }

  isPaused(): boolean {
    return this.paused;
  }

  getStartTime(): number | null {
    return this.startTime;
  }
}