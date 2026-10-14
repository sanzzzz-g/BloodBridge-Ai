import React from 'react';
import { History, ArrowRight } from 'lucide-react';
import { useData } from '../../context/DataContext';

interface ActivityFeedProps {
  onOpenAuditLogs: () => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ onOpenAuditLogs }) => {
  const { auditLogs } = useData();

  const getActionColor = (action: string) => {
    if (action.includes('ALLOCATED') || action.includes('APPROVED')) return 'bg-emerald-500';
    if (action.includes('REJECTED') || action.includes('QUARANTINED')) return 'bg-rose-500';
    if (action.includes('INTAKE') || action.includes('CREATED')) return 'bg-sky-500';
    return 'bg-slate-400';
  };

  const formatTimeAgo = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const mins = Math.floor(diffMs / (1000 * 60));
      if (mins < 1) return 'Just now';
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      return `${Math.floor(hours / 24)}d ago`;
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <History className="w-4 h-4" />
          </span>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Recent Transfusion Activity Trail
          </h4>
        </div>
        <button
          onClick={onOpenAuditLogs}
          className="text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
        >
          Full audit log
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-3">
        {auditLogs.slice(0, 5).map((log) => (
          <div key={log.id} className="flex items-start gap-3 text-xs">
            <div className="mt-1 flex items-center justify-center">
              <span className={`w-2 h-2 rounded-full ${getActionColor(log.action)}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 dark:text-white">
                  {log.action.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {formatTimeAgo(log.timestamp)}
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 mt-0.5">
                {log.details}
              </p>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Actor: <span className="font-medium text-slate-500 dark:text-slate-400">{log.actorName}</span> ({log.actorRole.replace(/_/g, ' ')})
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
