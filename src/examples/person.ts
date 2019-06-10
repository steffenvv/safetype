import { InferType, aString, aStringUnion, anObject } from "..";

declare function log(message: string): void;

// Person example

const aPhone = anObject({
    phoneNumber: aString,
    phoneType: aStringUnion("Home", "Business", "Mobile", "Unknown")
});

const aPerson = anObject({
    name: aString,
    phones: aPhone.array.orUndefined
});

/* Infer the Person type from its validation code. */
type Person = InferType<typeof aPerson>;

const p: Person = {
    name: "Bob",
    phones: [{ phoneNumber: "123", phoneType: "Mobile" }]
};

aPerson.validate(p); /* Throws if p is not a Person. */

const q = JSON.parse(JSON.stringify(p));

if (aPerson.isValid(q)) {
    /* Validates that q is a Person and narrows its type from any to Person. */
    log(`Hello, ${q.name}`);
}
