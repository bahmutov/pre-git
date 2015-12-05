const la = require('lazy-ass');
const check = require('check-more-types');

/* global describe, it */
describe('parse message', () => {
  const parse = require('./valid-message').parseMessage;

  it('is a function', () => {
    la(check.fn(parse));
  });

  it('parses valid message', () => {
    const message = 'feat(foo): new feature';
    const parsed = parse(message);
    la(parsed.firstLine === message, 'first line', parsed);
    la(parsed.type === 'feat', 'type', parsed);
    la(parsed.scope === 'foo', 'scope', parsed);
    la(parsed.subject === 'new feature', 'subject', parsed);
  });

  it('rejects invalid message', () => {
    const message = 'free form text';
    const parsed = parse(message);
    la(!parsed);
  });
});
