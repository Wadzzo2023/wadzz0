export function splitArrayInHalf<T>(array: T[]): [T[], T[]] {
  const middleIndex = Math.ceil(array.length / 2);
  const firstHalf = array.slice(0, middleIndex);
  const secondHalf = array.slice(middleIndex);
  return [firstHalf, secondHalf];
}
