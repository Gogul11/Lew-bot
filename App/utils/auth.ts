export const createStableUserIdFromEmail = (email: string) => {
  const normalized = email.trim().toLowerCase();
  let hash = 0;
  let charsHex = "";

  for (let index = 0; index < normalized.length; index += 1) {
    const charCode = normalized.charCodeAt(index);
    hash = (hash << 5) - hash + charCode;
    hash |= 0;
    charsHex += charCode.toString(16).padStart(2, "0");
  }

  const unsignedHex = (hash >>> 0).toString(16);
  const fromEmailHex = charsHex.slice(0, 16);
  return `${unsignedHex}${fromEmailHex}`.padEnd(24, "0").slice(0, 24);
};

export const getUsernameFromEmail = (email: string) => {
  const localPart = email.split("@")[0] ?? "User";
  return localPart.trim().length > 0 ? localPart : "User";
};
