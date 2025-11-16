import { defineUserConfig } from "vitepress-export-pdf";

const headerTemplate = `<div style="margin-top: -0.4cm; height: 70%; width: 100%; display: flex; justify-content: center; align-items: center; color: lightgray; border-bottom: solid lightgray 1px; font-size: 10px;">
  <span class="title">自己动手写 Git</span>
</div>`;

const footerTemplate = `<div style="margin-top: -0.4cm; height: 70%; width: 100%; display: flex; justify-content: center; align-items: center; color: lightgray; border-bottom: solid lightgray 1px; font-size: 10px;">
  <span class="title">http://wyag-zh.hanyujie.xyz/</span>
</div>`;

const routePatterns = [
  "/1.-引言.html",
  "/2.-开始.html",
  "/3.-创建仓库init.html",
  "/4.-读取和写入对象hash-object-和-cat-file.html",
  "/5.-阅读提交历史日志.html",
  "/6.-读取提交数据检出.html",
  "/7.-引用标签和分支.html",
  "/8.-处理暂存区和索引文件.html",
  "/9.-暂存区和索引第二部分暂存和提交.html",
  "/10.-最后的话.html",
];

export default defineUserConfig({
  outFile: "自己动手写 Git.pdf",
  routePatterns,
  pdfOptions: {
    format: "A4",
    printBackground: true,
    headerTemplate,
    footerTemplate,
    displayHeaderFooter: true,
    margin: {
      left: 25,
      right: 25,
      top: 60,
      bottom: 60,
    },
  },
  sorter: (pageA, pageB) => {
    // how to skip `mdbook` SUMMARY.md ?
    if (pageA.path.includes("SUMMARY.html")) {
      return 0;
    }
    const regex = /\d+/;
    const aIndex = regex.exec(pageA.path)?.[0] || "0";
    const bIndex = regex.exec(pageB.path)?.[0] || "0";
    return parseInt(aIndex, 10) - parseInt(bIndex, 10);
  },
});
