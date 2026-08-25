import { FindOptionsWhere } from 'typeorm';

export function getCacheKeyByWhere<T>(
  where: FindOptionsWhere<T> | FindOptionsWhere<T>[] | undefined = undefined,
) {
  const whereKey = where
    ? `_${Object.entries(where)
        .map(
          ([key, value]) =>
            `${key}:${typeof value === 'object' ? JSON.stringify(value) : value}`,
        )
        .join('_')}`
    : '';
  return whereKey;
}
