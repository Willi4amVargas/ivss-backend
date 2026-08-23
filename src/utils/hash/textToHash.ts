import { hash } from 'bcrypt';
import crypto from 'crypto';

export default (password: string) => {
  return hash(password, crypto.randomInt(10));
};
