import { aString, aStringUnion, anObject } from "..";

// Person example

const phoneValidator = anObject({
    phoneNumber: aString,
    phoneType: aStringUnion("Home", "Business", "Mobile", "Unknown")
});

const personValidator = anObject({
    name: aString,
    phones: phoneValidator.array.orUndefined
});

type Person = ReturnType<typeof personValidator.validate>;

const p: Person = {
    name: "Bob",
    phones: [{ phoneNumber: "123", phoneType: "Mobile" }]
};

personValidator.validate(p); /* Throws if p is not a Person */

const q = JSON.parse(JSON.stringify(p));

if (personValidator.isValid(q)) {
    /* Validates that q is a Person and narrows its type from any to Person */
    console.log(`Hello, ${q.name}`);
}
