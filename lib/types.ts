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

export type ScalarType = (null | boolean | number | string);
