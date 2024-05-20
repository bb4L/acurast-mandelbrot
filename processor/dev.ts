import { AcurastClient, Message } from "@acurast/dapp";
import { messageHandler } from "./src/utils/ws";

async function generateKeys() {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: "ECDSA",
      namedCurve: "P-256",
    },
    true,
    ["sign"]
  );

  await crypto.subtle.exportKey("jwk", keyPair.privateKey).then((jwk: any) => {
    console.log("JWK");
    console.log(jwk);
    Buffer.from(jwk.d || "", "base64").toString();
  });

  const [privateKeyRaw, publicKeyRaw] = await Promise.all([
    crypto.subtle
      .exportKey("jwk", keyPair.privateKey)
      .then((jwk: any) => Buffer.from(jwk.d || "", "base64")),
    crypto.subtle
      .exportKey("raw", keyPair.publicKey)
      .then((arrayBuffer: any) => Buffer.from(arrayBuffer)),
  ]);

  const keys = {
    privateKey: privateKeyRaw.toString("hex"),
    publicKey: publicKeyRaw.toString("hex"),
  };
  const publicKeyCompressedSize = (publicKeyRaw.length - 1) / 2;
  const publicKeyCompressed = Buffer.concat([
    new Uint8Array([publicKeyRaw[2 * publicKeyCompressedSize] % 2 ? 3 : 2]),
    publicKeyRaw.subarray(1, publicKeyCompressedSize + 1),
  ]);
  const publicKeyHash = await crypto.subtle.digest(
    "SHA-256",
    publicKeyCompressed
  );
  console.log(
    "clientID:",
    Buffer.from(publicKeyHash.slice(0, 16)).toString("hex")
  );
  return keys;
}

const acurastClient = new AcurastClient(
  "wss://websocket-proxy-1.prod.gke.acurast.com" /* Acurast P2P WebSocket Server */
);

(async () => {
  const keys = await generateKeys();
  await acurastClient.start(
    {
      secretKey: keys.privateKey,
      publicKey: keys.publicKey,
    } /* P256 key pair */
  );

  acurastClient.onMessage(async (message: Message) => {
    await acurastClient.send(message.sender, await messageHandler(message));
    return;
  });
})();
