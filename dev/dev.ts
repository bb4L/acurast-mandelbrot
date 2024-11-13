import { AcurastClient, Message } from "@acurast/dapp";
let start = Date.now();

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
  // "wss://websocket-proxy-1.prod.gke.acurast.com" /* Acurast P2P WebSocket Server */,
  "wss://websocket-proxy-2.prod.gke.acurast.com" /* Acurast P2P WebSocket Server */
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
    try {
      let receivedAt = Date.now();
      console.log("sinceStart", Math.floor((receivedAt - start) / 1000));
      console.log("received: ", message);
      console.log("received payload: ", message.payload.toString());
    } catch (error) {
      console.log(`error`, error);
    }
    return;
  });

  [
    "0x02a1199d238ac5069edb662e256a167b3aa8fd173ef9c8721f4d73de40e0082afd",
    // DEPLOYMENT_ADDRESS
  ].forEach(async (element) => {
    start = Date.now();
    acurastClient.send(element, JSON.stringify({ method: "ping" }));
    acurastClient.send(
      element,
      JSON.stringify({
        method: "mandelbrotHeat",
        arguments: {
          startPoint: { x: 0, y: 0 },
          amountOfValues: 2000,
          config: {
            height: 1000,
            width: 1000,
            maxIterations: 100,
          },
        },
      })
    );
  });
})();
