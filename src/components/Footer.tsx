import { Twitter, MessageCircle, ExternalLink } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-white/[0.04] bg-[#060608]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/valbot-logo.png" alt="ValBot" className="w-7 h-7 rounded-lg" />
            <div className="flex items-baseline gap-0.5">
              <span className="text-white font-bold text-sm">Val</span>
              <span className="text-emerald-400 font-bold text-sm">Bot</span>
            </div>
            <span className="text-white/20 text-xs ml-1">Delta-Neutral Engine</span>
          </div>

          <div className="flex items-center gap-3">
            <a href="https://valiant.trade/trade?af=valbot" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-white/40 hover:text-emerald-400 transition-colors text-xs">
              <ExternalLink size={13} />
              valiant.trade (20% off)
            </a>
            <div className="w-px h-4 bg-white/10" />
            <a href="https://x.com/valianttrade" target="_blank" rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all">
              <Twitter size={14} />
            </a>
            <a href="https://t.me/valianttrade" target="_blank" rel="noopener noreferrer"
              className="w-8 h-8 rounded-lg bg-white/[0.03] flex items-center justify-center text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all">
              <MessageCircle size={14} />
            </a>
          </div>

          <p className="text-[11px] text-white/20">
            &copy; 2025 ValBot
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
