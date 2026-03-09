import { useState, useEffect } from 'react';
import { AlertTriangle, X, Clock } from 'lucide-react';

export default function EmergencyAccessBanner({ accessLog, patientName, onRevokeAccess }) {
  const [timeRemaining, setTimeRemaining] = useState('');
  const [isExpiringSoon, setIsExpiringSoon] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const expiresAt = new Date(accessLog.accessExpiresAt);
      const diff = expiresAt - now;

      if (diff <= 0) {
        setTimeRemaining('EXPIRED');
        setIsExpiringSoon(true);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
      
      // Warning if less than 1 hour remaining
      setIsExpiringSoon(diff < 3600000);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [accessLog.accessExpiresAt]);

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 ${
      isExpiringSoon ? 'bg-red-700' : 'bg-red-600'
    } text-white shadow-lg animate-pulse`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Emergency Icon + Message */}
          <div className="flex items-center gap-3 flex-1">
            <AlertTriangle className="w-6 h-6 flex-shrink-0 animate-pulse" />
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2">
              <span className="font-bold text-lg">EMERGENCY ACCESS MODE</span>
              <span className="text-sm opacity-90">
                Patient: <strong>{patientName}</strong>
              </span>
            </div>
          </div>

          {/* Center: Time Remaining */}
          <div className="flex items-center gap-2 bg-white bg-opacity-20 px-4 py-2 rounded-lg">
            <Clock className="w-5 h-5" />
            <div className="text-center">
              <div className="text-xs opacity-90">Expires in</div>
              <div className={`font-mono font-bold ${
                isExpiringSoon ? 'text-yellow-300' : ''
              }`}>
                {timeRemaining}
              </div>
            </div>
          </div>

          {/* Right: Audit Trail + Revoke Button */}
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-sm opacity-90">
              <div>🔍 All actions logged</div>
              <div className="text-xs">Audit trail active</div>
            </div>
            <button
              onClick={onRevokeAccess}
              className="flex items-center gap-2 bg-white text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors font-medium"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Revoke Access</span>
            </button>
          </div>
        </div>

        {/* Mobile: Audit Trail Info */}
        <div className="md:hidden mt-2 text-xs opacity-90 text-center">
          🔍 All actions are being logged and audited
        </div>
      </div>
    </div>
  );
}
