export type Mapping = {
  id: number;
  name: string;
  field: string;
  block?: Block[];
  modifier?: Modifier[];
};

export type LookupTableRow = {
  id: number;
  source: string;
  target: string;
};

export type LookupTable = {
  id: number;
  name: string;
  row?: LookupTableRow[];
}

export type Block = {
  id: number;
  type: string;
  content?: string | null;
  lookupTable?: LookupTable | null;
  modifier?: Modifier[];
  sort: string | null;
};

export type Expression = {
  id: number;
  field: string;
  comparison: string;
  value: string;
  name: string;
  sort: string | null;
};

export type Modifier = {
  id: number;
  name: string;
  arguments?: any;
};

export type ScalarType = (null | boolean | number | string | (string | number)[]);

export enum PccResourceType {
  Facilities = 'facilities',
  Roles = 'roles',
  StandardRoles = 'standardrole',
  Departments = 'departments',
  Positions = 'positions',
}

export type LookupRow = {
  key: string;
  value: string;
};
