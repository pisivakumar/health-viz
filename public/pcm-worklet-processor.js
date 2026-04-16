/**
 * AudioWorklet processor that captures mic input and resamples to 16kHz PCM 16-bit LE.
 * Buffers ~100ms of audio before posting to the main thread.
 */
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
    this._bufferSize = 1600; // 100ms at 16kHz
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channelData = input[0]; // mono
    const inputSampleRate = sampleRate; // global in AudioWorkletGlobalScope
    const targetRate = 16000;

    // Downsample: simple linear interpolation
    const ratio = inputSampleRate / targetRate;
    for (let i = 0; i < channelData.length / ratio; i++) {
      const srcIdx = i * ratio;
      const lo = Math.floor(srcIdx);
      const hi = Math.min(lo + 1, channelData.length - 1);
      const frac = srcIdx - lo;
      const sample = channelData[lo] * (1 - frac) + channelData[hi] * frac;

      // Convert float32 [-1,1] to int16
      const int16 = Math.max(-32768, Math.min(32767, Math.round(sample * 32767)));
      this._buffer.push(int16);
    }

    // Flush buffer when we have enough
    while (this._buffer.length >= this._bufferSize) {
      const chunk = this._buffer.splice(0, this._bufferSize);
      const pcm = new Int16Array(chunk);
      this.port.postMessage({ pcm: pcm.buffer }, [pcm.buffer]);
    }

    return true;
  }
}

registerProcessor("pcm-processor", PCMProcessor);
