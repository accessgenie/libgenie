import type { Expression, Mapping, Modifier, ScalarType } from './types';
export declare function applyProfile(data: any, mappings: Mapping[]): any;
export declare function applyModifier(data: any, modifier: Modifier[]): any;
export declare function autoParseValue(value: string): ScalarType;
export declare function applyMapping(data: any, mapping: Mapping): any;
export declare function matchesExpression(data: any, expression: Expression): boolean;
