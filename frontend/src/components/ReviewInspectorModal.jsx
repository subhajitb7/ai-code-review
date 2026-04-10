import { X, User, Calendar, Bug, History, FileCode, CheckCircle, ShieldAlert } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ReviewInspectorModal = ({ isOpen, onClose, review }) => {
  if (!isOpen || !review) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative glass-panel w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 fade-in duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-white/5 bg-white/2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-primary-500/20 rounded-2xl flex items-center justify-center border border-primary-500/30">
              <History className="h-6 w-6 text-primary-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-main leading-tight">{review.title}</h2>
              <p className="text-xs text-sec font-bold uppercase tracking-widest mt-1">Audit Mode — Review Inspector</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-xl transition-colors text-sec hover:text-main"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-grow overflow-y-auto custom-scrollbar p-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Metadata & Code */}
            <div className="lg:col-span-2 space-y-6">
              {/* Metadata Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/2 border border-white/5 p-4 rounded-2xl">
                   <div className="flex items-center gap-2 text-sec mb-2">
                     <User className="h-4 w-4" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Original Author</span>
                   </div>
                   <p className="text-sm font-bold text-main">{review.user?.name || 'Unknown'}</p>
                   <p className="text-[10px] text-sec truncate">{review.user?.email || 'N/A'}</p>
                </div>
                <div className="bg-white/2 border border-white/5 p-4 rounded-2xl">
                   <div className="flex items-center gap-2 text-sec mb-2">
                     <Calendar className="h-4 w-4" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Analysis Date</span>
                   </div>
                   <p className="text-sm font-bold text-main">{new Date(review.createdAt).toLocaleDateString()}</p>
                   <p className="text-[10px] text-sec">{new Date(review.createdAt).toLocaleTimeString()}</p>
                </div>
                <div className="bg-white/2 border border-white/5 p-4 rounded-2xl">
                   <div className="flex items-center gap-2 text-sec mb-2">
                     <FileCode className="h-4 w-4" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Stack / Lang</span>
                   </div>
                   <p className="text-sm font-bold text-main px-2 py-0.5 bg-primary-500/20 rounded-lg inline-block">{review.language || 'Plain Text'}</p>
                   <p className="text-[10px] text-sec mt-1">UTF-8 Encoded</p>
                </div>
              </div>

              {/* Code Snippet Container */}
              <div className="bg-[#0d1117] rounded-3xl overflow-hidden border border-white/5 shadow-inner">
                <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-rose-500/50"></div>
                    <div className="h-3 w-3 rounded-full bg-amber-500/50"></div>
                    <div className="h-3 w-3 rounded-full bg-emerald-500/50"></div>
                  </div>
                  <span className="text-[10px] font-bold text-sec uppercase tracking-widest">Security Audit View</span>
                </div>
                <div className="p-6 overflow-x-auto">
                  <pre className="text-sm font-mono leading-relaxed text-[#c9d1d9] selection:bg-primary-500/30">
                    <code>{review.codeSnippet}</code>
                  </pre>
                </div>
              </div>
            </div>

            {/* Right Column: AI Analysis */}
            <div className="space-y-6">
               <div className="glass-panel p-6 border-white/5 bg-primary-500/[0.02]">
                  <h3 className="text-sm font-black text-main uppercase tracking-widest mb-6 flex items-center gap-2">
                    <Bug className="h-4 w-4 text-primary-500" /> AI Findings
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                      <span className="text-xs font-bold text-sec">Vulnerability Count</span>
                      <span className={`text-xl font-black ${review.bugsFound > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {review.bugsFound}
                      </span>
                    </div>

                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="text-[10px] font-black text-sec uppercase tracking-widest mb-3">Intelligence Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {review.aiTags?.map((tag, i) => (
                          <span key={i} className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-sec">
                            {tag}
                          </span>
                        )) || <span className="text-[10px] text-sec/40 italic">No tags associated</span>}
                      </div>
                    </div>
                  </div>
               </div>

               <div className="glass-panel p-6 border-white/5 flex-grow">
                 <h3 className="text-sm font-black text-main uppercase tracking-widest mb-4 flex items-center gap-2">
                   <ShieldAlert className="h-4 w-4 text-primary-500" /> Full Analysis
                 </h3>
                 <div className="prose prose-invert prose-xs max-h-[400px] overflow-y-auto pr-4 custom-scrollbar-mini markdown-content">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {review.aiFeedback}
                    </ReactMarkdown>
                 </div>
               </div>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 bg-white/2 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-500" />
              <span className="text-[10px] font-bold text-sec uppercase tracking-widest">Platform Integrity Verified</span>
           </div>
           <button 
             onClick={onClose}
             className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-primary-500/20"
           >
             Close Inspector
           </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewInspectorModal;
