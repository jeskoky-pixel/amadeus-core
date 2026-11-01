import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import assert from 'node:assert/strict'
import test from 'node:test'
import {
  expectedPackageFiles,
  isForbiddenPackagePath,
  scanText,
  verifyPackage,
} from '../scripts/verify-package.mjs'

test('PRIV1 scanner rejects private session/workspace IDs, absolute user paths, credentials, and log paths', () => {
  assert.match(scanText('session-11111111-2222-4333-8444-555555555555', 'bad.txt').join(' '), /private-session-id/)
  assert.match(scanText('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee', 'bad.txt').join(' '), /workspace-uuid/)
  assert.match(scanText('C:\\Users\\alice\\life\\life.sqlite', 'bad.txt').join(' '), /absolute-user-path/)
  assert.match(scanText('C:/Users/alice/private', 'bad.txt').join(' '), /absolute-user-path/)
  assert.match(scanText('/home/alice/private', 'bad.txt').join(' '), /absolute-user-path/)
  assert.match(scanText('api_key = "sk-abcdefghijklmnop"', 'bad.txt').join(' '), /credential/)
  assert.match(scanText('-----BEGIN PRIVATE KEY-----', 'bad.txt').join(' '), /credential/)
  assert.equal(isForbiddenPackagePath('HANDOFF.md'), true)
  assert.equal(isForbiddenPackagePath('docs/verification/REPORT.md'), true)
  assert.equal(isForbiddenPackagePath('test/life-core.test.js'), true)
  assert.equal(isForbiddenPackagePath('logs/life.log'), true)
  assert.equal(isForbiddenPackagePath('src/index.js'), false)
})

test('PRIV2 actual Core tarball keeps Life assets and excludes internal evidence and data', () => {
  const root=resolve(process.cwd(),'../../..');
  const args=['pack','--ignore-scripts','--dry-run','--json'];
  const result=process.env.npm_execpath
    ? spawnSync(process.execPath,[process.env.npm_execpath,...args],{cwd:root,encoding:'utf8',maxBuffer:16*1024*1024})
    : spawnSync(process.platform==='win32'?'npm.cmd':'npm',args,{cwd:root,encoding:'utf8',shell:process.platform==='win32',maxBuffer:16*1024*1024});
  assert.equal(result.status,0,result.stderr);
  const parsed=JSON.parse(result.stdout),pack=Array.isArray(parsed)?parsed[0]:parsed['@fg-lab/amadeus-core'];
  const files=pack.files.map(f=>f.path);
  for(const required of ['src/index.js','lib/client.js','cordis.patch.yml','src/modules/life/src/index.js','src/modules/life/lib/client.js','src/modules/life/locale/zh.json','src/modules/life/icon.svg','src/modules/life/LICENSE'])assert.ok(files.includes(required),required);
  for(const file of files){
    assert.doesNotMatch(file,/(?:^|\/)(?:test|tests|backups|logs|\.github)(?:\/)|\.(?:sqlite|db|log|jsonl)$|\.private\./i);
    if(file.endsWith('cordis.patch.yml'))assert.equal(file,'cordis.patch.yml');
  }
})
