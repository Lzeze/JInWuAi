import React, { useState } from 'react';
import { Chat, GenerateContentResponse } from '@google/genai';
import { GeminiService, fileToPart } from './services/geminiService';
import { AppMode, LitigationFormState, AssistantFormState, ChatMessage } from './types';
import TabNavigation from './components/TabNavigation';
import LitigationForm from './components/LitigationForm';
import AssistantForm from './components/AssistantForm';
import ChatInterface from './components/ChatInterface';
import { Bot } from 'lucide-react';

const App: React.FC = () => {
  const [activeMode, setActiveMode] = useState<AppMode>(AppMode.Litigation);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStartedChat, setHasStartedChat] = useState(false);

  // Initialize service
  // Note: We instantiate this once, but create new chats per session
  const geminiService = new GeminiService();

  const handleLitigationSubmit = async (data: LitigationFormState) => {
    await startChatSession(AppMode.Litigation, data, undefined);
  };

  const handleAssistantSubmit = async (data: AssistantFormState) => {
    await startChatSession(AppMode.Assistant, undefined, data);
  };

  const startChatSession = async (
    mode: AppMode,
    litData?: LitigationFormState,
    assistData?: AssistantFormState
  ) => {
    setIsLoading(true);
    setHasStartedChat(true);
    setMessages([]); // Clear previous messages if any (though UI reset handles this)

    try {
      // 1. Add user's initial input to the UI immediately
      const initialUserText = litData 
        ? `身份：${litData.role}\n描述：${litData.description}` 
        : `业务：${assistData?.serviceType}\n描述：${assistData?.description}`;
      
      const userMsgId = Date.now().toString();
      const userMsg: ChatMessage = {
        id: userMsgId,
        role: 'user',
        content: initialUserText,
        timestamp: Date.now(),
      };
      setMessages([userMsg]);

      // 2. Start Gemini Chat
      const { chat, initialResponseStream } = await geminiService.startChat(mode, litData, assistData);
      setChatSession(chat);

      // 3. Handle Streaming Response
      const modelMsgId = (Date.now() + 1).toString();
      let accumulatedText = "";

      // Add placeholder message
      setMessages(prev => [...prev, {
        id: modelMsgId,
        role: 'model',
        content: '',
        timestamp: Date.now()
      }]);

      for await (const chunk of initialResponseStream) {
        const text = (chunk as GenerateContentResponse).text;
        if (text) {
          accumulatedText += text;
          setMessages(prev => prev.map(msg => 
            msg.id === modelMsgId ? { ...msg, content: accumulatedText } : msg
          ));
        }
      }

    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: "抱歉，连接服务时出现错误，请稍后重试。",
        isError: true,
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowUpMessage = async (text: string, files: File[]) => {
    if (!chatSession) return;

    setIsLoading(true);
    
    // Add User Message
    const userMsgId = Date.now().toString();
    setMessages(prev => [...prev, {
      id: userMsgId,
      role: 'user',
      content: text + (files.length > 0 ? `\n[附带 ${files.length} 个文件]` : ''),
      timestamp: Date.now()
    }]);

    try {
        // Prepare content with files if any
        let messageContent: any = text;
        if (files.length > 0) {
            const fileParts = await Promise.all(files.map(f => fileToPart(f)));
            messageContent = [...fileParts, { text: text }];
        }

        const resultStream = await chatSession.sendMessageStream({ message: messageContent });
        
        // Add Model Message Placeholder
        const modelMsgId = (Date.now() + 1).toString();
        let accumulatedText = "";
        setMessages(prev => [...prev, {
            id: modelMsgId,
            role: 'model',
            content: '',
            timestamp: Date.now()
        }]);

        for await (const chunk of resultStream) {
            const chunkText = (chunk as GenerateContentResponse).text;
            if (chunkText) {
                accumulatedText += chunkText;
                setMessages(prev => prev.map(msg => 
                    msg.id === modelMsgId ? { ...msg, content: accumulatedText } : msg
                ));
            }
        }

    } catch (error) {
        console.error("Follow-up Error:", error);
        setMessages(prev => [...prev, {
            id: Date.now().toString(),
            role: 'model',
            content: "抱歉，处理您的回复时出现错误。",
            isError: true,
            timestamp: Date.now()
        }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleReset = () => {
    setChatSession(null);
    setMessages([]);
    setHasStartedChat(false);
    setIsLoading(false);
  };

  // --- Main Layout Render ---

  if (hasStartedChat) {
    return (
      <ChatInterface
        messages={messages}
        onSendMessage={handleFollowUpMessage}
        isLoading={isLoading}
        onReset={handleReset}
      />
    );
  }

  return (
    // Outer container handles full height and scrolling
    <div className="h-full w-full overflow-y-auto bg-gradient-to-br from-jinwu-50 to-slate-100">
      {/* Inner container ensures minimum height matches screen for centering, but expands if content is taller */}
      <div className="min-h-full w-full p-4 md:p-8 flex items-center justify-center">
        <div className="w-full max-w-2xl">
          
          {/* Branding Header */}
          <div className="text-center mb-8 animate-in fade-in zoom-in duration-700">
            <div className="w-20 h-20 bg-gradient-to-tr from-jinwu-500 to-jinwu-400 rounded-3xl mx-auto shadow-xl flex items-center justify-center mb-4 transform rotate-3">
              <Bot className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight mb-2">
              金乌法律 <span className="text-jinwu-600">Ai</span> 助手
            </h1>
            <p className="text-slate-500 text-sm md:text-base max-w-md mx-auto">
              您的专业智能法律顾问。基于先进AI大模型，提供精准的诉讼预判与企业法律服务。
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/60 p-6 md:p-8 border border-white">
            
            <TabNavigation activeMode={activeMode} onModeChange={setActiveMode} />

            {activeMode === AppMode.Litigation ? (
              <LitigationForm onSubmit={handleLitigationSubmit} isLoading={isLoading} />
            ) : (
              <AssistantForm onSubmit={handleAssistantSubmit} isLoading={isLoading} />
            )}

          </div>

          {/* Footer */}
          <footer className="text-center mt-8 text-xs text-slate-400 pb-4">
            <p>© 2024 金乌法律Ai. 数据安全加密传输，保护您的隐私。</p>
          </footer>

        </div>
      </div>
    </div>
  );
};

export default App;