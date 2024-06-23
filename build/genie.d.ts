export type Mapping = {
    id: number;
    name: string;
    field: string;
    dataType: string;
    block?: Block[];
    modifier?: Modifier[];
};
export type Block = {
    id: number;
    type: string;
    content?: string;
    modifier?: Modifier[];
};
export type Expression = {
    id: number;
    field: string;
    comparison: string;
    value: string;
    name: string;
    dataType: string;
};
export type Modifier = {
    id: number;
    name: string;
    arguments?: any;
};
export declare function applyProfile(data: any, mappings: Mapping[]): any;
export declare function applyModifier(data: any, modifier: Modifier[]): any;
export declare function applyCast(data: any, dataType: string): any;
export declare function applyMapping(data: any, mapping: Mapping): any;
export declare function matchesExpression(data: any, expression: Expression): boolean;
