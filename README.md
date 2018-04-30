# safetype

Typescript library for typesafe creation of validation functions and type
guards.

Declare validators using a fluent interface:

```typescript
const aPhone = anObject({
    phoneNumber: aString,
    phoneType: aStringUnion("Home", "Business", "Mobile", "Unknown")
});

const aPerson = anObject({
    name: aString,
    phones: aPhone.array.orUndefined
});

/* Derive the Person type from its validation code, to keep them in sync. */
type Person = ReturnType<typeof aPerson.validate>;

const p: Person = {
    name: "Bob",
    phones: [{ phoneNumber: "123", phoneType: "Mobile" }]
};

aPerson.validate(p); /* Throws if p is not a Person */

const q = JSON.parse(JSON.stringify(p));

if (aPerson.isValid(q)) {
    /* Validates that q is a Person and narrows its type from any to Person */
    console.log(`Hello, ${q.name}`);
}
```

Supports circular references between validators, using thunks:

```typescript
interface List {
    value: number;
    next: List | null;
}

const listValidator: Validator<List> = anObject({
    value: aNumber,
    next: () => listValidator.orNull
});

const list: List = {
    value: 1,
    next: {
        value: 4,
        next: {
            value: 9,
            next: {
                value: 16,
                next: null
            }
        }
    }
};

listValidator.validate(list);
```

If you really want to, it's also easy to create your own validators:

```typescript
class Hex {
    constructor(public readonly digits: string) {}
}

const aHexString = makeValidator((value, context) => {
    if (typeof value !== "string" || !value.match(/^[0-9A-Fa-f]+$/)) {
        context.fail(`expected a string of hex digits, not ${typeName(value)}`);
    }

    return new Hex(value);
});

if (aHexString.isValid("Bad")) {
    console.log("Good!");
}
```
