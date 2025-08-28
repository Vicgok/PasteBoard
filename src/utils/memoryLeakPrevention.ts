export class MemoryLeakPrevention {
  private static subscriptions = new Set<() => void>();
  private static timers = new Set<NodeJS.Timeout>();
  private static intervals = new Set<NodeJS.Timeout>();

  static addSubscription(cleanup: () => void) {
    this.subscriptions.add(cleanup);
    return () => {
      this.subscriptions.delete(cleanup);
      cleanup();
    };
  }

  static addTimer(timer: NodeJS.Timeout) {
    this.timers.add(timer);
    return timer;
  }

  static addInterval(interval: NodeJS.Timeout) {
    this.intervals.add(interval);
    return interval;
  }

  static cleanup() {
    // Clean up all subscriptions
    this.subscriptions.forEach((cleanup) => cleanup());
    this.subscriptions.clear();

    // Clear all timers
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();

    // Clear all intervals
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals.clear();
  }
}
