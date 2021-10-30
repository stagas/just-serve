import { expect } from '@esm-bundle/chai'
import { add, sub, div } from './'

describe('a suite', () => {
  it('sums up 2 numbers', () => {
    expect(add(1, 1)).to.equal(2)
    expect(add(3, 12)).to.equal(15)
  })
})

it('subs 2 numbers', () => {
  expect(sub(1, 1)).to.equal(0)
  expect(sub(5, 3)).to.equal(2)
})

it('divs 2 numbers', () => {
  expect(div(5, 2)).to.equal(3)
})
