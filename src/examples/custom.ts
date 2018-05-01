import { makeValidator, anObject } from "..";

// Custom validator example

class Hex {
    constructor(public readonly digits: string) {}
}

const aHexString = makeValidator((value, context) => {
    if (typeof value !== "string" || !value.match(/^[0-9A-Fa-f]+$/)) {
        context.fail(`expected a string of hex digits, not ${context.typeName(value)}`);
    }

    return new Hex(value);
});

if (aHexString.isValid("Bad")) {
    console.log("Good!");
}

const aResponse = anObject({
    data: aHexString.array.orNull /* Custom validators can be combined in the usual way */
});
