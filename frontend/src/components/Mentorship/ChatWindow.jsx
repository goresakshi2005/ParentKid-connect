import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import mentorshipService from '../../services/mentorshipService';

export default function ChatWindow({ assignment, onClose }) {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const isMentor = user?.id === assignment.mentor_detail?.user?.id;
    const otherName = isMentor
        ? `${assignment.user_detail?.first_name || ''} ${assignment.user_detail?.last_name || ''}`.trim()
        : `${assignment.mentor_detail?.user?.first_name || ''} ${assignment.mentor_detail?.user?.last_name || ''}`.trim();

    useEffect(() => {
        loadMessages();
        // Mark messages as read
        mentorshipService.markRead(assignment.id).catch(() => {});
        // Poll for new messages every 3 seconds
        const interval = setInterval(loadMessages, 3000);
        return () => clearInterval(interval);
    }, [assignment.id]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const loadMessages = async () => {
        try {
            const res = await mentorshipService.getChatHistory(assignment.id);
            setMessages(res.data);
            // Mark as read whenever we load
            mentorshipService.markRead(assignment.id).catch(() => {});
        } catch (err) {
            console.error('Failed to load messages:', err);
        } finally {
            setLoading(false);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            await mentorshipService.sendMessage(assignment.id, newMessage.trim());
            setNewMessage('');
            await loadMessages();
            inputRef.current?.focus();
        } catch (err) {
            console.error('Failed to send:', err);
        } finally {
            setSending(false);
        }
    };

    const formatTime = (ts) => {
        const d = new Date(ts);
        const now = new Date();
        const isToday = d.toDateString() === now.toDateString();
        if (isToday) {
            return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
            ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl dark:shadow-black/40 border dark:border-slate-800 flex flex-col overflow-hidden" style={{ height: '75vh' }}>
            {/* Chat Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 dark:from-pink-600 dark:to-purple-700 px-6 py-4 flex items-center gap-4 shrink-0">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-lg font-bold text-white">
                    {otherName.charAt(0)}
                </div>
                <div className="flex-1">
                    <h3 className="text-white font-bold">{otherName}</h3>
                    <p className="text-white/70 text-xs">
                        {isMentor ? 'Client' : assignment.mentor_detail?.specialization_display}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-white/70 text-xs">Online</span>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4" style={{ scrollbarWidth: 'thin' }}>
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin rounded-full h-8 w-8 border-3 border-pink-500 border-t-transparent"></div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="w-20 h-20 bg-blue-100 dark:bg-pink-500/10 rounded-full flex items-center justify-center text-4xl mb-4">
                            💬
                        </div>
                        <h4 className="text-lg font-bold dark:text-white mb-1">Start the Conversation</h4>
                        <p className="text-gray-400 dark:text-slate-500 text-sm max-w-xs">
                            Say hello to {otherName}! They're here to help and guide you.
                        </p>
                    </div>
                ) : (
                    <>
                        {messages.map((msg, idx) => {
                            const isMe = msg.sender === user?.id;
                            const showAvatar = idx === 0 || messages[idx - 1]?.sender !== msg.sender;
                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`flex gap-2 max-w-[75%] ${isMe ? 'flex-row-reverse' : ''}`}>
                                        {showAvatar && (
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                                isMe
                                                    ? 'bg-blue-600 dark:bg-pink-600 text-white'
                                                    : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300'
                                            }`}>
                                                {msg.sender_name?.charAt(0) || '?'}
                                            </div>
                                        )}
                                        {!showAvatar && <div className="w-8 shrink-0"></div>}
                                        <div>
                                            <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                                                isMe
                                                    ? 'bg-blue-600 dark:bg-pink-600 text-white rounded-br-md'
                                                    : 'bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-slate-200 rounded-bl-md'
                                            }`}>
                                                {msg.message}
                                            </div>
                                            <p className={`text-[10px] mt-1 text-gray-400 dark:text-slate-600 ${isMe ? 'text-right' : ''}`}>
                                                {formatTime(msg.timestamp)}
                                                {isMe && (
                                                    <span className="ml-1">
                                                        {msg.is_read ? '✓✓' : '✓'}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="px-6 py-4 border-t dark:border-slate-800 shrink-0">
                <div className="flex gap-3 items-end">
                    <div className="flex-1 relative">
                        <textarea
                            ref={inputRef}
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend(e);
                                }
                            }}
                            placeholder="Type a message..."
                            rows={1}
                            className="w-full px-4 py-3 rounded-xl border dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-pink-500 resize-none text-sm"
                            style={{ maxHeight: '120px' }}
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || sending}
                        className="px-6 py-3 bg-blue-600 dark:bg-pink-600 text-white rounded-xl font-medium hover:bg-blue-700 dark:hover:bg-pink-700 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
                    >
                        {sending ? (
                            <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                        ) : (
                            <>
                                Send
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
