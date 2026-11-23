import { test } from "node:test";
import assert from "node:assert/strict";
import { checkInvestorDocUrl } from "../../src/modules/investors-cms/investor.url.js";

const C = "democloud";
const ok = (u: string) => assert.equal(checkInvestorDocUrl(u, C).ok, true, u);
const bad = (u: string) => assert.equal(checkInvestorDocUrl(u, C).ok, false, u);

test("accepts our investor PDFs and external https links", () => {
  ok(`https://res.cloudinary.com/${C}/raw/upload/v123/investor-documents/abc.pdf`);
  ok(`https://res.cloudinary.com/${C}/raw/upload/investor-documents/My%20File.PDF`);
  ok("https://www.bseindia.com/some/file.pdf");
});
test("rejects unsafe or malformed URLs", () => {
  bad("http://example.com/a.pdf");
  bad("javascript:alert(1)");
  bad("data:application/pdf;base64,AAAA");
  bad("https://user:pw@example.com/a.pdf");
  bad("https://localhost/a.pdf");
  bad("https://example.com/a b.pdf");
  bad("not a url");
  bad("https://example.com/" + "a".repeat(2100));
});
test("rejects cloudinary files that are foreign, wrong folder, traversal or non-PDF", () => {
  bad("https://res.cloudinary.com/other/raw/upload/v1/investor-documents/a.pdf");
  bad(`https://res.cloudinary.com/${C}/raw/upload/v1/resumes/a.pdf`);
  bad(`https://res.cloudinary.com/${C}/raw/upload/v1/investor-documents/a.exe`);
  bad(`https://res.cloudinary.com/${C}/image/upload/v1/investor-documents/a.pdf`);
  bad(`https://res.cloudinary.com/${C}/raw/upload/v1/investor-documents/%2e%2e/x.pdf`);
});
