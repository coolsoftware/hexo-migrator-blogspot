'use strict';

require('chai').should();
const { join } = require('path');
const { exists, listDir, readFile, rmdir, unlink, writeFile } = require('hexo-fs');
const { slugize, escapeHTML, unescapeHTML } = require('hexo-util');
const TurndownService = require('turndown');
const tomd = new TurndownService();
const Hexo = require('hexo');
const hexo = new Hexo(process.cwd(), { silent: true });
const m = require('../lib/blogspot-migrator').bind(hexo);
const prepareContent = require('../lib/prepare-content');
const postMd = require('../lib/post-md');

const md = str => {
    return tomd.turndown(str);
};

describe('migrator', function() {
    this.timeout(15000);

    before(() => hexo.init());

    afterEach(async () => {
        const exist = await exists(hexo.source_dir);
        if (exist) await rmdir(hexo.source_dir);
    }); 

    it('prepare content', async () => {
        const content = '<pre><code class="language-javascript">[<br />'+
        '  {<br/>'+
        '    username: "john.doe",<br/>'+
        '    roles: ["user"],<br   />'+
        '    contacts: [<br />\n'+
        '      {<br />'+
        '        name: "John Doe",<br />'+
        '        email: "johndoe@gmail.com"<br />'+
        '      },<br />'+
        '      {<br />'+
        '        name: "J.D.",<br />'+
        '        email: "jd@gmail.com",<br />'+
        '        phone: "+11111111111"<br />'+
        '      }<br />'+
        '    ]<br />'+
        '  },<br />'+
        '  {<br />'+
        '    username: "jack.sparrow",<br />'+
        '    roles: ["manager"],<br />'+
        '    contacts: [<br />'+
        '      {<br />'+
        '        name: "Jack Sparrow (gmail)",<br />'+
        '        email: "jack.sparrow@gmail.com",<br />'+
        '      },<br />'+
        '      {<br />'+
        '        name: "Jack Sparrow (hotmail)",<br />'+
        '        email: "jack.sparrow@hotmail.com",<br />'+
        '      }<br />'+
        '    ]<br />'+
        '  }<br />'+
        ']<br />'+
        '</code></pre>\n'+
        '&lt;?php require_once __DIR__ . "/vendor/autoload.php"; ?&gt;<br />';
        const prepared_content = prepareContent(content);
        prepared_content.includes('<br />\n').should.eql(true);
        prepared_content.includes('<br /> ').should.eql(false);
        prepared_content.includes('<br/> ').should.eql(false);
        prepared_content.includes('<br  /> ').should.eql(false);
        prepared_content.includes('<br />\n\n').should.eql(false);
        prepared_content.includes('&lt;?').should.eql(false);
        prepared_content.includes('?&gt;').should.eql(false);
        const content_md = md(prepared_content);
        //console.log(content_md);
        const post_md = postMd(content_md);
    });

    it('prepare content 2', async () => {
        const content = "\u003Cdiv dir=\"ltr\" style=\"text-align: left;\" trbidi=\"on\"\u003E\u003Cstyle"+
" type=\"text\/css\"\u003E.sc0 {  font-family: 'Courier New';  font-size: 10pt;  color: #808080; } .sc1 {  font-family: 'Courier New';  font-size: 10pt; } .sc4 {  font-family: 'Courier New';"+
"  font-size: 10pt;  color: #008080; } .sc5 {  font-family: 'Courier New';  font-size: 10pt;  color: #804000; } .sc9 {  font-family: 'Courier New';  font-size: 10pt;  font-weight: bold;  color: #0000FF; }"+
" .sc13 {  font-family: 'Courier New';  font-size: 10pt;  font-weight: bold;  color: #000080; } .sc14 {  font-family: 'Courier New';  font-size: 10pt;  font-weight: bold; }"+
" \u003C\/style\u003E"+"\u003Cspan class=\"sc9\"\u003Etest\u003C\/span\u003E\u003Cspan class=\"sc0\"\u003E  \u003C\/span\u003E"+"\u003C\/div\u003E";
        const prepared_content = prepareContent(content);
        prepared_content.includes('<style').should.eql(false);
        prepared_content.includes('</style>').should.eql(false);
        const content_md = md(prepared_content);
        //console.log(content_md);
        const post_md = postMd(content_md);
    });
    
    it('no argument', async () => {
        try {
            await m({ _: [''] });
        } catch (err) {
            err.message.split('\n')[0].should.eql('Usage: hexo migrate blogspot <source> [<limit>] [<target>] [<base_url>]');
        }
    });

    it('invalid url', async () => {
        const url = 'http://foo.invalid/';
        try {
            await m({ _: [url] });
        } catch (err) {
            err.message.includes('RequestError:').should.eql(true);
        }
    });
    
    it('invalid path', async () => {
        const path = 'does/not/exist';
        try {
            await m({ _: [path] });
        } catch (err) {
            err.message.includes('Error: ENOENT: no such file or directory').should.eql(true);
        }
    });

    it('invalid json', async () => {
        const json = 'json:AAA';
        try {
            await m({ _: [json] });
        } catch (err) {
            err.message.includes('SyntaxError: Unexpected token A in JSON at position 0').should.eql(true);
        }
    });
    
    it('helloworld.blogspot.com - url', async () => {
        await m({ _: ['https://hexomigrator.blogspot.com/']});
        const exist = await exists(join(hexo.source_dir, '_posts', '2022', '01', 'hello-world.md'));
        exist.should.eql(true);
    });

    it('local file', async () => {
        await m({ _: [join(__dirname, 'fixtures/feeds.json')]});
        const exist = await exists(join(hexo.source_dir, '_posts', '2022', '01', 'hello-world.md'));
        exist.should.eql(true);
    });
});