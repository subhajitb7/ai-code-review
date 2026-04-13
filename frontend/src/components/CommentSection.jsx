import { useContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Trash2, User, CheckSquare, Square, Pencil, Check, X, ListTodo, Mic, MicOff, Activity } from 'lucide-react';
import useSpeechToText from '../hooks/useSpeechToText';
import { AuthContext } from '../context/AuthContext';
import { SocketPubSubContext } from '../context/SocketPubSubContext';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmModal from './ConfirmModal';

const CommentSection = ({
  reviewId,
  projectId,
  title = "Discussion",
  placeholder,
  emptyMessage,
  isNotes = false,
  userRole = 'member' // Pass role for admin powers
}) => {
  const { user } = useContext(AuthContext);
  const { subscribe } = useContext(SocketPubSubContext);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const scrollRef = useRef(null);
  const { isListening, transcript, startListening, stopListening } = useSpeechToText();

  // Deletion State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);

  useEffect(() => {
    if (transcript) setText(transcript);
  }, [transcript]);

  const contextId = reviewId || projectId;
  const contextType = reviewId ? 'reviews' : 'projects';
  const socketRoom = reviewId ? `review:${reviewId}` : `project:${projectId}`;

  const fetchComments = async () => {
    try {
      const { data } = await axios.get(`/api/${contextType}/${contextId}/comments`);
      setComments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!contextId) return;
    fetchComments();

    console.info(`[TELEMETRY] Subscribing to node: ${socketRoom}`);
    const unsubscribe = subscribe(socketRoom, (event) => {
      const { type, data } = event;
      if (type === 'NEW_MESSAGE') {
        setComments((prev) => {
          if (prev.find(c => c._id === data._id)) return prev;
          console.log(`[TELEMETRY] NEW_MESSAGE pulse received for ${data._id}`);
          return [...prev, data];
        });
      } else if (type === 'UPDATE_MESSAGE') {
        console.log(`[TELEMETRY] UPDATE_MESSAGE pulse received for ${data._id}`);
        setComments((prev) => prev.map(c => c._id === data._id ? data : c));
      }
    });

    return () => {
      console.info(`[TELEMETRY] Unsubscribing from node: ${socketRoom}`);
      unsubscribe();
    };
  }, [contextId, socketRoom, subscribe]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      const { data } = await axios.post(`/api/${contextType}/${contextId}/comments`, {
        text: text.trim(),
      });
      setComments(prev => {
        if (prev.find(c => c._id === data._id)) return prev;
        return [...prev, data];
      });
      setText('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  const startEditing = (comment) => {
    setEditingId(comment._id);
    setEditText(comment.text);
  };

  const handleUpdate = async (commentId) => {
    if (!editText.trim()) return;
    try {
      await axios.put(`/api/comments/${commentId}`, { text: editText });
      setEditingId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTrigger = (commentId) => {
    setCommentToDelete(commentId);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!commentToDelete) return;
    try {
      await axios.delete(`/api/comments/${commentToDelete}`);
      fetchComments();
      setCommentToDelete(null);
    } catch (err) {
      console.error(err);
    }
  };

  // Auto-scroll to bottom on new comments
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [comments, loading]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* List - Tactical Comms Log */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 space-y-2 mb-6 overflow-y-auto pr-3 custom-scrollbar scroll-smooth relative"
      >
        {/* Signal Path Decoration */}
        <div className="absolute left-[11px] top-0 bottom-0 w-[1px] bg-gradient-to-b from-emerald-500/50 via-col/30 to-transparent pointer-events-none"></div>

        {loading ? (
          <div className="flex items-center gap-3 py-6 px-4">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            <p className="text-[10px] font-black text-sec uppercase tracking-[0.2em] italic">Decrypting incoming packets...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-30">
            <Activity className="h-8 w-8 text-sec mb-4" />
            <p className="text-[10px] font-black text-sec uppercase tracking-widest text-center leading-relaxed">
              {emptyMessage || (isNotes ? "Primary Archive Empty\nAwait manual transmission" : "Secure Channel Open\nNo traffic detected")}
            </p>
          </div>
        ) : (
          <div className="relative">
            {comments.map((comment, idx) => (
              <motion.div
                key={comment._id}
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.05 }}
                className={`group relative pl-8 py-1.5 transition-all hover:bg-emerald-500/5 rounded-r-xl border-l-2 border-transparent hover:border-emerald-500/20`}
              >
                {/* Visual Anchor Dot */}
                <div className="absolute left-[7.5px] top-5 h-2 w-2 rounded-full bg-ter border border-col group-hover:border-emerald-500/50 group-hover:bg-emerald-500/20 transition-all z-10">
                   <div className="h-full w-full rounded-full bg-emerald-500 scale-0 group-hover:scale-50 transition-transform"></div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex flex-col mb-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] font-mono text-emerald-500/50 font-medium whitespace-nowrap">
                          {comment.createdAt ? `[${new Date(comment.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }).replace(/\//g, '.')} | ${new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}]` : '[LOG_PENDING]'}
                        </span>
                        <span className="font-black text-[10px] uppercase tracking-[0.2em] text-emerald-500 group-hover:text-emerald-400 transition-colors truncate">
                          {comment.user?.name || 'Unknown_Node'}
                        </span>
                      </div>
                    </div>

                  {/* Content */}
                  <div className="relative pr-4">
                     <p className="text-[12px] leading-relaxed text-sec font-medium group-hover:text-main transition-colors break-words overflow-hidden">
                      {comment.text}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Input - High-Density Command Bar (Side-by-Side) */}
      <form onSubmit={handleSubmit} className="relative mt-4 group">
        <div className="glass-panel border-col/20 bg-ter/30 group-focus-within:border-emerald-500/30 transition-all rounded-xl p-1.5 flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
              }}
              placeholder="Transmit message..."
              className="w-full bg-transparent border-none outline-none text-[12.5px] font-medium resize-none py-1.5 px-3 text-main placeholder:text-sec/20 custom-scrollbar min-h-[36px] transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                  e.target.style.height = '36px';
                }
              }}
            />
          </div>

          <div className="flex items-center gap-1.5 mb-1 mr-1">
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`h-8 w-8 flex items-center justify-center rounded-lg transition-all ${isListening
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                : 'text-sec hover:text-emerald-500 hover:bg-emerald-500/10'
              }`}
            >
              {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-4 w-4" />}
            </button>

            <button
              type="submit"
              disabled={!text.trim()}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-10 text-white transition-all active:scale-90 shadow-lg shadow-emerald-500/10"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        
        {/* Minimalist Status Dot */}
        <div className="absolute -top-3 left-3 flex items-center gap-1.5 opacity-0 group-focus-within:opacity-100 transition-opacity">
           <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse"></div>
           <span className="text-[7px] font-black uppercase tracking-widest text-emerald-500/60 font-mono">Channel Encrypted</span>
        </div>
      </form>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Purge Communication?"
        message="This will permanently delete the selected packet from the tactical record."
      />
    </div>
  );
};

export default CommentSection;
