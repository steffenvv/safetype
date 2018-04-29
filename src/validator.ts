/* TODO: deep required-ness */

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

export interface Validator<T> {
    validate(value: any, context?: ValidationContext): T;
    isValid(value: any): value is T;
    orNull: Validator<T | null>;
    orUndefined: Validator<T | undefined>;
    array: Validator<T[]>;
}

export function makeContext(): ValidationContext {
    const path: string[] = [];

    const context: ValidationContext = {
        fail: (message: string): never => {
            const path = context.path.current();
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

    return context;
}

export function makeValidator<T>(validate: (value: any, context: ValidationContext) => T): Validator<T> {
    return {
        validate: (x, context = makeContext()) => {
            return validate(x, context);
        },

        isValid: (x: any): x is T => {
            try {
                validate(x, makeContext());
                return true;
            } catch {
                return false;
            }
        },

        get orNull(): Validator<T | null> {
            return makeValidator((x, context): T | null => {
                if (x === null) {
                    return null;
                }

                return validate(x, context);
            });
        },

        get orUndefined(): Validator<T | undefined> {
            return makeValidator((x, context): T | undefined => {
                if (x === undefined) {
                    return undefined;
                }

                return validate(x, context);
            });
        },

        get array(): Validator<T[]> {
            return makeValidator((x, context): T[] => {
                if (!Array.isArray(x)) {
                    context.fail(`expected an array, not ${typeof x}`);
                }

                const result: T[] = [];

                for (let i = 0; i < x.length; i++) {
                    context.path.pushKey(i.toString());
                    try {
                        result.push(validate(x[i], context));
                    } finally {
                        context.path.popKey();
                    }
                }

                return result;
            });
        }
    };
}

export const aString = makeValidator(
    (x, context): string => (typeof x === "string" ? x : context.fail(`expected a string, not ${typeof x}`))
);

export const aBoolean = makeValidator(
    (x, context): boolean => (typeof x === "boolean" ? x : context.fail(`expected a boolean, not ${typeof x}`))
);

export const aNumber = makeValidator(
    (x, context): number => (typeof x === "number" ? x : context.fail(`expected a number, not ${typeof x}`))
);

export function anObject<T>(validators: { [K in keyof T]-?: Validator<T[K]> }): Validator<T> {
    const validatorKeys = keys(validators);

    return makeValidator((x, context): T => {
        const result: any = {};

        if (typeof x !== "object") {
            context.fail(`expected an object, not ${typeof x}`);
        } else if (x === null) {
            context.fail("expected an object, not null");
        }

        for (const key of validatorKeys) {
            const value = x[key];
            const validate = validators[key].validate;

            context.path.pushKey(key);
            try {
                const validatedValue = validate(value, context);
                if (validatedValue === undefined && !x.hasOwnProperty(key)) {
                    /* Don't introduce new keys for missing optional values. */
                } else {
                    result[key] = validatedValue;
                }
            } finally {
                context.path.popKey();
            }
        }

        return result;
    });
}
