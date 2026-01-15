import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { Send, User, Bot, RotateCcw, Paperclip, Copy, Check } from 'lucide-react';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, files: File[]) => void;
  isLoading: boolean;
  onReset: () => void;
}

// Internal component for the Copy button
const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-jinwu-600 transition-colors mt-3 pt-2 border-t border-slate-100 w-full justify-end"
      title="复制内容"
    >
      {isCopied ? (
        <>
          <Check className="w-3.5 h-3.5" />
          <span>已复制</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          <span>复制</span>
        </>
      )}
    </button>
  );
};

// Component to render mixed content: Plain Text + Bold + Legal Citations + Key Data (Dates, Money, IDs)
const StyledText: React.FC<{ text: string }> = ({ text }) => {
  // Regex Explanation:
  // 1. (**...**) matches bold markdown
  // 2. (《...》|第...条) matches legal citations
  // 3. Date: YYYY年MM月DD日 or YYYY-MM-DD (Escaped hyphen in char class [\-./])
  // 4. Money: ¥100 or 100元 (supports separators, decimals, and units like 万/亿)
  // 5. Contract/Doc No: Matches patterns like "合同编号：XXX" or "No.XXX"
  const regex = /(?:(\*\*[^*]+\*\*)|(《[^》]+》|第[0-9零一二三四五六七八九十百]+条)|(\d{4}年\d{1,2}月\d{1,2}日|\d{4}[\-./]\d{1,2}[\-./]\d{1,2})|([¥￥]\s?[\d,]+(?:\.\d+)?|\d+(?:,\d{3})*(?:\.\d+)?\s?[万亿]?(?:元|美元|欧元))|((?:合同|协议|订单)?编号[：:]\s*[\w-]+))/g;

  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;

        // 1. Handle Bold Markdown: **Text**
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
        }

        // 2. Handle Legal Citations (Requested: font-bold text-amber-600)
        if (part.startsWith('《') || part.startsWith('第')) {
          return <span key={i} className="font-bold text-amber-600 mx-0.5">{part}</span>;
        }

        // 3. Handle Date - Fixed regex range issue here by using [\-./] instead of range or just checking start
        if (/^\d{4}[年\-./]/.test(part)) {
           return <span key={i} className="font-semibold text-blue-600 mx-0.5 bg-blue-50 rounded px-0.5">{part}</span>;
        }

        // 4. Handle Money
        if (/[¥￥]/.test(part) || /(?:元|美元|欧元)$/.test(part)) {
           return <span key={i} className="font-semibold text-emerald-600 mx-0.5 bg-emerald-50 rounded px-0.5">{part}</span>;
        }

        // 5. Handle Contract/Doc No
        if (part.includes('编号')) {
           return <span key={i} className="font-mono text-xs font-bold text-violet-600 mx-0.5 bg-violet-50 rounded px-1 py-0.5">{part}</span>;
        }

        // Plain Text
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};

