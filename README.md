# hexo-migrator-blogspot

[![npm version](https://badge.fury.io/js/hexo-migrator-blogspot.svg)](https://badge.fury.io/js/hexo-migrator-blogspot)

Migrate blog from blogspot (blogger) to [Hexo](https://hexo.io/).

## Install

```bash
npm install hexo-migrator-blogspot --save
```

## Usage

```bash
hexo migrate blogspot <source> [<limit>] [<target>] [<base_url>]
```

* `<source>` - your blogspot blog url. For example: https://hexomigrator.blogspot.com/
* `<limit>` - max. number of migrated posts. Optional. By default: 10000.
* `<target>` - target folder. Optional. By default: Hexo `_posts` folder.  
* `<base_url>` - blog base url. Optional. By default: `<source_protocol>`://`<source_domain>`/ where `<source_protocol>` - source url protocol (`http` or `https`), `source_domain` - source url domain.
