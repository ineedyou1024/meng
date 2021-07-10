const xiaomeng = require('..')

// TODO: Implement module test
test('xiaomeng', () => {
  expect(xiaomeng('w')).toBe('w@zce.me')
  expect(xiaomeng('w', { host: 'wedn.net' })).toBe('w@wedn.net')
  expect(() => xiaomeng(100)).toThrow('Expected a string, got number')
})
