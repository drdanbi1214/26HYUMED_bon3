/**
 * 공유 Google Drive 폴더에서 이름에 "인계"가 포함된 Google Docs를 찾아 Markdown으로 내보낸다.
 * 첫 실행만 브라우저 Google 로그인/읽기 권한 허용이 필요하고, 이후에는 저장된 로컬 토큰을 쓴다.
 */
import { authenticate } from "@google-cloud/local-auth";
import { google } from "googleapis";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const credentialPath = path.join(root, ".google-drive-client.local.json");
const tokenPath = path.join(root, ".google-drive-token.local.json");
const outputDir = path.join(root, "public", "handovers", "synced");
// 현재 사용자가 준 "본과 3학년" 공유 폴더. 환경변수로 다른 폴더를 지정할 수도 있다.
const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID ?? "1K87u0jfBgoWONFOdx6_bMP7eft75U-2L";
const scopes = ["https://www.googleapis.com/auth/drive.readonly"];
// 올해 본3 인계 문서만 대상. 예: "26-류마티스내과-인계 (서울)"
// 괄호 뒤에 "공통사항" 같은 설명이 붙는 파일도 같은 인계로 본다.
const handoverName = /^26-.+-인계\s*\((서울(?:\+구리)?|구리)\)(?:\s+.+)?$/;
// 아래 과는 분반/턴 순서가 별도 운영되어 현재 인계 검색에서 제외한다.
const excludedHandoverName = /^26-(?:외과|산부인과|소아청소년과|정신과|정신건강의학)-인계\s*\((서울(?:\+구리)?|구리)\)/;
const auditMode = process.argv.includes("--audit");
const missingDepartmentTerms = ["소화기내과", "진단검사의학"];

async function authorize() {
  try {
    const credentials = JSON.parse(await readFile(tokenPath, "utf8"));
    const config = JSON.parse(await readFile(credentialPath, "utf8"));
    const clientConfig = config.installed ?? config.web;
    const auth = new google.auth.OAuth2(clientConfig.client_id, clientConfig.client_secret, clientConfig.redirect_uris?.[0]);
    auth.setCredentials(credentials);
    return auth;
  } catch {
    const auth = await authenticate({ keyfilePath: credentialPath, scopes });
    await writeFile(tokenPath, JSON.stringify(auth.credentials, null, 2), { mode: 0o600 });
    return auth;
  }
}

async function listHandoverCandidates(drive, rootFolderId) {
  const found = [];
  const auditMatches = [];
  const folders = [{ id: rootFolderId, path: "본과 3학년" }];
  let nextIndex = 0;

  async function visitFolders() {
    while (nextIndex < folders.length) {
      const folder = folders[nextIndex++];
      const folderId = folder.id;
      let pageToken;
      do {
        const response = await drive.files.list({
          q: `'${folderId}' in parents and trashed = false`,
          pageToken,
          pageSize: 1000,
          fields: "nextPageToken,files(id,name,mimeType,modifiedTime)",
          supportsAllDrives: true,
          includeItemsFromAllDrives: true,
        }, { timeout: 20_000 });
        for (const file of response.data.files ?? []) {
          if (file.mimeType === "application/vnd.google-apps.folder" && file.id) {
            folders.push({ id: file.id, path: `${folder.path}/${file.name}` });
          }
          if (file.mimeType === "application/vnd.google-apps.document" && (file.name ?? "").includes("인계")) found.push(file);
          if (auditMode && file.mimeType === "application/vnd.google-apps.document" && missingDepartmentTerms.some(term => (file.name ?? "").includes(term))) {
            auditMatches.push({ name: file.name, path: folder.path, modifiedTime: file.modifiedTime });
          }
        }
        pageToken = response.data.nextPageToken;
      } while (pageToken);
    }
  }

  // OAuth 토큰 갱신 중 동시 요청이 겹치지 않도록 순차 탐색한다.
  await visitFolders();
  return { found, auditMatches };
}

const safeName = name => name.replace(/[\\/:*?"<>|]/g, "_");

async function main() {
  const auth = await authorize();
  console.log("Google Drive 읽기 권한을 확인했습니다.");
  const drive = google.drive({ version: "v3", auth });
  const { found: inThisFolder, auditMatches } = await listHandoverCandidates(drive, rootFolderId);
  const files = inThisFolder.filter(file => handoverName.test(file.name ?? "") && !excludedHandoverName.test(file.name ?? ""));
  console.log(`공유 폴더에서 '인계' 문서 ${inThisFolder.length}개를 확인했습니다.`);
  console.log("발견된 파일명:");
  for (const file of inThisFolder) console.log(`- ${file.name}`);
  console.log(`현재 자동 반영 규칙에 맞는 파일: ${files.length}개`);
  await mkdir(outputDir, { recursive: true });

  const manifest = [];
  for (const file of files) {
    const fileName = `${safeName(file.name)}.md`;
    const exported = await drive.files.export({ fileId: file.id, mimeType: "text/markdown" }, { responseType: "arraybuffer" });
    await writeFile(path.join(outputDir, fileName), Buffer.from(exported.data));
    manifest.push({ fileName, sourceName: file.name, modifiedTime: file.modifiedTime });
  }
  await writeFile(path.join(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2));
  if (auditMode) {
    await writeFile(path.join(outputDir, "missing-handover-audit.json"), JSON.stringify(auditMatches, null, 2));
    console.log(`누락 의심 과 관련 문서 ${auditMatches.length}개를 missing-handover-audit.json에 기록했습니다.`);
  }
  console.log(`${files.length}개 Google Docs 인계를 public/handovers/synced에 반영했습니다.`);
}

main().catch(error => {
  console.error("인계 동기화에 실패했습니다:", error.message);
  process.exit(1);
});
