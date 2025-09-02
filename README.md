# 网络安全与信息化知识测试题（简洁版）

在线考试页面，支持随机组卷、倒计时、自动评分、错题导出（docx）、导航分段、未答跳转、本地续答。

## 本地运行

```bash
python3 -m http.server 5173 --bind 127.0.0.1
# 打开 http://127.0.0.1:5173/simple-exam/
```

## 目录说明
- simple-exam/: 纯前端静态页面（用于部署），内含题库 `题库.md`
- 题库.md: 顶层题库原始文件

## GitHub Pages

将 `simple-exam/` 作为网站根目录部署即可（Pages 选择 `main` 分支，目录选择 `/simple-exam`）。
