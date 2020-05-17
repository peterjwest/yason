/** Possible JSON primitive values */
export type JsonPrimitive = boolean | null | string | number;

/** JSON compatible list (array) */
export type JsonList = JsonValue[];

/** JSON compatible map (dictionary) */
export type JsonMap = { [key: string]: JsonValue };

/** JSON  */
export type JsonValue = JsonPrimitive | JsonMap | JsonList;
