import { describe, it, expect } from "vitest";

function asyncSum(a, b) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(a + b)
        }, 1000);
    })
}

describe('TDD, basic', () => {
    it('works', () => {
        expect(1).toBe(1);
    })

    it('works async', async () => {
        const sum =  await asyncSum(1, 2);
        expect(sum).toBe(3)
    })
})