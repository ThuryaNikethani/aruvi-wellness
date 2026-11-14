import { hash, verify } from "@node-rs/argon2";

// Argon2id (library default) with OWASP-recommended minimums.
const OPTIONS = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

// A real hash generated once, used so unknown emails cost the same time as wrong passwords.
let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= hash("aruvi-timing-equaliser", OPTIONS));

export function hashPassword(password: string) {
  return hash(password, OPTIONS);
}

export async function verifyPassword(passwordHash: string | null | undefined, password: string) {
  try {
    const ok = await verify(passwordHash ?? (await getDummyHash()), password);
    return Boolean(passwordHash) && ok;
  } catch {
    return false;
  }
}
