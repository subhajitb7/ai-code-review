import { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { SocketPubSubContext } from '../context/SocketPubSubContext';
import useSpeechToText from '../hooks/useSpeechToText';
import { 
  X, Send, User, Sparkles, MessageSquare, 
  Trash2, ListTodo, Plus, Info, Clock, CheckCircle2,
  Mic, MicOff
} from 'lucide-react';

const ProjectChatDrawer = ({ projectId, isOpen, onClose, initialMessages: messages = [], setInitialMessages: setMessages, typingUser }) => {
  const { user } = useContext(AuthContext);
  const { emitEvent: emit } = useContext(SocketPubSubContext);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { isListening, transcript, startListening, stopListening } = useSpeechToText();

  useEffect(() => {
    if (transcript) setText(transcript);
  }, [transcript]);

  const socketRoom = `project:${projectId}`;

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typingUser]);

  const handleTyping = () => {
    emit('typing', { roomId: socketRoom, userName: user.name });
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      emit('stopTyping', { roomId: socketRoom, userName: user.name });
    }, 2000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      await axios.post(`/api/projects/${projectId}/comments`, { text: text.trim() });
      setText('');
      emit('stopTyping', { roomId: socketRoom, userName: user.name });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-main border-l border-col shadow-2xl z-[150] flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-6 border-b border-col flex items-center justify-between bg-sec/30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-primary-500/10 rounded-xl flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-primary-500" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-main leading-tight">Project Chat</h3>
            <p className="text-[10px] text-sec font-black uppercase tracking-widest mt-1">Real-time Discussion</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-sec hover:text-main hover:bg-sec rounded-xl transition-all">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 scroll-smooth"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
             <div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full"></div>
             <p className="text-xs font-bold uppercase tracking-widest">Waking up the team...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 opacity-40">
            <Sparkles className="h-12 w-12 text-primary-500" />
            <div>
                 <p className="text-sm font-bold text-main">No discussion yet</p>
                 <p className="text-xs font-medium text-sec mt-1">Start the conversation below.</p>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isSystem = msg.text.startsWith('🚀') || msg.text.startsWith('🗑️') || msg.text.startsWith('🔄') || msg.text.startsWith('uploaded new') || msg.text.startsWith('bulk uploaded');
            const isMe = msg.user?._id === user._id;
            
            if (isSystem) {
              return (
                <div key={msg._id} className="flex justify-center">
                  <div className="bg-sec/50 border border-col py-1.5 px-4 rounded-full flex items-center gap-2 shadow-sm">
                    <Info className="h-3 w-3 text-primary-500" />
                    <span className="text-[10px] font-bold text-sec italic">{msg.text}</span>
                  </div>
                </div>
              );
            }

            return (
              <motion.div 
                key={msg._id || index}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full mt-2`}
              >
                <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%]`}>
                  {/* Name on Top */}
                  <span className="text-[9px] font-black uppercase tracking-widest text-sec mb-0.5 px-1 opacity-50">
                     {isMe ? 'You' : msg.user?.name || 'Unknown Node'}
                  </span>
                  
                  {/* Message Bubble */}
                  <div className={`relative px-4 py-2 rounded-2xl text-sm font-medium leading-relaxed transition-all duration-300 shadow-xl border ${
                    isMe 
                      ? `bg-primary-500/10 border-primary-500/20 text-main shadow-primary-500/5 rounded-tr-none` 
                      : `bg-ter/40 border-white/5 text-main/90 shadow-black/10 rounded-tl-none`
                  }`}>
                    <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                  </div>

                  {/* Time Below (Asymmetric Alignment) */}
                  <div className={`mt-0.5 px-1 flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[8px] font-mono font-bold text-sec/30 uppercase">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Footer Area */}
      <div className="p-3 border-t border-col bg-sec/30 backdrop-blur-md">
        {typingUser && (
          <div className="mb-3 px-2 flex items-center gap-2 animate-pulse">
            <div className="flex gap-1">
              <span className="w-1 h-1 bg-primary-500 rounded-full animate-bounce"></span>
              <span className="w-1 h-1 bg-primary-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1 h-1 bg-primary-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
            <p className="text-[10px] font-bold text-primary-600 italic">
              {typingUser} is typing...
            </p>
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="relative group">
          <div className="flex items-end gap-2 bg-main border border-col rounded-2xl p-2 focus-within:border-primary-500/50 transition-all shadow-inner">
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Type a message..."
              className="flex-1 bg-transparent px-3 py-2 text-sm font-medium outline-none transition-all resize-none min-h-[40px] max-h-[120px] custom-scrollbar"
              rows={1}
            />
            <div className="flex items-center gap-1.5 shrink-0 pb-0.5">
              <button
                 type="button"
                 onClick={isListening ? stopListening : startListening}
                 className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all ${
                   isListening ? 'bg-red-500 text-white animate-pulse' : 'text-sec hover:text-primary-500 hover:bg-sec'
                 }`}
                 title={isListening ? 'Stop Listening' : 'Voice Typing'}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              <button
                 type="submit"
                 disabled={!text.trim()}
                 className="h-9 w-9 bg-primary-500 text-white rounded-xl shadow-lg shadow-primary-500/20 flex items-center justify-center hover:bg-primary-600 transition-all disabled:opacity-50 active:scale-95"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectChatDrawer;
