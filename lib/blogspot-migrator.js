'use strict';

const async = require('async');
const TurndownService = require('turndown');
const got = require('got');
const moment = require('moment');
const { readFile, writeFile } = require('hexo-fs');
const prepareContent = require('./prepare-content');
const postMd = require('./post-md');
const path = require('path');

module.exports = async function(args) {
    let source = args._.shift();
    let limit = args._.shift(); 
    let target = args._.shift();
    let base_url = args._.shift();
    const tomd = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' });
    const { config, log } = this;
    const Post = this.post;
    let postsNum = 0;
    let errNum = 0;
    let skipNum = 0;

    const md = str => {
        return tomd.turndown(str);
    };

    try { 
        if (!source) {
            const help = [
              'Usage: hexo migrate blogspot <source> [<limit>] [<target>] [<base_url>]',
              '',
              'For more help, you can check the docs: http://hexo.io/docs/migration.html'
            ];
            throw help.join('\n');
        }        
        if (!target) {
            target = '' + config.source_dir;
            if (target && !target.endsWith('/')) target += '/';
            target += '_posts/';
        }
        if (!target.endsWith('/')) target += '/';
        if (base_url && !base_url.endsWith('/')) {
            throw 'Invalid base_url';
        }
        let input;
        let json_match = /^json:(.*)$/i.exec(source);
        if (json_match) {
            input = json_match[1];
        } else 
        if (/^http(s)?:\/\//i.test(source)) {
            if (/^http(s)?:\/\/[^/]+\/$/i.test(source)) {
                const max_results = limit || 10000;
                source += 'feeds/posts/default?alt=json&max-results=' + max_results;
            }
            if (!base_url) {
                const base_url_match = /^(https|https)(:\/\/[^/]+\/).*$/i.exec(source);
                if (base_url_match) {
                    base_url = (base_url_match[1]+base_url_match[2]).toLowerCase();
                }
            }    
            input = await got(source, { resolveBodyOnly: true, retry: 0 });
        } else {
            input = await readFile(source);
        }
        let posts = JSON.parse(input).feed.entry;
        if (!limit) limit = posts.length;
        for (let i = 0; i < limit; i++) {
            const item = posts[i];
            //console.log('item', item);
            const title = item.title['$t'];
            let alternate = '';
            if (Array.isArray(item.link)) {
                item.link.forEach(link => {
                    if (link.rel === 'alternate') {
                        alternate = link.href;
                        if (base_url) {
                            if (alternate.toLowerCase().startsWith(base_url)) {
                                alternate = alternate.substring(base_url.length);
                            }
                        }
                        else {
                            const url_match = /^(https|https)(:\/\/[^/]+\/)(.*)$/i.exec(alternate);
                            if (url_match) {
                                alternate = url_match[3].toLowerCase();
                            }            
                        }
                    }
                });
            }
            const published = item.published['$t'];
            const updated = item.updated['$t'];
            const year = moment(published).format('YYYY');
            const month = moment(published).format('MM');
            let file;
            const title_match = /^.*\/([^/]+)\.html$/i.exec(alternate);
            if (title_match) {
                file = path.join(year, month, title_match[1]);
            } else {
                file = path.join(year, month, title.replace(/\s/g,'-').replace(/[^A-z 0-9 -]/g,''));
            }
            const tags = (item.category || []).map(category => '\n  - "' + category.term + '"');
            let author = item.author && item.author.reduce((prev, author) => {
                if (prev) return prev;
                return author.name['$t'];
            }, '');
            const content = prepareContent(item.content['$t']);
            const content_md = postMd(md(content));            
            //console.log('title: ', title);
            //console.log('alternate: ', alternate);
            //console.log('base_url: ', base_url);
            //console.log('file: ', file);
            //console.log('published: ', published);
            //console.log('updated: ', updated);
            //console.log('tags: ', tags);
            //console.log('author: ', author);
            //console.log('content (md): ', content_md);
            //console.log('target: ', target);
/*            
            const post = {
                title,
                date: published,
                author,
                tags,
                content: content_md
            };
            try {
                await Post.create(post);
                postsNum++;
            } catch (err) {
                log.error(err);
                errNum++;                
            }
*/            
            const header = [
                '---',
                'title: "' + title + '"',
                'tags: ' + tags.join(''),
                'author: "' + author + '"',
                'date: "' + moment(published).format('YYYY-MM-DD HH:mm:ss') + '"',
                '---',
            ];
            //console.log('header: ', header);
            try {
//                await writeFile(target + file + '.html', content);
                await writeFile(target + file + '.md', header.join('\n') + '\n\n' + content_md);
                postsNum++;
            } catch (err) {
                log.error(err);
                errNum++;                
            }
        }
        log.i('%d posts migrated.', postsNum);           
        if (errNum) log.error('%d posts failed to migrate.', errNum);
        if (skipNum) log.i('%d posts skipped.', skipNum);
    } catch (err) {
        throw new Error(err);
    }   
}