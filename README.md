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

All of the basic types are supported, and validators can be composed to form
more complex types. Here is an example that creates a tagged union:

```typescript
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
```

Validators can be self-referential to support linked data structures like lists
and trees. To reference itself, a validator must use a thunk, i.e. a
parameterless function, like so:

```typescript
interface List {
    value: number;
    next: List | null;
}

const aList: Validator<List> = anObject({
    value: aNumber,
    next: () => aList.orNull /* self-reference */
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

aList.validate(list);
```

NOTE: There is currently no detection of cycles, so if you try to validate e.g.
a circularly linked list, the validation code will recurse infinitely.

If you really want to, it's also easy to create your own validators:

```typescript
class Hex {
    constructor(public readonly digits: string) {}
}

const aHexString = makeValidator((value, context) => {
    if (typeof value !== "string" || !value.match(/^[0-9A-Fa-f]+$/)) {
        context.fail(
            `expected a string of hex digits, not ${context.typeName(value)}`
        );
    }

    return new Hex(value);
});

if (aHexString.isValid("Bad")) {
    console.log("Good!");
}
```
