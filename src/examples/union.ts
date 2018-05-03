import { InferType, aNumber, aString, aStringLiteral, anObject } from "..";

// Union example

const anOutcome = anObject({
    kind: aStringLiteral("Success"),
    data: aString.array,
    timestamp: aNumber
}).or(
    anObject({
        kind: aStringLiteral("Error"),
        error: aString,
        stackTrace: aString.orUndefined
    })
);

type Outcome = InferType<typeof anOutcome>;

/* Inferred type:
type Outcome = {
    readonly kind: "Success";
    readonly data: ReadonlyArray<string>;
    readonly timestamp: number;
} | {
    readonly kind: "Error";
    readonly error: string;
    readonly stackTrace?: string | undefined;
}
*/
