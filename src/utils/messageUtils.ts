/**
 * 清理消息内容，去除 <think></think> 标签及其内容
 * @param content 原始消息内容
 * @returns 清理后的内容
 */
export const cleanThinkTags = (content: string): string => {
  // 使用正则表达式去除 <think></think> 标签及其内容
  // 支持多行匹配，包括标签内的换行符
  const thinkTagRegex = /<think>[\s\S]*?<\/think>/gi;
  return content.replace(thinkTagRegex, '').trim();
};

/**
 * 检查消息是否包含 markdown 内容
 * @param content 消息内容
 * @returns 是否包含 markdown 格式
 */
export const hasMarkdownContent = (content: string): boolean => {
  // 检查常见的 markdown 格式标记
  const markdownPatterns = [
    /#{1,6}\s/,           // 标题 # ## ###
    /\*\*.*?\*\*/,        // 粗体 **text**
    /\*.*?\*/,            // 斜体 *text*
    /`.*?`/,              // 行内代码 `code`
    /```[\s\S]*?```/,     // 代码块 ```code```
    /\[.*?\]\(.*?\)/,     // 链接 [text](url)
    /^\s*[-*+]\s/m,       // 无序列表 - * +
    /^\s*\d+\.\s/m,       // 有序列表 1. 2. 3.
    /^\s*>\s/m,           // 引用 >
    /^\s*\|.*\|/m,        // 表格 |column|
    /!\[.*?\]\(.*?\)/,    // 图片 ![alt](url)
  ];
  
  return markdownPatterns.some(pattern => pattern.test(content));
};

/**
 * 处理消息内容，清理思考标签并判断是否需要 markdown 渲染
 * @param content 原始消息内容
 * @returns 处理结果对象
 */
export const processMessageContent = (content: string): {
  cleanedContent: string;
  hasMarkdown: boolean;
} => {
  const cleanedContent = cleanThinkTags(content);
  const hasMarkdown = hasMarkdownContent(cleanedContent);
  
  return {
    cleanedContent,
    hasMarkdown,
  };
}; 