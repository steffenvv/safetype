# safetype

This is a typescript library for typesafe creation of validation functions and
type guards. The key idea is to write your validation code as the source of
truth, and infer your model types from the validation code. This ensures that
the two are always in sync; it's not possible to change the model type and
forget to update the validation code.

Your model types are described by declaring _validators_ using a fluent
interface:

```typescript
const aPhone = anObject({
    phoneNumber: aString,
    phoneType: aStringUnion("Home", "Business", "Mobile", "Unknown")
});

const aPerson = anObject({
    name: aString,
    phones: aPhone.array.orUndefined
});

/* Infer the Person type from its validation code. */
type Person = ReturnType<typeof aPerson.validate>;

const p: Person = {
    name: "Bob",
    phones: [{ phoneNumber: "123", phoneType: "Mobile" }]
};

aPerson.validate(p); /* Throws if p is not a Person. */

const q = JSON.parse(JSON.stringify(p));

if (aPerson.isValid(q)) {
    /* Validates that q is a Person and narrows its type from any to Person. */
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
        error: aString,
        stackTrace: aString.orUndefined
    })
);

type Outcome = ReturnType<typeof anOutcome.validate>;

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
```

Properties that may be undefined can be declared using `.orUndefined`, and will
become optional properties in the inferred type. If you want a required
property, consider using `.orNull` instead of `.orUndefined`, and let `null`
signal the absence of a value. Using `null` instead of `undefined` also has the
advantage of surviving JSON serialization and deserialization.

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

Unfortunately, typescript cannot infer the type of a self-referencing
initializer, so if you need to use this mechanism, you must declare the model
type manually. Also, there is currently no detection of cycles, so if you try to
validate e.g. a circularly linked list, the validation code will recurse
infinitely. In practice, such situations should be rare; for example, any JSON
data will be acyclic by nature.

If you really want to, it's also easy to create your own validators. Use the
`makeValidator` function as in the example below. Custom validators can be
combined in the usual way.

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

const aResponse = anObject({
    data: aHexString.array.orNull
});
```