// Component to structure the message (Headers, Lists, Paragraphs, Blockquotes)
const MessageContentRenderer: React.FC<{ content: string; role: 'user' | 'model' }> = ({ content, role }) => {
  if (role === 'user') {
    return <div className="whitespace-pre-wrap">{content}</div>;
  }

  // 1. Remove outer ```markdown ... ``` blocks if they exist
  let cleanContent = content.replace(/^```(markdown|json)?\s*/i, '').replace(/\s*```$/, '');

  // 2. Split into lines
  const lines = cleanContent.split('\n');

  return (
    <div className="space-y-2 text-sm leading-relaxed text-slate-800">
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Handle Headers: ### Title
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-base font-bold text-slate-900 mt-5 mb-2 flex items-center gap-2">
              <div className="w-1 h-4 bg-jinwu-500 rounded-full"></div>
              <StyledText text={trimmed.slice(4)} />
            </h3>
          );
        }
        
        // Handle Headers: ## Title or #### Title
        if (trimmed.startsWith('## ') || trimmed.startsWith('#### ')) {
           const text = trimmed.replace(/^#+\s/, '');
           return (
            <h4 key={idx} className="text-sm font-bold text-slate-800 mt-4 mb-1">
              <StyledText text={text} />
            </h4>
          );
        }

        // Handle Blockquotes: > Text
        if (trimmed.startsWith('> ')) {
          return (
            <div key={idx} className="border-l-4 border-jinwu-400 bg-slate-50 pl-3 py-2 my-2 text-slate-600 italic rounded-r text-xs md:text-sm">
              <StyledText text={trimmed.slice(2)} />
            </div>
          );
        }

        // Handle Lists: - Item or * Item
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <div key={idx} className="flex gap-2 ml-1">
              <span className="text-jinwu-500 font-bold leading-6">•</span>
              <p className="flex-1">
                <StyledText text={trimmed.slice(2)} />
              </p>
            </div>
          );
        }

        // Handle Numbered Lists: 1. Item
        if (/^\d+\.\s/.test(trimmed)) {
           const dotIndex = trimmed.indexOf('.');
           return (
             <div key={idx} className="flex gap-2 ml-1">
               <span className="text-slate-600 font-bold min-w-[1.2rem]">{trimmed.substring(0, dotIndex + 1)}</span>
               <p className="flex-1">
                 <StyledText text={trimmed.substring(dotIndex + 1).trim()} />
               </p>
             </div>
           );
        }

        // Handle "Standalone Bold Line" as Header (e.g. **1. Analysis**)
        // If the line starts and ends with **, and is short enough to be a title
        if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 50) {
           return (
             <h4 key={idx} className="text-sm font-bold text-slate-900 mt-4 mb-1">
               {trimmed.slice(2, -2)}
             </h4>
           );
        }

        // Empty lines
        if (!trimmed) {
          return <div key={idx} className="h-2" />;
        }

        // Standard Paragraph
        return (
          <p key={idx}>
            <StyledText text={line} />
          </p>
        );
      })}
    </div>
  );
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, onSendMessage, isLoading, onReset }) => {
  const [inputText, setInputText] = useState('');
  const [inputFiles, setInputFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputText.trim() && inputFiles.length === 0) return;
    onSendMessage(inputText, inputFiles);
    setInputText('');
    setInputFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setInputFiles(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-jinwu-500 flex items-center justify-center text-white font-bold">
            金
          </div>
          <span className="font-semibold text-slate-800">金乌法律Ai顾问</span>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1 text-sm text-slate-500 hover:text-jinwu-600 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          开始新咨询
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1 ${
                msg.role === 'user' ? 'bg-slate-200' : 'bg-jinwu-100'
              }`}
            >
              {msg.role === 'user' ? (
                <User className="w-5 h-5 text-slate-600" />
              ) : (
                <Bot className="w-5 h-5 text-jinwu-700" />
              )}
            </div>
            
            <div
              className={`max-w-[90%] md:max-w-[85%] rounded-2xl px-5 py-3 text-sm shadow-sm ${
                msg.role === 'user'
                  ? 'bg-slate-800 text-white rounded-tr-none'
                  : 'bg-white border border-slate-100 rounded-tl-none'
              }`}
            >
               {msg.isError ? (
                 <span className="text-red-500 font-medium">错误: {msg.content}</span>
               ) : (
                 <>
                   <MessageContentRenderer content={msg.content} role={msg.role} />
                   {msg.role === 'model' && (
                     <CopyButton text={msg.content} />
                   )}
                 </>
               )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-3">
             <div className="w-8 h-8 rounded-full bg-jinwu-100 flex items-center justify-center mt-1">
                <Bot className="w-5 h-5 text-jinwu-700" />
             </div>
             <div className="bg-white border border-slate-100 px-5 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-jinwu-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-jinwu-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                <span className="w-2 h-2 bg-jinwu-600 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        
        {/* File Preview */}
        {inputFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {inputFiles.map((f, idx) => (
              <div key={idx} className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded text-xs text-slate-600">
                <span className="truncate max-w-[100px]">{f.name}</span>
                <button 
                  onClick={() => setInputFiles(prev => prev.filter((_, i) => i !== idx))}
                  className="hover:text-red-500"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 bg-white border border-slate-300 rounded-xl p-2 focus-within:ring-2 focus-within:ring-jinwu-200 focus-within:border-jinwu-400 transition-all shadow-sm">
          <button 
             onClick={() => fileInputRef.current?.click()}
             className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
             title="上传补充文件"
          >
            <Paperclip className="w-5 h-5" />
            <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
          </button>
          
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="对回答不满意？请结合上下文继续追问..."
            className="flex-1 max-h-32 bg-transparent border-none focus:ring-0 text-sm py-2 px-1 text-slate-900 placeholder:text-slate-400 resize-none scrollbar-hide"
            rows={1}
            style={{ minHeight: '40px' }}
          />
          
          <button
            onClick={handleSend}
            disabled={(!inputText.trim() && inputFiles.length === 0) || isLoading}
            className="p-2 bg-jinwu-500 text-white rounded-lg hover:bg-jinwu-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-center text-xs text-slate-400 mt-2">
          内容由 AI 生成，仅供参考，不作为最终法律依据。
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;