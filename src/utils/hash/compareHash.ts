import { compare } from 'bcrypt';

export default (text: string, hash: string) => {
  return compare(text, hash);
};
