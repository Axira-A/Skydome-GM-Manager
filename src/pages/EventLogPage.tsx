import { useGameStore } from '../store/gameStore';
import { Clock, Sword, Info, AlertCircle, Package } from 'lucide-react';
import { translations } from '../i18n/translations';

export default function EventLogPage() {
  const { logs, language } = useGameStore();
  const t = translations[language || 'en'];

  const getIcon = (type: string) => {
    switch (type) {
      case 'Combat': return <Sword size={16} className="text-red-400" />;
      case 'System': return <Info size={16} className="text-blue-400" />;
      case 'Event': return <AlertCircle size={16} className="text-yellow-400" />;
      case 'Loot': return <Package size={16} className="text-green-400" />;
      default: return <Info size={16} />;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white flex items-center gap-2">
        <Clock /> {t.logs.title}
      </h2>

      <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">{t.logs.noEvents}</div>
        ) : (
          <div className="divide-y divide-gray-800">
            {logs.map(log => (
              <div key={log.id} className="p-4 hover:bg-gray-800 transition flex gap-4">
                <div className="mt-1 opacity-70">
                  {getIcon(log.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-sm font-bold ${
                      log.type === 'Combat' ? 'text-red-400' : 
                      log.type === 'Loot' ? 'text-green-400' : 'text-gray-300'
                    }`}>{log.type}</span>
                    <span className="text-xs text-gray-500 font-mono">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-gray-300 text-sm leading-relaxed">{log.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
