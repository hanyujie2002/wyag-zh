import { defineConfig } from 'vitepress'
import footnote from 'markdown-it-footnote'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "自己动手写 Git",
  description: "从零开始写 Git（Write Yourself a Git，简称 wyag） 的中文翻译 | Chinese translation of Write Yourself a Git",
  markdown: {
    config: (md) => {
      md.use(footnote);
    }
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    // nav: [
      // { text: 'Home', link: '/README' },
      // { text: 'Examples', link: '/markdown-examples' }
    // ],
    outline: 'deep',
    sidebar: [
      {
        text: '教程',
        items: [
          { text: '1. 引言', link: '/docs/1.-引言' },
          { text: '2. 开始', link: '/docs/2.-开始' },
          { text: '3. 创建仓库：init', link: '/docs/3.-创建仓库init' },
          { text: '4. 读取和写入对象：hash-object 和 cat-file', link: '/docs/4.-读取和写入对象hash-object-和-cat-file' },
          { text: '5. 阅读提交历史日志', link: '/docs/5.-阅读提交历史日志' },
          { text: '6. 读取提交数据检出', link: '/docs/6.-读取提交数据检出' },
          { text: '7. 引用标签和分支', link: '/docs/7.-引用标签和分支' },
          { text: '8. 处理暂存区和索引文件', link: '/docs/8.-处理暂存区和索引文件' },
          { text: '9. 暂存区和索引，第二部分暂存和提交', link: '/docs/9.-暂存区和索引第二部分暂存和提交' },
          { text: '10. 最后的话', link: '/docs/10.-最后的话' }
        ]
      },
      {
        text: '',
        items: [
          { text: '一文流', link: './docs/wyag-zh' },
        ]
      },
      {
        text: '版权',
        items: [
          { text: 'CC BY-NC-SA 4.0', link: 'https://creativecommons.org/licenses/by-nc-sa/4.0/' }
        ]
      },
      {
        text: '原作者',
        items: [
          { text: 'Thibault Polge', link: 'https://github.com/thblt' },
        ]
      },
      {
        text: '译者',
        items: [
          { text: 'hanyujie2002', link: 'https://github.com/hanyujie2002' }
        ]
      }
    ],
    search: {
      provider: 'local',
    },
    logo: '/favicon.ico',
    socialLinks: [
      { icon: 'github', link: 'https://github.com/hanyujie2002/wyag-zh' }
    ]
  }
})
