import { aNumber, aString, aStringLiteral, anObject } from "..";

// Union example

const anOutcome = anObject({
    kind: aStringLiteral("Success"),
    data: aString.array,
    timestamp: aNumber
}).or(
    anObject({
        kind: aStringLiteral("Error"),
        error: aString
    })
);

type Outcome = ReturnType<typeof anOutcome.validate>;

/* Inferred type:

type Outcome = {
    kind: "Success";
    data: string[];
    timestamp: number;
} | {
    kind: "Error";
    error: string;
}

*/
