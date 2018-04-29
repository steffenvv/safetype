import { Validator, aNumber, anObject } from "..";

// List example

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
