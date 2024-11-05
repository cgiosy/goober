const Benchmark = require('benchmark');

const encoder = new TextEncoder();
let bufferLength = 16384;
let buffer = new ArrayBuffer(bufferLength);
let uint8View = new Uint8Array(buffer);
let dataView = new DataView(buffer);
const rotl32 = (x, r) => (x << r) | (x >>> 32 - r);
const xxh32 = (str) => {
  const strLen = str.length | 0;
  if (strLen > bufferLength) {
    bufferLength = (strLen - 1 | 4095) + 1 | 0;
    buffer = new ArrayBuffer(bufferLength);
    uint8View = new Uint8Array(buffer);
    dataView = new DataView(buffer);
  }

  const seed = 0;
  const len = encoder.encodeInto(str, uint8View).written | 0;
  let i = 0;
  let h = (seed + len | 0) + 0x165667B1 | 0;

  if (len < 16) {
    for (; (i + 3 | 0) < len; i = i + 4 | 0)
      h = Math.imul(rotl32(h + Math.imul(dataView.getUint32(i, true), 0xC2B2AE3D) | 0, 17), 0x27D4EB2F);
  } else {
    let v0 = seed + 0x24234428 | 0;
    let v1 = seed + 0x85EBCA77 | 0;
    let v2 = seed;
    let v3 = seed - 0x9E3779B1 | 0;

    for (; (i + 15 | 0) < len; i = i + 16 | 0) {
      v0 = Math.imul(rotl32(v0 + Math.imul(dataView.getUint32(i + 0 | 0, true), 0x85EBCA77) | 0, 13), 0x9E3779B1);
      v1 = Math.imul(rotl32(v1 + Math.imul(dataView.getUint32(i + 4 | 0, true), 0x85EBCA77) | 0, 13), 0x9E3779B1);
      v2 = Math.imul(rotl32(v2 + Math.imul(dataView.getUint32(i + 8 | 0, true), 0x85EBCA77) | 0, 13), 0x9E3779B1);
      v3 = Math.imul(rotl32(v3 + Math.imul(dataView.getUint32(i + 12 | 0, true), 0x85EBCA77) | 0, 13), 0x9E3779B1);
    }

    h = (((rotl32(v0, 1) + rotl32(v1, 7) | 0) + rotl32(v2, 12) | 0) + rotl32(v3, 18) | 0) + len | 0;
    for (; (i + 3 | 0) < len; i = i + 4 | 0)
      h = Math.imul(rotl32(h + Math.imul(dataView.getUint32(i, true), 0xC2B2AE3D) | 0, 17), 0x27D4EB2F);
  }

  for (; i < len; i = i + 1 | 0)
    h = Math.imul(rotl32(h + Math.imul(dataView.getUint8(i), 0x165667B1) | 0, 11), 0x9E3779B1);
  h = Math.imul(h ^ h >>> 15, 0x85EBCA77);
  h = Math.imul(h ^ h >>> 13, 0xC2B2AE3D);
  return (h ^ h >>> 16) >>> 0;
};


const str = `abcdefghijklmnopqrstuvwyxz ABCDEFGHIJKLMNOPQRSTUVWYXZ 0123456789`

const suite = new Benchmark.Suite("HASH!");
suite
.add('twind HASH', () => {
    let i = str.length - 1, out = 9;
    while (i >= 0) out = Math.imul(out ^ str.charCodeAt(i--), 0x5f356495);
    const c = 'go' + ((out ^ (out >>> 9)) >>> 0).toString(36);
})
.add('goober original HASH', () => {
    const c = 'go' + str.split('').reduce((out, s) => (101 * out + s.charCodeAt(0)) >>> 0, 11);
})
.add('goober optimized HASH', () => {
    let i = 0, l = str.length, out = 11;
    while (i < l) out = (101 * out + str.charCodeAt(i++)) >>> 0
    const c = 'go' + out;
})
.add('goober optimized HASH with ASM hints', () => {
    let i = 0, l = str.length | 0, out = 11;
    while (i < l) {
        out = Math.imul(101, out) + str.charCodeAt(i) >>> 0;
        i = i + 1 | 0;
    }
    const c = 'go' + out;
})
.add('xxh32', () => {
    const c = 'go' + xxh32(str);
})
.on('start', function (e) {
    console.log('\nStarting', e.currentTarget.name);
})
.on('error', (e) => console.log(e))
.on('cycle', function (event) {
    console.log('▸', String(event.target));
})
.on('complete', function () {
    const fastest = this.filter('fastest').map('name')[0];
    console.log('\nFastest is: ' + fastest);
})
.run();