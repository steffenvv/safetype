# safetype

Typescript library for typesafe creation of validation functions and type
guards.

Declare validators using a fluent interface:

```typescript
const phoneValidator = anObject({
    phoneNumber: aString,
    phoneType: aStringUnion("Home", "Business", "Mobile", "Unknown")
});

const personValidator = anObject({
    name: aString,
    phones: phoneValidator.array.orUndefined
});

/* Derive the Person type from its validation code, to keep them in sync. */
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
