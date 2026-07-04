/** 비밀번호 걸린 xlsx 해독에 쓰는 브라우저 번들. 우리가 쓰는 API만 선언. */
declare module "xlsx-populate/browser/xlsx-populate.min.js" {
  interface XPWorkbook {
    outputAsync(type?: string): Promise<ArrayBuffer>;
  }
  const XlsxPopulate: {
    fromDataAsync(data: ArrayBuffer, opts?: { password?: string }): Promise<XPWorkbook>;
  };
  export default XlsxPopulate;
}
