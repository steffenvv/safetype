import { makeValidator } from "..";

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
