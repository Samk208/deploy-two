import { expect, test } from "@playwright/test";

const SANDBOX_TRUE = ["true", "1", "yes"].includes(
  String(process.env.CHECKOUT_SANDBOX || "").toLowerCase()
);

test.describe("Document upload sandbox flow", () => {
  test.skip(
    !SANDBOX_TRUE,
    "CHECKOUT_SANDBOX must be true to run sandbox upload test"
  );

  test("uploads a small file and returns public URL without DB writes", async ({
    request,
    baseURL,
  }) => {
    // Build a multipart form with a tiny text blob
    const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
    const body =
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="documentType"\r\n\r\n` +
      `government_id\r\n` +
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="dummy.pdf"\r\n` +
      `Content-Type: application/pdf\r\n\r\n` +
      `%PDF-1.4\n%\xE2\xE3\xCF\xD3\n1 0 obj\n<<>>\nendobj\nstartxref\n0\n%%EOF\n` +
      `\r\n--${boundary}--`;

    const res = await request.post(`${baseURL}/api/onboarding/docs`, {
      headers: { "Content-Type": `multipart/form-data; boundary=${boundary}` },
      data: body,
    });

    // In sandbox mode, endpoint should accept upload and return a public URL
    expect(res.ok()).toBeTruthy();
    const json = (await res.json()) as any;
    expect(json?.ok).toBeTruthy();
    expect(typeof json?.data?.url).toBe("string");
    expect(json?.message).toMatch(/sandbox|Document uploaded successfully/i);
  });
});
