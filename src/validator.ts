export function keys<T>(obj: T): (keyof T)[] {
    return Object.keys(obj) as (keyof T)[];
}

export interface PathContext {
    pushKey(key: string): void;
    popKey(): void;
    current(): string;
}

export interface ValidationContext {
    fail(message: string): never;
    path: PathContext;
}

export type Validator<T> = (value: any, context: ValidationContext) => T;

export const _string: Validator<string> = (x, context): string =>
    typeof x === "string" ? x : context.fail(`expected a string, not ${typeof x}`);

export const _boolean: Validator<boolean> = (x, context): boolean =>
    typeof x === "boolean" ? x : context.fail(`expected a boolean, not ${typeof x}`);

export function _nullable<T>(validator: Validator<T>): Validator<T | null> {
    return (x, context): T | null => {
        if (x === null) {
            return null;
        }

        return validator(x, context);
    };
}

export function _optional<T>(validator: Validator<T>): Validator<T | undefined> {
    return (x, context): T | undefined => {
        if (x === undefined) {
            return undefined;
        }

        return validator(x, context);
    };
}

export function _array<T>(validator: Validator<T>): Validator<Array<T>> {
    return (x, context): Array<T> => {
        if (!Array.isArray(x)) {
            context.fail(`expected an array, not ${typeof x}`);
        }

        const result: T[] = [];

        for (let i = 0; i < x.length; i++) {
            context.path.pushKey(i.toString());
            try {
                result.push(validator(x[i], context));
            } finally {
                context.path.popKey();
            }
        }

        return result;
    };
}

export function _object<T>(validators: { [K in keyof T]-?: Validator<T[K]> }): Validator<T> {
    const validatorKeys = keys(validators);

    return (x, context): T => {
        const result: any = {};

        if (typeof x !== "object") {
            context.fail(`expected an object, not ${typeof x}`);
        } else if (x === null) {
            context.fail("expected an object, not null");
        }

        for (const key of validatorKeys) {
            const value = x[key];
            const validator = validators[key];
            context.path.pushKey(key);
            try {
                const validatedValue = validator(value, context);
                if (validatedValue === undefined && keys(x).indexOf(key) === -1) {
                    /* Don't introduce new keys for missing optional values. */
                } else {
                    result[key] = validatedValue;
                }
            } finally {
                context.path.popKey();
            }
        }

        return result;
    };
}

export function validate<T>(value: any, validator: Validator<T>): T {
    const path: string[] = [];

    const context: ValidationContext = {
        fail(message: string): never {
            const path = this.path.current();
            if (!path) {
                throw new Error(`Validation error: ${message}`);
            } else {
                throw new Error(`Validation error for key '${path}': ${message}`);
            }
        },

        path: {
            pushKey: key => path.push(key),

            popKey: () => path.pop(),

            current: () => path.join(".")
        }
    };

    return validator(value, context);
}

export function makeValidator<T>(validator: Validator<T>): (value: any) => T {
    return value => validate(value, validator);
}

export function makeTypeGuard<T>(validator: Validator<T>): (value: any) => value is T {
    return (value: any): value is T => {
        try {
            validate(value, validator);
            return true;
        } catch {
            return false;
        }
    };
}
