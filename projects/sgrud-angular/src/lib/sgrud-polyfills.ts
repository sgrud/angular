/**
 * Returns a date as a string value in ISO format including the current client
 * time zone offset in accordance to ISO 8601.
 */
Date.prototype.toISOString = function(): string {
  const offset: number = this.getTimezoneOffset();
  return [
    String(this.getFullYear()), '-',
    String(this.getMonth() + 1).padStart(2, '0'), '-',
    String(this.getDate()).padStart(2, '0'), 'T',
    String(this.getHours()).padStart(2, '0'), ':',
    String(this.getMinutes()).padStart(2, '0'), ':',
    String(this.getSeconds()).padStart(2, '0'), (offset <= 0 ? '+' : '-'),
    String(Math.floor(Math.abs(offset / 60))).padStart(2, '0'), ':',
    String(Math.floor(Math.abs(offset % 60))).padStart(2, '0')
  ].join('');
};
