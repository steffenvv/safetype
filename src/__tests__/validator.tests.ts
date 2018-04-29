import { _array, _boolean, _nullable, _object, _optional, _string, makeTypeGuard, makeValidator } from "../validator";

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

const validateItem = makeValidator<Item>(
    _object({
        name: _string,
        value: _nullable(_string),
        enabled: _boolean,
        maybeUndefined: _optional(_string),
        subItems: _optional(
            _array(
                _object({
                    name: _string,
                    value: _string,
                    meta: _optional(_nullable(_string))
                })
            )
        )
    })
);

const isValidItem = makeTypeGuard(validateItem);

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
