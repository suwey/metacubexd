# sync.md — anywhere 分支同步上游指南

写给执行"合并上游"的 agent：本文说明**哪些本地内容必须保留**、**遇到上游变化如何决策**。不依赖具体行号或文件路径——上游会重构、会改名，按语义重新落位。

## 背景

- 仓库：`~/metacubexd`。`origin` = suwey/metacubexd（fork），`upstream` = MetaCubeX/metacubexd。
- `anywhere` 分支定期合并上游 `main`（origin/main 与 upstream/main 保持一致，同步前先把本地 main fast-forward 到 origin/main）。
- **原则：除下列白名单外，一切以上游为准。** 即使 anywhere 历史上有过其他改动，也一律丢弃取上游，不要"顺手保留"。

## 白名单：必须保留的本地内容

### 1. 配置文件上传/读取/编辑功能

- setup 页的"上传配置文件并应用"入口（点击/拖拽选择文件 → 应用到内核，含成功/失败/空文件提示）。
- config 页的"编辑配置文件"Modal：读当前配置文本 → Monaco 编辑 → 保存写回。
- Monaco 编辑器支持 `language="toml"`（用 ini 语法高亮渲染 TOML 配置）；monaco 初始化处需导入 ini.contribution；编辑器 model URI 用 `inmemory://config/anywhere.toml`（避免被 yaml schema 校验劫持）。
- 对应内核 API：GET / PUT `configs/file`（经 useRequest，指向内核地址）。
- i18n 共 7 个键：`uploadConfigHint` `applyingConfig` `configFileApplied` `configFileApplyFailed` `configFileEmpty` `editConfigFile` `configFileLoadFailed`，en/ja/zh/ko/fr/fa 均需存在（插入在 `remoteConfigURLPlaceholder` 与 `shortcuts` 之间的位置即可）。

### 2. README 的安卓打包说明

"Embed in an Android App (Bundled Assets)" 一节：AAPT 会剥掉下划线开头的目录，打包时需把 `_nuxt`→`nuxt`、`_fonts`→`fonts` 改名复制进 assets，应用运行时复制到文件系统时再改回。上游 README 有变动时，这一节要保留或重新插入。

### 3. release 检查地址指向 fork

- 前端（dashboard）release 检查 → `repos/suwey/metacubexd`（latest 与 releases 列表两处）。
- 后端（内核）release 检查（stable/meta/alpha 等非 vernesong 渠道）→ `repos/suwey/quiche`。
- **保持不动**：vernesong alpha-smart 渠道仍指 `repos/vernesong/mihomo`；桌面端 `apps/desktop` 的 update-check 与 agent 的内核下载 URL 仍指上游——有意为之，不要改。
- fork 的 tag 是纯 `vX.Y.Z` 风格，不需要版本号前缀剥离逻辑（对比版本直接比较即可）。

## 决策规则：遇到上游变化怎么办

1. **冲突/重叠**：白名单内容与上游改动落在同一处时，以上游新结构为准，把本地特性**重新施加**到新结构上；不是让上游迁就本地写法。
2. **上游重构/改名/拆分了特性所在文件**：在新文件里找到对应位置重新实现白名单特性；找不到明确落点就放到语义最接近的位置，并在提交信息里说明。
3. **上游 API/类型收紧导致白名单代码编译不过**：改白名单代码去适配上游新 API，而不是放宽上游的类型或契约。（实例：上游把 useRequest 收紧为仅 `.json()`，配置编辑器在 config.vue 内 cast 取 `.text()`，不动 useApi.ts 的类型。）
4. **上游新增测试/校验与白名单冲突**（locale 键位一致性、hardcode 的 URL 断言等）：把关联的测试数据/翻译同步成与白名单一致。
5. **白名单之外的 anywhere 遗留改动**（fork 的 Versions.vue 行为、格式化差异、版本号前缀测试等）：一律还原为上游版本。

## 合并完成后的验证

- `git diff main --stat`：应只含白名单相关文件——README.md、setup.vue、config.vue、MonacoYamlEditor.client.vue、monaco-setup.ts、6 个 locale、useApi.ts、backendReleases.spec.ts，以及 sync.md 本文件。行数随上游演进变化，不必与历史基线一致。
- `pnpm -r typecheck` 全过。
- `cd packages/ui && pnpm vitest run --exclude='e2e/**'` 全过（含 locale parity、backendReleases）。
- `pnpm build:ui` 重新打包后，在 `packages/ui/.output/public/_nuxt` 中能 grep 到 `suwey/quiche` 与 `suwey/metacubexd`，grep 不到 `MetaCubeX/metacubexd`、`MetaCubeX/mihomo`。
- 提交为 merge commit，说明保留了哪些内容；不推送，除非用户要求。

## 已知历史坑（示例，非固定清单）

- config.vue 模板不得引用未定义变量（曾有过悬空的 `isEditorOpen`，vue-tsc 严格模式会报错）。
- locale 一致性测试 `PARITY_LOCALES = zh,ja,ko,fr,fa`；`ru` 被上游显式豁免，不需要补键。
- `useApi.backendReleases.spec.ts` 会 hardcode repo URL，改 release 地址时必须同步改断言。
- suwey/quiche、suwey/metacubexd 未发布 release 时，升级检查显示"无更新"属正常现象。
