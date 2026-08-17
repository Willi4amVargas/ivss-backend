import { TransformFnParams } from 'class-transformer';

export const ToUpperCaseString = ({ value }: TransformFnParams) => {
  if (typeof value === 'string') {
    return value.toUpperCase();
  }
  return value;
};

export const ToUpperCaseStringArray = ({ value }: TransformFnParams) => {
  if (typeof value === 'string') {
    return [value.toUpperCase()];
  }

  if (Array.isArray(value)) {
    return value.map((item) =>
      typeof item === 'string' ? item.toUpperCase() : item,
    );
  }

  return value;
};
