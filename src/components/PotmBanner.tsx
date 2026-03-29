import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import potmImage from '@/assets/potm-banner.png';

const POTM_DISMISSED_KEY = 'potm_banner_dismissed';

export function PotmBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem(POTM_DISMISSED_KEY);
    if (!dismissed) setShow(true);
  }, []);

  const dismiss = () => {
    setShow(false);
    sessionStorage.setItem(POTM_DISMISSED_KEY, '1');
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-md p-4"
          onClick={dismiss}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={e => e.stopPropagation()}
            className="relative max-w-3xl w-full"
          >
            <button
              onClick={dismiss}
              className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-card border border-border/50 flex items-center justify-center hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={potmImage}
              alt="POTM - Player Of The Month"
              className="w-full rounded-2xl shadow-2xl"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
