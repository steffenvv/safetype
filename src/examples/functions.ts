import { aFunction, aString, aNumber, InferType, FunctionValidator1 } from "..";

export const parseInt = aFunction.thatAccepts(aString).andReturns(aNumber);
export type ParseInt = InferType<typeof parseInt>;
