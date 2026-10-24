import { createUuidV4 } from './uuid';

describe('createUuidV4', () => {
    it('creates UUID v4 values using secure random bytes', () => {
        const getRandomValues = vi.spyOn(globalThis.crypto, 'getRandomValues').mockImplementation(((
            values: Uint8Array
        ) => {
            values.fill(0);
            return values;
        }) as typeof globalThis.crypto.getRandomValues);

        expect(createUuidV4()).toBe('00000000-0000-4000-8000-000000000000');
        expect(getRandomValues).toHaveBeenCalledOnce();
    });
});
