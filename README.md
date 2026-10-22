# YellowSubmariner · GitHub Pages 前台

这个目录只包含公开网站的静态页面、样式、ACG 图片和公开内容阅读组件。GitHub 账号为 `YellowSubmariner`，仓库为 `yellowsubmariner`；发布成功后的公开地址为 https://yellowsubmariner.github.io/yellowsubmariner/ ，访客无需 ChatGPT 账号。

文章和照片继续由原有 CMS 维护：

- 后台入口：https://yellowsubmaine-journal.satinymorel.chatgpt.site/admin
- 使用原来的站主 ChatGPT 账号登录，管理生活、旅程、阅读、科研、学习五个栏目。
- 保存草稿、发布、更新、下架、回收站恢复和照片上传均在后台完成。GitHub 前台刷新后读取最新公开内容，不需要每发一篇文章就重新部署。
- 照片默认私有；加入公开相册或被已发布文章引用后，才向访客开放。GitHub 只读取公开文章和公开相册，不包含后台代码或管理凭证。

## 发布

将本目录作为 `YellowSubmariner/yellowsubmariner` 仓库的根目录。GitHub Free 账号需使用公开仓库；GitHub Pro 等支持的账号可以使用私有仓库发布公开网站。在仓库的 Settings → Pages 中，把 Source 设为 GitHub Actions。推送到 `main` 或手动运行工作流，即可发布。

仓库名为 `用户名.github.io` 时，地址为 `https://用户名.github.io/`；普通仓库地址为 `https://用户名.github.io/仓库名/`。所有静态资源使用相对路径，两种形式都适用。不要给仓库添加账号密码、环境文件、私有照片、CMS 数据库或其他非公开文件。

文章分享链接保留当前 GitHub Pages 地址，例如 `https://yellowsubmariner.github.io/yellowsubmariner/?article=文章编号`。页脚「船舱管理」跳转原有 CMS 后台：https://yellowsubmaine-journal.satinymorel.chatgpt.site/admin 。

## 内容连接

`cms/front.js` 固定读取现有 CMS 的公开 `/api/posts`、文章详情和 `/api/photos`；请求不携带登录凭证，图片仅接受该 CMS 来源下的 `/media/编号`。正文使用随网站分发的 DOMPurify 清理。没有外部 CDN 依赖。

CMS 服务端必须允许精确来源 `https://yellowsubmariner.github.io` 读取上述公开 API，且只开放相应 GET 请求；管理接口与写入接口不开放跨域访问。CORS 来源不包含仓库路径 `/yellowsubmariner/`。图片按普通跨域图片加载，无需给媒体增加 CORS。首次上线或 GitHub 用户名变化时，应核对 CMS 的公开来源配置。请使用 HTTP 本地预览查看页面；直接打开文件无法代表正式跨域运行环境。

本目录不会自动导入开篇文章。已有五篇文章保留在原有 CMS 数据库；前台只显示实际公开内容，空栏目正常显示待更新状态。

## 文件说明

- `index.html`、`app.js`、`styles.css`、`scenery.css`：风景主题页面、日夜模式、双侧人物和 ACG 交互。
- `cms/front.js`、`cms/front.css`：公开手记、栏目筛选、分享阅读、相册和照片放大。
- `cms/vendor/purify.js`：本地 DOMPurify。
- `assets/`：原创风景插画、日本实景照片与 ACG 素材；来源及许可见 `assets/sources.json` 和页脚图片来源。
- `.github/workflows/pages.yml`：只打包公开页面及素材的 GitHub Pages 工作流。
- `.nojekyll`：保持静态文件原样发布。

原创海边封面由 OpenAI image_gen 生成。番剧视觉来自《青春猪头少年》《我的青春恋爱物语果然有问题》《败犬女主太多了》官方网站，版权归各自权利方；页面保留作品官网入口。海浪图片来自 Unsplash，页面结构参考 wayson.tech。

雪乃侧栏采用原始人物有效高度 1868px 的公开镜像图，仅裁掉透明留白并无损转换为 WebP；麻衣保持原图。《败犬》三人卡片使用 JR 东海官方联动的原生透明图，保留原始像素并无损编码。下载地址、原图尺寸及署名均记录在 `assets/sources.json`。

## 日本风景画廊

旅程区收录 18 张真实摄影作品：北海道夏季 3 张、神威岬 2 张、北海道冬景 3 张、函馆夜景 2 张、京都 3 张、神户 2 张、东京 3 张。它们是旅行灵感收藏，不代表站主亲自拍摄或已经到访。原有江之岛、千叶、丰桥 ACG 巡礼入口保留在画廊下方。

`japan-gallery-data.js` 保存画廊公开数据，`japan-gallery.js` 提供地点筛选、高清查看、左右键切图与焦点恢复，`japan-gallery.css` 提供桌面、手机与暗色布局。照片存于 `assets/japan-gallery/`，每张提供 480、960、1600、2400 像素 WebP，不放大原图；卡片使用 `srcset`、动态 `sizes`、延迟加载及固定尺寸，高清图仅在打开时加载。所有来源照片均核查完整预览，未见可见水印，没有去除水印。

可见署名与许可位于 `japan-photo-credits.html` 和放大浏览的底部；逐张来源、原生尺寸、许可、改动与输出文件校验值见 `assets/japan-gallery/sources.json`。照片来自 Wikimedia Commons / FIND/47，使用各自 CC0、CC BY 或 CC BY-SA 许可。此部分不向 CMS 写入数据，也不涉及私有朋友圈素材。
