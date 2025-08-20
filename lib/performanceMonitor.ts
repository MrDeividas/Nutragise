// Simple performance monitoring utility
interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

class PerformanceMonitor {
  private metrics = new Map<string, PerformanceMetric>();
  private isEnabled = __DEV__; // Only enable in development

  start(metricName: string): void {
    if (!this.isEnabled) return;
    
    this.metrics.set(metricName, {
      name: metricName,
      startTime: performance.now()
    });
  }

  end(metricName: string): number | null {
    if (!this.isEnabled) return null;
    
    const metric = this.metrics.get(metricName);
    if (!metric) {
      console.warn(`Performance metric "${metricName}" not found`);
      return null;
    }

    const endTime = performance.now();
    const duration = endTime - metric.startTime;
    
    metric.endTime = endTime;
    metric.duration = duration;

    // Log slow operations
    if (duration > 1000) { // Over 1 second
      console.warn(`🐌 Slow operation: ${metricName} took ${duration.toFixed(2)}ms`);
    } else if (duration > 100) { // Over 100ms
      console.log(`⚠️ ${metricName} took ${duration.toFixed(2)}ms`);
    } else {
      console.log(`✅ ${metricName} completed in ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  // Utility method for timing async operations
  async time<T>(metricName: string, operation: () => Promise<T>): Promise<T> {
    if (!this.isEnabled) {
      return operation();
    }

    this.start(metricName);
    try {
      const result = await operation();
      this.end(metricName);
      return result;
    } catch (error) {
      this.end(metricName);
      throw error;
    }
  }

  // Get performance summary
  getSummary(): PerformanceMetric[] {
    if (!this.isEnabled) return [];
    
    return Array.from(this.metrics.values())
      .filter(metric => metric.duration !== undefined)
      .sort((a, b) => (b.duration! - a.duration!));
  }

  // Clear all metrics
  clear(): void {
    this.metrics.clear();
  }

  // Check for memory usage (basic)
  checkMemoryUsage(): void {
    if (!this.isEnabled) return;

    // Check if memory API is available (Chrome/V8 only)
    const memory = (performance as any).memory;
    if (!memory) return;

    const used = Math.round(memory.usedJSHeapSize / 1048576); // Convert to MB
    const total = Math.round(memory.totalJSHeapSize / 1048576);
    const limit = Math.round(memory.jsHeapSizeLimit / 1048576);

    console.log(`📊 Memory: ${used}MB used / ${total}MB total / ${limit}MB limit`);

    // Warn if memory usage is high
    if (used / limit > 0.8) {
      console.warn(`🚨 High memory usage: ${used}MB (${Math.round(used / limit * 100)}%)`);
    }
  }
}

export const performanceMonitor = new PerformanceMonitor(); 