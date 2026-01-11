import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, ExternalLink, Sparkles, ShieldCheck, GraduationCap } from 'lucide-react';
import { geminiService } from '../services/geminiService';
import { Message } from '../types';

interface ChatAssistantProps {
  mode?: 'general' | 'advisor';
}

const ChatAssistant: React.FC<ChatAssistantProps> = ({ mode = 'general' }) => {
  const isAdvisor = mode === 'advisor';
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reset messages when mode changes
    const initialText = isAdvisor 
      ? 'أهلاً بك في قسم الإرشاد الأكاديمي. أنا هنا لمساعدتك في إجراءات القبول، اختيار التخصص، واللوائح الجامعية. كيف يمكنني توجيهك اليوم؟'
      : 'مرحباً بك في الإصدار Pro Ultra. اسألني عن أي موضوع طبي معقد أو بحث أكاديمي، وسأستخدم قدرات الاستدلال المتقدمة لمساعدتك.';
    
    setMessages([{
      role: 'model',
      text: initialText,
      timestamp: new Date()
    }]);
  }, [mode]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    const history = messages.map(msg => ({ role: msg.role, parts: [{ text: msg.text }] }));
    const result = await geminiService.chatPro(input, history, isAdvisor);
    
    const botMessage: Message = {
      role: 'model',
      text: result.text,
      timestamp: new Date(),
      groundingSources: result.sources
    };

    setMessages(prev => [...prev, botMessage]);
    setIsLoading(false);
  };

  return (
    <div className={`flex flex-col h-[calc(100vh-14rem)] glass rounded-3xl shadow-2xl border-2 relative overflow-hidden ${isAdvisor ? 'border-amber-100' : 'border-white'}`}>
      
      {/* Header Indicator */}
      {isAdvisor && (
        <div className="absolute top-0 left-0 w-full bg-amber-50/80 p-2 text-center z-10 border-b border-amber-100">
           <span className="text-xs font-bold text-amber-700 flex items-center justify-center gap-2">
             <GraduationCap size={14} /> وضع المستشار الأكاديمي
           </span>
        </div>
      )}

      {/* Chat Messages */}
      <div ref={scrollRef} className={`flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar ${isAdvisor ? 'pt-12' : ''}`}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'} gap-5 animate-in fade-in slide-in-from-bottom-2`}>
            <div className={`flex flex-col max-w-[85%] lg:max-w-[75%] ${msg.role === 'user' ? '' : 'items-end'}`}>
              <div className={`flex items-center gap-2 mb-2 ${msg.role === 'user' ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className={`p-2 rounded-xl ${msg.role === 'user' ? 'bg-emerald-100 text-emerald-600' : (isAdvisor ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600')}`}>
                   {msg.role === 'user' ? <User size={16} /> : (isAdvisor ? <GraduationCap size={16} /> : <Sparkles size={16} />)}
                </div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {msg.role === 'user' ? 'الطالب' : (isAdvisor ? 'المستشار الأكاديمي' : 'AI Nexus Pro')}
                </span>
              </div>
              
              <div className={`p-5 rounded-2xl text-[15px] leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-white border border-slate-100 text-slate-800 rounded-tr-none' 
                  : (isAdvisor ? 'bg-gradient-to-br from-amber-600 to-orange-600 text-white' : 'medical-gradient text-white') + ' rounded-tl-none font-medium'
              }`}>
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {msg.groundingSources && msg.groundingSources.length > 0 && (
                  <div className={`mt-5 pt-4 border-t ${msg.role === 'user' ? 'border-slate-100' : 'border-white/20'}`}>
                    <p className={`text-[10px] font-black uppercase mb-3 ${msg.role === 'user' ? 'text-slate-400' : 'text-white/70'}`}>المصادر:</p>
                    <div className="flex flex-wrap gap-2">
                      {msg.groundingSources.map((source, sIdx) => (
                        <a 
                          key={sIdx} href={source.uri} target="_blank" rel="noopener noreferrer"
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                            msg.role === 'user' 
                              ? 'bg-slate-50 text-slate-600 border border-slate-200' 
                              : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                          }`}
                        >
                          <ExternalLink size={10} />
                          {source.title ? source.title.substring(0, 30) + '...' : 'رابط مصدر'}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-end gap-4">
             <div className={`p-5 rounded-2xl rounded-tl-none shadow-lg ${isAdvisor ? 'bg-gradient-to-br from-amber-600 to-orange-600' : 'medical-gradient'}`}>
                <div className="flex gap-2">
                  <div className="w-2.5 h-2.5 bg-white rounded-full animate-bounce"></div>
                  <div className="w-2.5 h-2.5 bg-white rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2.5 h-2.5 bg-white rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="p-6 bg-white/50 backdrop-blur-xl border-t border-white/40">
        <div className="relative flex items-center group">
          <input
            type="text" value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isAdvisor ? "استفسر عن القبول، الرسوم، أو التخصصات..." : "اسأل عن أي موضوع طبي أو أكاديمي معقد..."}
            className={`w-full bg-white border-2 rounded-2xl px-6 py-5 pl-16 focus:outline-none transition-all text-sm shadow-xl ${isAdvisor ? 'border-amber-100 focus:border-amber-400' : 'border-slate-100 focus:border-emerald-500'}`}
          />
          <button 
            onClick={handleSend} disabled={isLoading || !input.trim()}
            className={`absolute left-3 p-3 text-white rounded-xl shadow-lg disabled:opacity-50 transition-all ${isAdvisor ? 'bg-amber-600 hover:shadow-amber-500/20' : 'medical-gradient hover:shadow-emerald-500/20'}`}
          >
            <Send size={22} className="transform rotate-180" />
          </button>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4">
           <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase">
              <ShieldCheck size={12} className="text-emerald-500" /> إجابات موثقة
           </div>
           <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase">
              <Sparkles size={12} className="text-blue-500" /> مدعوم بـ Gemini 3 Pro
           </div>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;
