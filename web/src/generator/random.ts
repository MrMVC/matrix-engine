import { BannerError } from '../i18n/messages.ts'

// Integer seeding, MT19937 tempering and rejection sampling follow CPython's
// _random.Random and random.Random._randbelow_with_getrandbits.
export class PythonRandom {
  private readonly state = new Uint32Array(624)
  private index = 624

  constructor(seed: number) {
    if (!Number.isSafeInteger(seed)) throw new BannerError('seedError')
    const absolute = Math.abs(seed)
    const key = [absolute >>> 0]
    if (absolute >= 2 ** 32) key.push(Math.floor(absolute / 2 ** 32))
    const state = this.state
    state[0] = 19650218
    for (let i = 1; i < state.length; i++) {
      const previous = state[i - 1]
      state[i] = Math.imul(previous ^ (previous >>> 30), 1812433253) + i
    }
    let i = 1
    let j = 0
    for (let k = 0; k < 624; k++) {
      const previous = state[i - 1]
      state[i] = (state[i] ^ Math.imul(previous ^ (previous >>> 30), 1664525)) + key[j] + j
      j = (j + 1) % key.length
      if (++i === 624) { state[0] = state[623]; i = 1 }
    }
    for (let k = 0; k < 623; k++) {
      const previous = state[i - 1]
      state[i] = (state[i] ^ Math.imul(previous ^ (previous >>> 30), 1566083941)) - i
      if (++i === 624) { state[0] = state[623]; i = 1 }
    }
    state[0] = 0x80000000
  }

  word(): number {
    if (this.index === 624) {
      for (let i = 0; i < 624; i++) {
        const y = (this.state[i] & 0x80000000) | (this.state[(i + 1) % 624] & 0x7fffffff)
        this.state[i] = this.state[(i + 397) % 624] ^ (y >>> 1) ^ ((y & 1) ? 0x9908b0df : 0)
      }
      this.index = 0
    }
    let y = this.state[this.index++]
    y ^= y >>> 11
    y ^= (y << 7) & 0x9d2c5680
    y ^= (y << 15) & 0xefc60000
    return (y ^ (y >>> 18)) >>> 0
  }

  uniform(low: number, high: number) {
    const fraction = ((this.word() >>> 5) * 67108864 + (this.word() >>> 6)) / 9007199254740992
    return low + (high - low) * fraction
  }

  range(low: number, high: number) {
    const span = high - low
    if (!Number.isInteger(span) || span < 1 || span > 0xffffffff) throw new BannerError('randomError')
    const shift = Math.clz32(span)
    let draw: number
    do { draw = this.word() >>> shift } while (draw >= span)
    return low + draw
  }
}
