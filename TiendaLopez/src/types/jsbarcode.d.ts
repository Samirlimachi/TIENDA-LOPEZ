declare module 'jsbarcode/src/barcodes' {
  interface BarcodeEncoding {
    data: string;
    text?: string;
  }

  interface BarcodeEncoder {
    valid(): boolean;
    encode(): BarcodeEncoding | BarcodeEncoding[];
  }

  type BarcodeEncoderConstructor = new (value: string, options: Record<string, unknown>) => BarcodeEncoder;

  const barcodes: Record<string, BarcodeEncoderConstructor>;
  export default barcodes;
}
