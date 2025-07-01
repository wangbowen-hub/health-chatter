# Dify API 集成说明

## 概述
此应用已成功集成Dify API，可以连接到您的Dify AI应用获得真实的AI回复。

## 📁 新增文件
1. **`src/services/difyApi.ts`** - Dify API服务类，处理所有API调用
2. **`src/config/dify.ts`** - 配置管理，支持环境变量和本地存储
3. **`src/components/ApiKeySettings.tsx`** - 用户友好的API密钥设置界面
4. **`src/utils/messageUtils.ts`** - 消息处理工具函数（清理思考标签、检测Markdown）
5. **`DIFY_INTEGRATION.md`** - 详细的使用说明文档
6. **`TEST_SAMPLES.md`** - 功能测试样例文档

## 配置方法

### 方法1: 环境变量配置 (推荐用于生产环境)
1. 在项目根目录创建 `.env` 文件
2. 添加以下配置：
```env
VITE_DIFY_API_KEY=your_dify_api_key_here
VITE_DIFY_BASE_URL=https://api.dify.ai/v1
```

### 方法2: 界面配置 (推荐用于开发和测试)
1. 启动应用
2. 点击右上角的设置图标 ⚙️
3. 输入您的Dify API密钥
4. 点击"保存设置"

## 获取Dify API密钥

1. 访问 [Dify云平台](https://cloud.dify.ai)
2. 登录您的账户
3. 创建或选择一个聊天机器人应用
4. 在应用概览页面找到"API密钥"部分
5. 复制API密钥

## 功能特性

### ✅ 已实现的功能
- 阻塞模式API调用 (同步响应)
- 会话状态管理 (自动维护conversation_id)
- 错误处理和fallback机制
- API密钥的安全存储
- 实时配置更新
- **智能内容处理**：自动清理AI输出中的`<think></think>`思考标签
- **Markdown渲染**：支持完整的Markdown格式显示，包括表格、代码块、链接等

### 🔄 支持的功能
- 流式响应 (代码已准备好，需要时可以启用)
- 自定义用户ID
- 输入参数传递
- 检索资源显示

### 🎯 API调用流程
1. 用户发送消息
2. 系统检查是否有配置的API密钥
3. 如果有密钥：调用Dify API获取AI回复
4. 如果无密钥：显示模拟回复并提示配置
5. **智能内容处理**：自动清理AI回复中的思考标签
6. **Markdown渲染**：检测并渲染Markdown格式内容
7. 自动处理会话连续性

## 🔧 新增功能详解

### 思考标签清理
应用会自动检测并清理AI回复中的`<think></think>`标签及其内容，确保用户只看到最终的回复内容。

**示例**：
```
原始内容：
<think>
用户在问补钙产品，我需要推荐汤臣倍健...
</think>
根据您的需求，我推荐汤臣倍健瞬释液体钙...

显示结果：
根据您的需求，我推荐汤臣倍健瞬释液体钙...
```

### Markdown渲染支持
应用支持完整的Markdown格式，包括：
- **标题**：`# ## ###`
- **粗体**：`**文本**`
- **斜体**：`*文本*`
- **代码**：`` `代码` ``和代码块
- **列表**：有序和无序列表
- **链接**：`[文本](URL)`
- **表格**：完整的表格支持
- **引用**：`> 引用内容`

系统会自动检测内容是否包含Markdown格式，并选择合适的渲染方式。

## API参数说明

根据[Dify API文档](https://docs.dify.ai/api-reference/%E5%AF%B9%E8%AF%9D%E6%B6%88%E6%81%AF/%E5%8F%91%E9%80%81%E5%AF%B9%E8%AF%9D%E6%B6%88%E6%81%AF)，当前集成支持以下参数：

- `query`: 用户输入的问题
- `response_mode`: 响应模式 ('blocking' 或 'streaming')
- `conversation_id`: 会话ID (自动管理)
- `user`: 用户标识符 (默认: 'default-user')
- `inputs`: 额外的输入参数 (可选)

### 关于inputs参数
应用在所有API请求中都会自动添加以下inputs参数：
```json
{
  "topic_id": "123456"
}
```
这个参数会传递给Dify应用，可以在工作流中使用。如需修改或添加其他inputs参数，请编辑 `src/components/ChatInterface.tsx` 文件中的相关代码。

## 错误处理

应用包含完善的错误处理机制：
- API调用失败时显示友好的错误信息
- 网络问题时自动fallback到模拟回复
- 无效API密钥时的提示和引导

## 安全性

- API密钥存储在localStorage中
- 支持环境变量配置避免硬编码
- 前端请求直接调用Dify API，无需后端代理

## 自定义配置

如需修改API行为，可以编辑 `src/services/difyApi.ts` 文件：
- 调整超时时间
- 修改默认参数
- 添加自定义请求头
- 实现流式响应

## 故障排除

### 常见问题
1. **API密钥无效**: 检查密钥是否正确复制，是否包含多余的空格
2. **网络连接失败**: 检查网络连接和防火墙设置
3. **CORS错误**: Dify API支持跨域请求，通常不会有此问题

### 调试模式
打开浏览器开发者工具的Console标签，可以查看详细的API调用日志和错误信息。 