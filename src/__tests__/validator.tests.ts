import { Validator, aBoolean, aString, anObject } from "../validator";

interface Item {
    name: string;
    value: string | null;
    enabled: boolean;
    maybeUndefined: string | undefined;
    subItems?: SubItem[];
    /* nextItem: Item | null; */
}

interface SubItem {
    name: string;
    value: string;
    meta?: string | null;
}

const itemValidator: Validator<Item> = anObject({
    name: aString,
    value: aString.orNull,
    enabled: aBoolean,
    maybeUndefined: aString.orUndefined,
    subItems: anObject({
        name: aString,
        value: aString,
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
                subItems: [{ name: "", value: "" }, { name: "" }]
            })
        ).toThrowErrorMatchingSnapshot();
    });

    it("does not complain about missing optional properties", () => {
        expect(validateItem({ name: "", value: null, enabled: false })).toMatchSnapshot();
    });

    it("does not insert undefined values for missing optional properties", () => {
        expect(validateItem({ name: "", value: null, enabled: true })).not.toHaveProperty("maybeUndefined");
        expect(validateItem({ name: "", value: null, enabled: true })).not.toHaveProperty("subItems");
    });

    it("keeps undefined values when they are allowed", () => {
        expect(validateItem({ name: "", value: null, enabled: false, maybeUndefined: undefined })).toHaveProperty(
            "maybeUndefined"
        );
        expect(validateItem({ name: "", value: null, enabled: false, subItems: undefined })).toHaveProperty("subItems");
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
    });
});
