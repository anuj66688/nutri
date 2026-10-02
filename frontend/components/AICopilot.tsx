'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Plus,
  MessageSquare,
  Activity,
  Calendar,
  Flame,
  Dna,
  Loader2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { api } from '@/lib/api';
import { DashboardData, AIConversation, AIChatMessage } from '@/types';
import { formatDate } from '@/lib/utils';

interface AICopilotProps {
  dashboardData: DashboardData | null;
}

export const AICopilot: React.FC<AICopilotProps> = ({ dashboardData }) => {
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const list = await api.getConversations();
      setConversations(list);
      if (list.length > 0 && !activeConversationId) {
        selectConversation(list[0].id);
      }
    } catch (e) {
      console.warn("Notice: conversations load:", e);
    }
  };

  const selectConversation = async (convId: string) => {
    setActiveConversationId(convId);
    try {
      const msgList = await api.getConversationMessages(convId);
      setMessages(msgList.map((m) => ({ role: m.role, content: m.content })));
    } catch {
      setMessages([]);
    }
  };

  const handleStartNewConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
    setError(null);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim() || isLoading) return;

    const userMsg = text.trim();
    setInputValue('');
    setError(null);
    setMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await api.sendMessage(userMsg, activeConversationId || undefined);
      if (!activeConversationId) {
        setActiveConversationId(response.conversation_id);
        loadConversations();
      }
      setMessages((prev) => [...prev, { role: 'assistant', content: response.message }]);
    } catch (err: any) {
      setError(err.message || 'AI assistant is currently unreachable.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const quickQuestions = [
    'How much protein have I consumed today?',
    'Which foods are contributing most of my protein?',
    'What should I eat today?',
    'Explain my latest lab report.',
    'Analyze my current eating pattern.',
    'Show me my weight trend.'
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)] min-h-[600px]">
      {/* LEFT: Conversation History */}
      <div className="hidden lg:flex lg:col-span-3 flex-col bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800 p-4 overflow-hidden">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Consultations
          </span>
          <button
            onClick={handleStartNewConversation}
            className="p-1.5 rounded-xl text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
            title="Start new consultation"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto mt-3 space-y-1.5">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400">
              No previous consultations. Start a new conversation.
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={`w-full text-left p-3 rounded-2xl text-xs transition-colors flex items-start space-x-2.5 ${
                  activeConversationId === conv.id
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-semibold border border-emerald-200/60 dark:border-emerald-800/40'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 opacity-70" />
                <div className="truncate">
                  <span className="block truncate">{conv.title}</span>
                  <span className="text-[10px] text-slate-400 block font-normal">
                    {formatDate(conv.updated_at || conv.created_at)}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* CENTER: Main Chat UI */}
      <div className="lg:col-span-6 flex flex-col bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800 overflow-hidden shadow-xs">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Nutrition Intelligence Copilot
              </h2>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Context-aware • USDA & Lab Linked</span>
              </span>
            </div>
          </div>
        </div>

        {/* Message stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="py-8 text-center">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 flex items-center justify-center mb-3">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                How can I assist your nutrition today?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
                I analyze your actual logged foods, daily targets, and laboratory test reports. I never fabricate values or make unverified claims.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md mx-auto">
                {quickQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSendMessage(q)}
                    className="p-2.5 rounded-xl border border-slate-200/80 dark:border-zinc-800 text-left text-xs text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all cursor-pointer"
                  >
                    "{q}"
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start space-x-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-emerald-700 text-white rounded-tr-xs'
                    : 'bg-slate-100/80 dark:bg-zinc-800 text-slate-800 dark:text-slate-100 rounded-tl-xs whitespace-pre-wrap'
                }`}
              >
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-xl bg-slate-200 dark:bg-zinc-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center space-x-2 text-xs text-emerald-700 dark:text-emerald-400 p-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Analyzing your nutrition data...</span>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 text-amber-900 dark:text-amber-200 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input box */}
        <div className="p-4 border-t border-slate-100 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about your diet, nutrients, labs, or historical trends..."
              className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white disabled:opacity-40 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT: Real User Context Panel (Section 15 layout) */}
      <div className="hidden lg:flex lg:col-span-3 flex-col bg-white dark:bg-zinc-900 rounded-3xl border border-slate-200/80 dark:border-zinc-800 p-5 overflow-y-auto space-y-5">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Active Context Panel
          </span>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
            Current Profile & State
          </h3>
        </div>

        {/* Profile Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/60 dark:border-zinc-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Weight</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {dashboardData?.profile?.weight ? `${dashboardData.profile.weight} kg` : 'Not set'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Today's Calories</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {dashboardData?.consumed.calories.toLocaleString()} kcal
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Today's Protein</span>
            <span className="font-bold text-slate-900 dark:text-white">
              {dashboardData?.consumed.protein} g
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Daily Calorie Target</span>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              {dashboardData?.targets.estimated_calorie_target
                ? `${dashboardData.targets.estimated_calorie_target} kcal`
                : 'Calculated at onboarding'}
            </span>
          </div>
        </div>

        {/* Latest Lab Marker */}
        <div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
            Latest Lab Report
          </span>
          {dashboardData?.recent_labs && dashboardData.recent_labs.length > 0 ? (
            <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-xs space-y-1">
              <span className="font-semibold text-emerald-900 dark:text-emerald-300 block">
                {dashboardData.recent_labs[0].test_name}
              </span>
              <p className="font-bold text-slate-900 dark:text-white text-sm">
                {dashboardData.recent_labs[0].value} {dashboardData.recent_labs[0].unit}
              </p>
              <span className="text-[10px] text-slate-400 block">
                Recorded: {formatDate(dashboardData.recent_labs[0].test_date)}
              </span>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800 text-center text-xs text-slate-400">
              No lab reports uploaded yet.
            </div>
          )}
        </div>

        {/* AI System Constraints Notice */}
        <div className="mt-auto p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-800/30 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed border border-slate-200/50 dark:border-zinc-800">
          <strong className="text-slate-700 dark:text-slate-300 block mb-1">
            Clinical Safeguards Active:
          </strong>
          Responses are strictly grounded in your recorded data. No fabricated values or medical diagnoses.
        </div>
      </div>
    </div>
  );
};
