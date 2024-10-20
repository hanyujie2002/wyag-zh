import { defineUserConfig } from 'vitepress-export-pdf'

const headerTemplate = `<div style="margin-top: -0.4cm; height: 70%; width: 100%; display: flex; justify-content: center; align-items: center; color: lightgray; border-bottom: solid lightgray 1px; font-size: 10px;">
  <span class="title">自己动手写 Git</span>
</div>`;

export default defineUserConfig({
    outFile: '自己动手写 Git.pdf',
    pdfOptions: {
        format: 'A4',
        printBackground: true,
        headerTemplate,
        footerTemplate: '',
        displayHeaderFooter: true,
        margin: {
            left: 25,
            right: 25,
            top: 60,
            bottom: 60,
        },
    },
})