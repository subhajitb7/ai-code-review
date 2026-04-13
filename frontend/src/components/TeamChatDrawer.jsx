import { useState, useEffect, useRef, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { SocketPubSubContext } from '../context/SocketPubSubContext';
import useSpeechToText from '../hooks/useSpeechToText';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Send, User, Sparkles, MessageSquare, 
  Mic, MicOff
} from 'lucide-react';


const TeamChatDrawer = ({ teamId, isOpen, onClose }) => {
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketPubSubContext);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState(null);
  const scrollRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const { isListening, transcript, startListening, stopListening } = useSpeechToText();

  useEffect(() => {
    if (transcript) setText(transcript);
  }, [transcript]);

  const socketRoom = `team:${teamId}`;

  const fetchMessages = async () => {
    try {
      const { data } = await axios.get(`/api/messages/${teamId}`);
      setMessages(data);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !teamId) return;
    
    fetchMessages();

    if (socket) {
      socket.emit('joinRoom', socketRoom);

      const handleNewMessage = (newMessage) => {
        setMessages((prev) => {
          if (prev.find(m => m._id === newMessage._id)) return prev;
          return [...prev, newMessage];
        });
      };

      const handleTyping = ({ userName }) => {
        if (userName !== user?.name) setTypingUser(userName);
      };

      const handleStopTyping = () => {
        setTypingUser(null);
      };

      socket.on('newTeamMessage', handleNewMessage);
      socket.on('userTyping', handleTyping);
      socket.on('userStopTyping', handleStopTyping);

      return () => {
        socket.emit('leaveRoom', socketRoom);
        socket.off('newTeamMessage', handleNewMessage);
        socket.off('userTyping', handleTyping);
        socket.off('userStopTyping', handleStopTyping);
      };
    }
  }, [teamId, socket, socketRoom, isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUser, isOpen]);

  const handleTypingEvent = () => {
    if (!user || !socket) return;
    socket.emit('typing', { roomId: socketRoom, userName: user.name });
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stopTyping', { roomId: socketRoom, userName: user.name });
    }, 2000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      const { data } = await axios.post(`/api/messages/${teamId}`, { text: text.trim() });
      setMessages(prev => {
        if (prev.find(m => m._id === data._id)) return prev;
        return [...prev, data];
      });
      setText('');
      if (socket) socket.emit('stopTyping', { roomId: socketRoom, userName: user.name });
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-main/98 backdrop-blur-3xl border-l border-col shadow-[0_0_80px_rgba(0,0,0,0.4)] z-[200] flex flex-col animate-in slide-in-from-right duration-500 overflow-hidden">
      
      {/* Refined Minimalist Header */}
      <div className="px-8 py-6 border-b border-col flex items-center justify-between bg-sec/10">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-sec border border-col rounded-xl flex items-center justify-center shadow-sm">
            <MessageSquare className="h-5 w-5 text-primary-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-main tracking-widest uppercase">Sync_Chat</h3>
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded">
                 <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
              </div>
            </div>
            <p className="text-[9px] text-sec font-bold uppercase tracking-[0.2em] opacity-30 mt-0.5">Communication Cluster</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 text-sec hover:text-main hover:bg-sec/50 rounded-lg transition-all">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Message Stream with Logic-Based Grouping */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-2 scroll-smooth custom-scrollbar"
      >
        <AnimatePresence mode="popLayout">
          {messages.length === 0 && !loading ? (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="flex flex-col items-center justify-center h-full text-center gap-3 opacity-20 grayscale"
            >
              <Sparkles className="h-8 w-8 text-sec" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">Awaiting Uplink...</p>
            </motion.div>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.user?._id === user?._id;
              
              const msgDate = new Date(msg.createdAt).toDateString();
              const prevMsg = messages[index - 1];
              const prevMsgDate = prevMsg ? new Date(prevMsg.createdAt).toDateString() : null;
              const showDateDivider = msgDate !== prevMsgDate;

              return (
                <div key={msg._id || index} className="flex flex-col">
                  {showDateDivider && (
                    <div className="flex items-center gap-4 py-3 opacity-20">
                      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-col"></div>
                      <span className="text-[10px] font-black uppercase tracking-[0.4em] whitespace-nowrap font-mono">
                        {new Date(msg.createdAt).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}
                      </span>
                      <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-col"></div>
                    </div>
                  )}

                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} w-full mt-2`}
                  >
                    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} max-w-[85%]`}>
                      {/* Name on Top */}
                      <span className="text-[10px] font-black uppercase tracking-widest text-sec mb-1 px-1 opacity-60">
                         {isMe ? 'You' : msg.user?.name || 'Unknown Node'}
                      </span>
                      
                      {/* Message Bubble */}
                      <div className={`group relative px-4 py-2 rounded-2xl text-[13px] font-medium leading-relaxed transition-all duration-300 shadow-xl border ${
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
                </div>
              );
            })
          )}
        </AnimatePresence>

        {typingUser && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-11 flex items-center gap-2 mt-4"
          >
            <div className="flex gap-1">
              <span className="w-1 h-1 bg-primary-500 rounded-full animate-bounce"></span>
              <span className="w-1 h-1 bg-primary-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-1 h-1 bg-primary-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
            </div>
            <p className="text-[8px] font-black text-primary-500/60 uppercase tracking-widest italic">
              {typingUser.split(' ')[0]} transmitting...
            </p>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Refined Compact Floating Input Console */}
      <div className="p-4 bg-ter/5 pb-4">
        <form onSubmit={handleSendMessage} className="relative group">
          <div className="glass-panel rounded-2xl border-col/30 focus-within:border-primary-500/40 transition-all bg-main/40 overflow-hidden shadow-2xl flex items-end p-2 gap-2">
             <textarea
               value={text}
               onChange={(e) => {
                 setText(e.target.value);
                 handleTypingEvent();
               }}
               onKeyDown={(e) => {
                 if (e.key === 'Enter' && !e.shiftKey) {
                   e.preventDefault();
                   handleSendMessage(e);
                 }
               }}
               placeholder="Write a message..."
               className="flex-1 bg-transparent px-3 py-2.5 text-sm font-medium outline-none transition-all resize-none min-h-[44px] max-h-[120px] custom-scrollbar"
               rows={1}
             />
             
             <div className="flex items-center gap-1.5 shrink-0 pb-0.5">
               <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all ${
                    isListening 
                      ? 'bg-rose-500 text-white animate-pulse' 
                      : 'text-sec hover:text-primary-500 hover:bg-sec/50'
                  }`}
                  title="Voice Command"
               >
                 {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
               </button>
               <button
                  type="submit"
                  disabled={!text.trim()}
                  className="h-9 w-9 bg-primary-500 text-white rounded-xl shadow-lg shadow-primary-500/20 flex items-center justify-center hover:bg-primary-600 transition-all disabled:opacity-30 disabled:grayscale active:scale-95"
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

export default TeamChatDrawer;
