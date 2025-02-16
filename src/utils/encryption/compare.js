import bcrypt from "bcrypt";

export const Compare = async ({ key, hash }) => {
  return bcrypt.compareSync(key, hash);
};
