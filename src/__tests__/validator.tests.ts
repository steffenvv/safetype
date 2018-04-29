import { aBoolean, aNumber, aString, aStringUnion, anObject } from "../validator";

interface Item {
    kind: "A" | "B" | "C" | undefined;
    name: string;
    value: string | null;
    enabled: boolean;
    maybeUndefined: string | undefined;
    subItems?: SubItem[];
    /* nextItem: Item | null; */
}

interface SubItem {
    name: string;
    value: number;
    meta?: string | null;
}

const itemValidator = anObject({
    kind: aStringUnion("A", "B", "C").orUndefined,
    name: aString,
    value: aString.orNull,
    enabled: aBoolean,
    maybeUndefined: aString.orUndefined,
    subItems: anObject({
        name: aString,
        value: aNumber,
        meta: aString.orNull.orUndefined
    }).array.orUndefined
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
});
