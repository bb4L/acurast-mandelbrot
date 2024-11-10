export function stringToHex(str: string) {
  return Buffer.from(str, "utf-8").toString("hex");
}

export function hexToString(hex: any) {
  const buf = Buffer.from(hex, "hex");
  return buf.toString("utf8");
}
