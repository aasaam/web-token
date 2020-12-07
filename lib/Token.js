// @ts-check
const { createHmac, createHash } = require('crypto');

const base62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
const base62Length = base62.length;
const base62BigInt = BigInt(base62Length);

const algorithm = 'sha256';
const splitter = '_';

class Token {
  /**
   * Simple token constructor
   *
   * @param {String} key
   */
  constructor(key) {
    this.key = createHash(algorithm).update(key).digest('base64');
  }

  /**
   * Encode to base62
   *
   * @param {Buffer} buf
   * @return {String}
   */
  static encode(buf) {
    let x = BigInt(`0x${buf.toString('hex')}`);
    let result = '';
    while (x > 0) {
      result = base62.charAt(Number(x % base62BigInt)) + result;
      x /= base62BigInt;
    }
    return result;
  }

  /**
   * Decode to hex
   *
   * @param {String} str
   * @return {Buffer}
   */
  static decode(str) {
    let result = BigInt(0);

    for (let i = 0; i < str.length; i += 1) {
      result = result * base62BigInt + BigInt(base62.indexOf(str.charAt(i)));
    }

    return Buffer.from(result.toString(16), 'hex');
  }

  /**
   * Pack date
   *
   * @private
   * @param {Object} obj
   * @returns {String}
   */
  pack(obj) {
    const buff = Buffer.from(JSON.stringify(obj));
    const pack = Token.encode(buff);
    const hmac = Token.encode(
      createHmac(algorithm, this.key).update(buff).digest(),
    );
    return `${pack}${splitter}${hmac}`;
  }

  /**
   * Sign data permanent without expire
   *
   * @param {Object|Number|String} data
   * @returns {String}
   */
  sign(data) {
    const o = {
      d: data,
    };
    return this.pack(o);
  }

  /**
   * Sign data with time to live
   *
   * @param {Object|Number|String} data
   * @param {Number} ttl
   * @returns {String}
   */
  signTTL(data, ttl) {
    const d = new Date();
    d.setSeconds(d.getSeconds() + ttl);
    d.setMilliseconds(0);
    const o = {
      e: d.getTime() / 1000,
      d: data,
    };
    return this.pack(o);
  }

  /**
   * Resign data with new time to live
   *
   * @param {String} str
   * @param {Number} ttl
   * @throws {Error}
   * @returns {String}
   */
  resign(str, ttl) {
    const v = this.verify(str);
    return this.signTTL(v, ttl);
  }

  /**
   * Verify and return data
   *
   * @param {String} str
   * @throws {Error}
   * @returns {Object}
   */
  verify(str) {
    const [packPart, hmacPart] = str.split(splitter);

    const buff = Token.decode(packPart);
    const hmac = Token.encode(
      createHmac(algorithm, this.key).update(buff).digest(),
    );

    if (hmac === hmacPart) {
      const r = JSON.parse(buff.toString());
      if (r.e) {
        const d = new Date();
        d.setSeconds(d.getSeconds());
        if (r.e >= d.getTime() / 1000) {
          return r.d;
        }
        throw new Error('Token expired');
      }
      return r.d;
    }
    throw new Error('Invalid HMAC');
  }
}

module.exports = Token;
