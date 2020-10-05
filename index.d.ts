declare class Token {
  private key: Buffer;

  /**
   * Simple token constructor
   *
   * @param {String} key
   */
  constructor(key: string);

  /**
   * Sign data
   *
   * @param {Object|Number|String} data
   * @returns {String}
   */
  sign(data: any | number | string): string;

  /**
   * Sign data with time to live
   *
   * @param {Object|Number|String} data
   * @param {Number} ttl
   * @returns {String}
   */
  signTTL(data: any | number | string, ttl: number): string;

  /**
   * Resign data with new time to live
   *
   * @param {String} str
   * @param {Number} ttl
   * @throws {Error}
   * @returns {String}
   */
  resign(str: string, ttl: Number): string;

  /**
   * Verify and return data
   *
   * @param {String} str
   * @throws {Error}
   * @returns {Object}
   */
  verify(str: string): any;
}


export {
  Token,
};
