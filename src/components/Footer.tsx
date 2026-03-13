import { Twitter, MessageCircle, ExternalLink } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-white/5 bg-[#0a0a0a]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">V</span>
            </div>
            <span className="text-white font-semibold">Valiant Affiliate Dashboard</span>
          </div>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a
              href="https://valiant.trade"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-white/60 hover:text-orange-400 transition-colors"
            >
              <ExternalLink size={16} />
              <span className="text-sm">Valiant Trade</span>
            </a>
            <a
              href="https://x.com/valianttrade"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-orange-400 hover:bg-white/10 transition-colors"
            >
              <Twitter size={18} />
            </a>
            <a
              href="https://t.me/valianttrade"
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-orange-400 hover:bg-white/10 transition-colors"
            >
              <MessageCircle size={18} />
            </a>
          </div>

          {/* Copyright */}
          <p className="text-sm text-white/40">
            &copy; 2026 Valiant. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
