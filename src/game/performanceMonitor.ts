import * as THREE from 'three';

export interface PerfStats {
  fps: number;
  minFps: number;
  maxFps: number;
  frametimeMs: number;
  minFrametimeMs: number;
  maxFrametimeMs: number;
  drawCalls: number;
  triangles: number;
  textures: number;
  geometries: number;
  jsHeapUsedMb?: number;
  jsHeapTotalMb?: number;
}

export class PerformanceMonitor {
  private frameTimes: number[] = [];
  private readonly maxSamples = 60;
  private lastTime = performance.now();
  private cachedStats: PerfStats = {
    fps: 60,
    minFps: 60,
    maxFps: 60,
    frametimeMs: 16.6,
    minFrametimeMs: 16.6,
    maxFrametimeMs: 16.6,
    drawCalls: 0,
    triangles: 0,
    textures: 0,
    geometries: 0,
  };
  private sampleTimer = 0;

  public update(renderer: THREE.WebGLRenderer): PerfStats {
    const now = performance.now();
    const deltaMs = Math.max(0.5, now - this.lastTime);
    this.lastTime = now;

    this.frameTimes.push(deltaMs);
    if (this.frameTimes.length > this.maxSamples) {
      this.frameTimes.shift();
    }

    this.sampleTimer += deltaMs;
    // Recalculate full aggregated metrics every 100ms to avoid DOM thrash
    if (this.sampleTimer >= 100 && this.frameTimes.length > 0) {
      this.sampleTimer = 0;

      let sum = 0;
      let minFt = Number.POSITIVE_INFINITY;
      let maxFt = 0;

      for (let i = 0; i < this.frameTimes.length; i++) {
        const ft = this.frameTimes[i];
        sum += ft;
        if (ft < minFt) minFt = ft;
        if (ft > maxFt) maxFt = ft;
      }

      const avgFt = sum / this.frameTimes.length;
      const currentFps = Math.round(1000 / avgFt);
      const minFps = maxFt > 0 ? Math.round(1000 / maxFt) : currentFps;
      const maxFps = minFt > 0 ? Math.round(1000 / minFt) : currentFps;

      let jsHeapUsedMb: number | undefined;
      let jsHeapTotalMb: number | undefined;

      // Chrome / Android WebView performance.memory API
      const perfMemory = (performance as unknown as { memory?: { usedJSHeapSize: number; totalJSHeapSize: number } }).memory;
      if (perfMemory && typeof perfMemory.usedJSHeapSize === 'number') {
        jsHeapUsedMb = Math.round((perfMemory.usedJSHeapSize / (1024 * 1024)) * 10) / 10;
        jsHeapTotalMb = Math.round((perfMemory.totalJSHeapSize / (1024 * 1024)) * 10) / 10;
      }

      this.cachedStats = {
        fps: Math.min(240, Math.max(1, currentFps)),
        minFps: Math.min(240, Math.max(1, minFps)),
        maxFps: Math.min(240, Math.max(1, maxFps)),
        frametimeMs: Math.round(avgFt * 10) / 10,
        minFrametimeMs: Math.round(minFt * 10) / 10,
        maxFrametimeMs: Math.round(maxFt * 10) / 10,
        drawCalls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        textures: renderer.info.memory.textures,
        geometries: renderer.info.memory.geometries,
        jsHeapUsedMb,
        jsHeapTotalMb,
      };
    }

    return this.cachedStats;
  }

  public getStats(): PerfStats {
    return this.cachedStats;
  }
}
