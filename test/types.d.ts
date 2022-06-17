interface CustomMatchers<R = unknown> {
    toBeJust<T>(actual: any, expected?: T): R
}

declare global {
    namespace jest {
        type Expect = CustomMatchers
        type Matchers<R> = CustomMatchers<R>
        type InverseAsymmetricMatchers = CustomMatchers
    }
}
