// @ts-check
const { createHmac, createHash } = require('crypto');

class Token {
  /**
   * Simple token constructor
   *
   * @param {String} key
   */
  constructor(key) {
    this.key = createHash('sha256').update(key).digest();
  }

  /**
   * Sign data
   *
   * @param {Object|Number|String} data
   * @returns {String}
   */
  sign(data) {
    const o = {
      d: data,
    };
    const pack = Buffer.from(JSON.stringify(o)).toString('base64');
    const hmac = createHmac('sha256', this.key).update(pack).digest('base64');
    return `${pack}.${hmac}`;
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
    const pack = Buffer.from(JSON.stringify(o)).toString('base64');
    const hmac = createHmac('sha256', this.key).update(pack).digest('base64');
    return `${pack}.${hmac}`;
  }

  /**
   * Resign data with new time to live
   *
   * @param {String} str
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
    const [packPart, hmacPart] = str.split('.');
    const hmac = createHmac('sha256', this.key)
      .update(packPart)
      .digest('base64');

    if (hmac === hmacPart) {
      const r = JSON.parse(Buffer.from(packPart, 'base64').toString('utf8'));
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
