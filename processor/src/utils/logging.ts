const webhook_url = "https://webhook.site/959f418b-04b4-4583-9721-f4303e5fa730";
declare const _STD_: any;
declare const httpPOST: any;
export function log_data(data: any) {
  try {
    data["processor"] = _STD_.device.getPublicKey();
    httpPOST(
      webhook_url,
      JSON.stringify(data),
      {},
      (payload: any, certificate: any) => {},
      (message: any) => {}
    );
  } catch (error) {
    httpPOST(
      webhook_url,
      JSON.stringify({ data: "issue in logging" }),
      {},
      (payload: any, certificate: any) => {},
      (message: any) => {}
    );
    httpPOST(
      webhook_url,
      JSON.stringify({ err: error }),
      {},
      (payload: any, certificate: any) => {},
      (message: any) => {}
    );
  }
}
