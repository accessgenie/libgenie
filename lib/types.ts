export type Mapping = {
  id: number;
  name: string;
  field: string;
  sort: string | null;
  block?: Block[];
  modifier?: Modifier[];
};

export type Block = {
  id: number;
  type: string;
  content?: string;
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
