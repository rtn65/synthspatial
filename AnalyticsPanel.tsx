import {useAtom} from 'jotai';
import {ActiveProjectHistoryAtom, IsAnalyticsPanelOpenAtom} from './atoms';
import {LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine} from 'recharts';
import {X} from 'lucide-react';

export function AnalyticsPanel() {
  const [isOpen, setIsOpen] = useAtom(IsAnalyticsPanelOpenAtom);
  const [history] = useAtom(ActiveProjectHistoryAtom);

  if (!isOpen) return null;

  // Filter history items that have a quality score
  const data = history
    .filter(item => item.qualityScore !== undefined)
    .map(item => ({
      timestamp: item.timestamp,
      time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      score: item.qualityScore,
      feedback: item.qualityFeedback
    }))
    .reverse(); // History is usually newest first, chart needs oldest first

  const averageScore = data.length > 0 
    ? Math.round(data.reduce((acc, curr) => acc + (curr.score || 0), 0) / data.length) 
    : 0;

  const latestScore = data.length > 0 ? data[data.length - 1].score : 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#1e1e1e] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Real-time quality monitoring</p>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto grow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
              <div className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total Generations</div>
              <div className="text-3xl font-black text-blue-700 dark:text-blue-300 mt-1">{data.length}</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800">
              <div className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wider">Average Quality</div>
              <div className="text-3xl font-black text-green-700 dark:text-green-300 mt-1">{averageScore}</div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
              <div className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Latest Score</div>
              <div className="text-3xl font-black text-purple-700 dark:text-purple-300 mt-1">{latestScore}</div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-800 h-[400px]">
            <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">Quality Trend</h3>
            {data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#9CA3AF" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#9CA3AF" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    domain={[0, 100]} 
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', borderRadius: '0.5rem', color: '#fff', fontSize: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <ReferenceLine y={85} stroke="#10B981" strokeDasharray="3 3" label={{ value: 'Target', position: 'right', fill: '#10B981', fontSize: 10 }} />
                  <Line 
                    type="monotone" 
                    dataKey="score" 
                    stroke="#8B5CF6" 
                    strokeWidth={3} 
                    dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }} 
                    activeDot={{ r: 6 }} 
                    animationDuration={500}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                No data available yet. Generate some images to see trends.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
