import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Trash2, Bot, User, ArrowRight, AlertCircle } from 'lucide-react';
import { sendAiChat } from '../../api/ai.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function AiAssistantPage() {
  const { company } = useAuth();
  const { t } = useLanguage();

  const suggestedPrompts = [
    { key: 'aiPromptSales', defaultText: 'How much did I earn this month?' },
    { key: 'aiPromptLowStock', defaultText: 'Which products are low in stock?' },
    { key: 'aiPromptUnpaid', defaultText: 'Do I have any unpaid invoices?' },
    { key: 'aiPromptDebt', defaultText: 'Who are my top customers with unpaid debt?' },
    { key: 'aiPromptTopSelling', defaultText: 'What are my top selling products?' },
    { key: 'aiPromptExpenses', defaultText: 'How do my expenses compare to sales this month?' },
  ];

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am your Modiri AI business advisor for **${company?.name || 'your business'}**.\n\nI have direct, read-only access to your real-time sales, inventory, and expense numbers from PostgreSQL. Ask me any question about your performance, stock levels, or finances!`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  async function handleSend(textToSend) {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    setError(null);
    setInput('');

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setIsLoading(true);

    // Prepare history for backend
    const history = nextMessages
      .filter((m) => m.id !== 'welcome')
      .map((m) => ({
        role: m.role,
        content: m.content,
      }));

    try {
      const data = await sendAiChat({
        message: text,
        history,
      });

      const reply = data?.reply || 'I received your request but have no response at this moment.';
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: reply,
        },
      ]);
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Unable to contact Modiri AI. Please ensure the backend AI service is online.';
      
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          content: `⚠️ **Notice:** ${errorMsg}`,
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function clearHistory() {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content: `Conversation cleared. How can I assist **${company?.name || 'your business'}** today?`,
      },
    ]);
  }

  return (
    <div className="flex h-[calc(100vh-80px)] flex-col gap-4">
      {/* Header Banner */}
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4 rounded-2xl border border-brand-violet/30 bg-gradient-to-r from-brand-violet/15 via-ink-800 to-brand-blue/10 p-4 shadow-panel">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-violet/20 text-brand-violet border border-brand-violet/40">
            <Sparkles size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              {t('aiAdvisorTitle', 'Modiri AI Business Advisor')}
              <span className="rounded-full bg-brand-violet/20 border border-brand-violet/30 px-2 py-0.5 text-[11px] font-semibold text-brand-violet">
                {t('aiLiveDataGrounded', 'Live Data Grounded')}
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              {t('aiAdvisorSubtitle', 'Deterministic PostgreSQL metrics interpreted by AI · Strict anti-hallucination guardrails')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={clearHistory}
          className="flex items-center gap-1.5 rounded-xl border border-line bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 transition"
        >
          <Trash2 size={13} />
          {t('aiClearChat', 'Clear Chat')}
        </button>
      </div>

      {/* Suggested Questions */}
      <div className="shrink-0 overflow-x-auto pb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium shrink-0 flex items-center gap-1">
            <Sparkles size={12} className="text-brand-violet" />
            {t('aiQuickQueries', 'Quick queries:')}
          </span>
          {suggestedPrompts.map((item) => {
            const promptText = t(item.key, item.defaultText);
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleSend(promptText)}
                disabled={isLoading}
                className="shrink-0 rounded-full border border-line bg-ink-800/80 px-3 py-1 text-xs text-slate-300 hover:border-brand-violet/50 hover:bg-brand-violet/10 hover:text-white transition disabled:opacity-50"
              >
                {promptText}
              </button>
            );
          })}
        </div>
      </div>

      {/* Chat Messages List */}
      <div className="flex-1 overflow-y-auto rounded-2xl border border-line bg-ink-900/60 p-4 backdrop-blur space-y-4 shadow-panel">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${
                  isUser
                    ? 'bg-brand-blue text-white'
                    : msg.isError
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-brand-violet text-white shadow-glow'
                }`}
              >
                {isUser ? <User size={16} /> : <Bot size={16} />}
              </div>

              <div
                className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                  isUser
                    ? 'bg-brand-gradient text-white shadow-md'
                    : msg.isError
                    ? 'border border-amber-500/30 bg-amber-500/10 text-amber-200'
                    : 'border border-line bg-ink-800/90 text-slate-200 shadow-panel'
                }`}
              >
                <div className="whitespace-pre-wrap font-sans">{msg.content}</div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-violet text-white">
              <Bot size={16} />
            </div>
            <div className="rounded-2xl border border-line bg-ink-800/90 p-4 text-slate-400 shadow-panel">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-brand-violet animate-bounce" />
                <span
                  className="h-2 w-2 rounded-full bg-brand-violet animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
                <span
                  className="h-2 w-2 rounded-full bg-brand-violet animate-bounce"
                  style={{ animationDelay: '0.4s' }}
                />
                <span className="ml-2 text-xs font-medium text-slate-400">
                  {t('aiThinking', 'Checking PostgreSQL metrics & formulating answer...')}
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="shrink-0 rounded-2xl border border-line bg-ink-900/90 p-2 shadow-panel backdrop-blur">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={t('aiAskPlaceholder', `Ask Modiri AI about sales, stock, expenses or customers in ${company?.name || 'your company'}...`)}
            className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-gradient text-white transition hover:opacity-95 disabled:opacity-40"
            aria-label={t('sendMessage')}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
