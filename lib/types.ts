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

export type MultiLookupTableTarget = {
  id: number;

  target: string;

  value: string;
}

export type MultiLookupTableRow = {
  id: number;

  source: string;

  column: string;

  targets: MultiLookupTableTarget[];
}

export type MultiLookupTable = {
  id: number;

  isBlueprint: boolean;

  name: string;

  rows: MultiLookupTableRow[];
}

export type Block = {
  id: number;
  type: string;
  content?: string | null;
  lookupTable?: LookupTable | null;
  multiLookupTable?: MultiLookupTable | null;
  multiLookupTableColumn?: string | null;
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

export enum ReliasResourceType {
  Hierarchy = 'hierarchy',
  Departments = 'departments',
  JobTitles = 'jobTitles',
  Professions = 'professions',
  Roles = 'roles',
}

export type LookupRow = {
  key: string;
  value: string;
};

export type EmailTemplate = {
  id?: number;
  name: string;
  subject: (string | Mapping)[];
  to: Mapping;
  from: Mapping;
  ccs: Mapping[];
  template: string;
  // the usedMappings list this is just for the debugging purposes
  // in case something goes wrong on the frontend with variables parsing, on the backend
  // we'll still be able to see exactly what variables were chosen
  usedMappings: Mapping[];
}
