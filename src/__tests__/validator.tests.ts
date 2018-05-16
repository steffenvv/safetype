import { Validator, aBoolean, aNumber, aString, aStringUnion, anObject, aFunction } from "../validator";

interface Item {
    readonly kind?: "A" | "B" | "C";
    readonly name: string;
    readonly value: string | null;
    readonly enabled: boolean;
    readonly maybeUndefined?: string | undefined;
    readonly subItems?: ReadonlyArray<SubItem>;
    readonly nextItem?: Item;
}

interface SubItem {
    readonly name: string;
    readonly value: boolean | number | string;
    readonly meta?: string | null;
}

const itemValidator: Validator<Item> = anObject({
    kind: aStringUnion("A", "B", "C").orUndefined,
    name: aString,
    value: aString.orNull,
    enabled: aBoolean,
    maybeUndefined: aString.orUndefined,
    subItems: anObject({
        name: aString,
        value: aBoolean.or(aNumber).or(aString),
        meta: aString.orNull.orUndefined
    }).array.orUndefined,
    nextItem: () => itemValidator.orUndefined
});

const isValidItem = itemValidator.isValid;
const validateItem = itemValidator.validate;

describe("validation", () => {
    it("complains about missing properties", () => {
        expect(() => validateItem({})).toThrowErrorMatchingSnapshot();
        expect(() => validateItem({ name: "", enabled: false })).toThrowErrorMatchingSnapshot();
        expect(() => validateItem({ name: "", value: undefined, enabled: true })).toThrowErrorMatchingSnapshot();
        expect(() => validateItem({ name: "", value: null })).toThrowErrorMatchingSnapshot();
        expect(() =>
            validateItem({
                name: "name",
                value: null,
                enabled: false,
                subItems: [{ name: "", value: 42 }, { name: "" }]
            })
        ).toThrowErrorMatchingSnapshot();
        expect(() =>
            validateItem({
                name: "a",
                value: null,
                enabled: true,
                nextItem: {
                    name: "b",
                    value: null,
                    enabled: true,
                    nextItem: { name: "c", value: null, enabled: "error" }
                }
            })
        ).toThrowErrorMatchingSnapshot();
    });

    it("does not complain about missing optional properties", () => {
        expect(validateItem({ name: "", value: null, enabled: false })).toMatchSnapshot();
    });

    it("does not insert undefined values for missing optional properties", () => {
        expect(validateItem({ name: "", value: null, enabled: true })).not.toHaveProperty("kind");
        expect(validateItem({ name: "", value: null, enabled: true })).not.toHaveProperty("maybeUndefined");
        expect(validateItem({ name: "", value: null, enabled: true })).not.toHaveProperty("subItems");
    });

    it("complains about extra properties", () => {
        expect(() =>
            validateItem({ name: "", value: null, enabled: false, foo: "bar" })
        ).toThrowErrorMatchingSnapshot();
        expect(() =>
            validateItem({ name: "", value: null, enabled: true, subItems: [{ name: "sub", value: true, foo: "bar" }] })
        ).toThrowErrorMatchingSnapshot();
    });

    it("allows extra properties if that option is set", () => {
        expect(
            validateItem({ name: "", value: null, enabled: false, foo: "bar" }, { allowExtraProperties: true })
        ).toHaveProperty("foo", "bar");
        expect(
            validateItem(
                { name: "", value: null, enabled: true, subItems: [{ name: "sub", value: true, foo: "bar" }] },
                { allowExtraProperties: true }
            )
        ).toHaveProperty("subItems.0.foo", "bar");
    });

    it("keeps undefined values when they are allowed", () => {
        expect(validateItem({ name: "", value: null, enabled: false, maybeUndefined: undefined })).toHaveProperty(
            "maybeUndefined"
        );
        expect(validateItem({ name: "", value: null, enabled: false, subItems: undefined })).toHaveProperty("subItems");
    });

    it("complains about values with the wrong type", () => {
        expect(() => validateItem({ name: 42, value: null, enabled: false })).toThrowErrorMatchingSnapshot();
        expect(() => validateItem({ name: "42", value: true, enabled: false })).toThrowErrorMatchingSnapshot();
        expect(() => validateItem({ name: "42", value: null, enabled: "false" })).toThrowErrorMatchingSnapshot();
        expect(() => validateItem({ name: "42", value: [null], enabled: false })).toThrowErrorMatchingSnapshot();
        expect(() => validateItem({ kind: "D", name: "", value: null, enabled: true })).toThrowErrorMatchingSnapshot();
        expect(() => validateItem({ kind: 42, name: "", value: null, enabled: true })).toThrowErrorMatchingSnapshot();
    });

    it("works as a type guard", () => {
        const test = (v: any) => {
            if (isValidItem(v)) {
                expect(typeof v.name).toBe("string");
                expect({ valid: true, ...v }).toMatchSnapshot();
            } else {
                expect({ valid: false, ...v }).toMatchSnapshot();
            }
        };

        test({});
        test({ name: 3 });
        test({ name: "a" });
        test({ name: "b", value: null });
        test({ name: "b", value: null, enabled: true });
        test({ kind: "B", name: "b", value: null, enabled: true });
    });

    it("preserves object identities", () => {
        const test = (v: Item) => {
            expect(isValidItem(v)).toBe(true);
            const v2 = validateItem(v);
            expect(v2).toBe(v);
            expect(v2.subItems).toBe(v.subItems);
        };

        test({ kind: "A", name: "a", value: "v", maybeUndefined: "", enabled: true });
        test({ kind: "B", name: "b", value: null, maybeUndefined: undefined, enabled: false, subItems: [] });
    });

    it("works with union types", () => {
        const union = aString.or(aBoolean).or(aNumber.array);

        expect(union.isValid("a")).toBe(true);
        expect(union.isValid(true)).toBe(true);
        expect(union.isValid([])).toBe(true);
        expect(union.isValid([1, 2, 3])).toBe(true);

        expect(() => union.validate(42)).toThrowErrorMatchingSnapshot();
        expect(() => union.validate([[42]])).toThrowErrorMatchingSnapshot();
        expect(() => union.validate(["42"])).toThrowErrorMatchingSnapshot();
        expect(() => union.validate(null)).toThrowErrorMatchingSnapshot();
        expect(() => union.validate(undefined)).toThrowErrorMatchingSnapshot();
    });

    describe("of functions", () => {
        it("checks the number of arguments", () => {
            const a = aFunction;
            const b = aFunction.thatReturns(aString);
            const c = aFunction.thatAccepts(aBoolean).andReturns(aString);
            const d = aFunction.thatAccepts(aBoolean, aNumber).andReturns(aString);

            const f0 = () => undefined;
            const f1 = (a: any) => undefined;
            const f2 = (a: any, b: any) => undefined;
            const f3 = (a: any, b: any, c: any) => undefined;
            const fn = (...args: any[]) => undefined;

            for (const f of [f0, f1, f2, f3, fn]) {
                expect(a.validate(f)).toBe(f);
            }

            expect(b.validate(f0)).toBe(f0);
            expect(c.validate(f1)).toBe(f1);
            expect(d.validate(f2)).toBe(f2);

            expect(() => b.validate(f1)).toThrowErrorMatchingSnapshot();
            expect(() => c.validate(f2)).toThrowErrorMatchingSnapshot();
            expect(() => d.validate(f0)).toThrowErrorMatchingSnapshot();
        });
    });
});
