import { Validator, aNumber, anObject } from "..";

// List example

interface List {
    value: number;
    next: List | null;
}

const aList: Validator<List> = anObject({
    value: aNumber,
    next: () => aList.orNull
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
