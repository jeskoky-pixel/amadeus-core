// Applies reviewed overlays to an isolated checkout, never to production data.
import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
const root=path.resolve(process.argv[2]??'');if(!process.argv[2])throw Error('Pass an isolated upstream checkout');
const sha=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
if(sha!=='d6352e5435b45ebb48fe240dc03a2bec0476bd56')throw Error('Wrong upstream version');
const overlay=path.join(import.meta.dirname,'overlay');
for(const dir of ['browser','cookies'])for(const name of fs.readdirSync(path.join(overlay,dir)))fs.copyFileSync(path.join(overlay,dir,name),path.join(root,dir,name));
function edit(file,before,after){const p=path.join(root,file);const text=fs.readFileSync(p,'utf8').replaceAll('\r\n','\n');if(after&&text.includes(after))return;if(text.includes(before))fs.writeFileSync(p,text.replaceAll(before,after));else throw Error('Unexpected source '+file);}
edit('browser/browser_download.go','func EnsureBrowser()','func EnsureBundledBrowser()');
edit('service.go','"github.com/xpzouying/headless_browser"','');
edit('service.go','*headless_browser.Browser','*browser.Browser');
edit('cookies/cookies.go','os.ReadFile(c.path)','secureRead(c.path)');
edit('cookies/cookies.go','os.WriteFile(c.path, data, 0644)','secureWrite(c.path, data)');
edit('cookies/cookies.go','cks = nil // 文件还不存在：先把 seed 落下来，cookies 之后再补','if !os.IsNotExist(errors.Cause(err)) { return err }; cks = nil // Only initialize an absent file.');
edit('main.go','"flag"','"flag"\n "io"\n "strings"');
edit('main.go','func main() {','func main() {\n if os.Getenv("AMADEUS_HOST_PIPE")=="1" { go func(){ _,_ = io.Copy(io.Discard,os.Stdin); os.Exit(0) }() }');
edit('main.go','logrus.Infof("xiaohongshu-mcp version: %s", version)','if token=="" || !strings.HasPrefix(port,"127.0.0.1:") { logrus.Fatal("authenticated loopback endpoint required") }; logrus.Infof("xiaohongshu-mcp version: %s", version)');
console.log('Prepared pinned Windows executor overlays; compile and test before packaging.');

// An uncertain click must never be retried. Requests inherit cancellation.
edit('xiaohongshu/like_favorite.go','attempt <= 2','attempt <= 1');
edit('xiaohongshu/comment_feed.go','page := f.page.Timeout(', 'page := f.page.Context(ctx).Timeout(');
// Existing identical text is not evidence of a newly successful submission.
edit('xiaohongshu/comment_feed.go','if err := humanize.Click(submitButton); err != nil {','if commentRendered(page, content) { return fmt.Errorf("identical comment already visible; refusing ambiguous send") }; if err := humanize.Click(submitButton); err != nil {');
edit('xiaohongshu/comment_feed.go','if err := humanize.Click(submitBtn); err != nil {','if commentRendered(page, content) { return fmt.Errorf("identical reply already visible; refusing ambiguous send") }; if err := humanize.Click(submitBtn); err != nil {');

edit('xiaohongshu/like_favorite.go',`logrus.Warnf("failed to read interact state: %v (continue to try clicking)", err)
		return a.toggleInteract(ctx, page, feedID, SelectorLikeButton, targetLiked, actionType,
			func(liked, collected bool) bool { return liked })`,`return fmt.Errorf("cannot verify initial like state: %w", err)`);

