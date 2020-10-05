/* eslint-env jest */

const os = require('os');
const { performance } = require('perf_hooks');

const Token = require('../lib/Token');

const { log } = console;

const [cpu] = os.cpus();

const objects = [
  1,
  'foo',
  { bar: true },
  [new Date().toString(), Math.random()],
];

describe('Token', () => {
  const t = new Token(Math.random().toString());
  it('sign', async () => {
    objects.forEach((o) => {
      const s = t.sign(o);
      const v = t.verify(s);
      expect(o).toEqual(v);
    });
    objects.forEach((o) => {
      const s = t.signTTL(o, 1);
      const v = t.verify(s);
      expect(o).toEqual(v);
    });
    let token = t.signTTL(objects, 1);
    const v = t.verify(token);
    token = t.resign(token, 1);
    expect(objects).toEqual(v);

    expect(() => {
      t.verify('invalid');
    }).toThrow(Error);

    expect(() => {
      t.resign('invalid', 1);
    }).toThrow(Error);

    await new Promise((r) => setTimeout(r, 1500));

    expect(() => {
      t.verify(token);
    }).toThrow(Error);

    expect(() => {
      t.resign(token, 1);
    }).toThrow(Error);
  });
});

describe('Benchmark', () => {
  const t = new Token(Math.random().toString());
  const sg = t.signTTL(objects, 60);
  it('sign', () => {
    const t0 = performance.now();
    const times = 1000;
    for (let i = 0; i < times; i += 1) {
      t.sign(objects);
    }
    const t1 = performance.now();
    const diff = t1 - t0;
    log(
      [
        `Call ${times}x sign took ${diff} milliseconds.`,
        `CPU : ${cpu.model} / ${cpu.speed} MHz`,
      ].join('\n'),
    );
  });
  it('verify', () => {
    const t0 = performance.now();
    const times = 1000;
    for (let i = 0; i < times; i += 1) {
      t.verify(sg);
    }
    const t1 = performance.now();
    const diff = t1 - t0;
    log(
      [
        `Call ${times}x verify took ${diff} milliseconds.`,
        `CPU : ${cpu.model} / ${cpu.speed} MHz`,
      ].join('\n'),
    );
  });
});
