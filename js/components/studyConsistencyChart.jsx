import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

export function StudyConsistencyChartComponent({ initialSubject = 'All' }) {
  const [chartType, setChartType] = useState('stacked'); // 'stacked', 'grouped', 'area'
  const [activeSubject, setActiveSubject] = useState(initialSubject);
  const [unit, setUnit] = useState('hours'); // 'hours' or 'minutes'
  const [data, setData] = useState([]);

  useEffect(() => {
    if (window.PD && window.PD.Services && window.PD.Services.StudySession) {
      const rawData = window.PD.Services.StudySession.getWeeklyConsistencyData();
      setData(rawData);
    }
  }, []);

  const SUBJECT_COLORS = {
    Physics: '#3b82f6',   // Blue
    Chemistry: '#f59e0b', // Amber
    Maths: '#8b5cf6',     // Violet
    Target: '#ef4444'     // Red Goal
  };

  const formattedData = data.map(item => {
    const factor = unit === 'minutes' ? 60 : 1;
    return {
      ...item,
      Physics: Math.round(item.Physics * factor * 10) / 10,
      Chemistry: Math.round(item.Chemistry * factor * 10) / 10,
      Maths: Math.round(item.Maths * factor * 10) / 10,
      Total: Math.round(item.Total * factor * 10) / 10,
      Target: Math.round(item.Target * factor * 10) / 10
    };
  });

  const totalWeekly = formattedData.reduce((acc, curr) => acc + curr.Total, 0);
  const avgDaily = formattedData.length ? (totalWeekly / formattedData.length).toFixed(1) : 0;
  const unitSuffix = unit === 'minutes' ? 'mins' : 'hrs';

  const subjectTotals = { Physics: 0, Chemistry: 0, Maths: 0 };
  formattedData.forEach(d => {
    subjectTotals.Physics += d.Physics;
    subjectTotals.Chemistry += d.Chemistry;
    subjectTotals.Maths += d.Maths;
  });
  let topSubject = 'Physics';
  if (subjectTotals.Chemistry > subjectTotals[topSubject]) topSubject = 'Chemistry';
  if (subjectTotals.Maths > subjectTotals[topSubject]) topSubject = 'Maths';

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 border border-slate-700 text-white text-xs p-3 rounded-lg shadow-xl backdrop-blur-md">
          <p className="font-bold text-slate-200 mb-1 border-b border-slate-800 pb-1">{label}</p>
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center justify-between gap-4 py-0.5">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-semibold">{entry.value} {unitSuffix}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '20px' }}>📊</span>
            <h2 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', margin: 0 }}>
              Weekly Study Consistency
            </h2>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
            Subject-wise focus time distribution across the last 7 days
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Subject Filter Tabs */}
          <div style={{ display: 'inline-flex', borderRadius: '8px', background: 'var(--bg-tertiary)', padding: '3px', border: '1px solid var(--border-subtle)' }}>
            {['All', 'Physics', 'Chemistry', 'Maths'].map(sub => (
              <button
                key={sub}
                onClick={() => setActiveSubject(sub)}
                style={{
                  padding: '4px 10px',
                  fontSize: '12px',
                  fontWeight: '600',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: activeSubject === sub ? 'var(--accent-primary, #3b82f6)' : 'transparent',
                  color: activeSubject === sub ? '#ffffff' : 'var(--text-secondary)'
                }}
              >
                {sub}
              </button>
            ))}
          </div>

          {/* Chart View Mode */}
          <div style={{ display: 'inline-flex', borderRadius: '8px', background: 'var(--bg-tertiary)', padding: '3px', border: '1px solid var(--border-subtle)' }}>
            {[
              { id: 'stacked', label: 'Stacked' },
              { id: 'grouped', label: 'Grouped' },
              { id: 'area', label: 'Trend' }
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => setChartType(mode.id)}
                style={{
                  padding: '4px 8px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  background: chartType === mode.id ? '#334155' : 'transparent',
                  color: chartType === mode.id ? '#ffffff' : '#94a3b8',
                  fontWeight: chartType === mode.id ? '700' : '400'
                }}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {/* Unit Switcher */}
          <button
            onClick={() => setUnit(unit === 'hours' ? 'minutes' : 'hours')}
            style={{
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: '600',
              borderRadius: '8px',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer'
            }}
          >
            {unit === 'hours' ? 'Hrs' : 'Mins'}
          </button>
        </div>
      </div>

      <div style={{ width: '100%', height: '260px', margin: '8px 0' }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPhys" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={SUBJECT_COLORS.Physics} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={SUBJECT_COLORS.Physics} stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorChem" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={SUBJECT_COLORS.Chemistry} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={SUBJECT_COLORS.Chemistry} stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorMath" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={SUBJECT_COLORS.Maths} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={SUBJECT_COLORS.Maths} stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="dayLabel" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
              {(activeSubject === 'All' || activeSubject === 'Physics') && (
                <Area type="monotone" dataKey="Physics" stroke={SUBJECT_COLORS.Physics} fillOpacity={1} fill="url(#colorPhys)" />
              )}
              {(activeSubject === 'All' || activeSubject === 'Chemistry') && (
                <Area type="monotone" dataKey="Chemistry" stroke={SUBJECT_COLORS.Chemistry} fillOpacity={1} fill="url(#colorChem)" />
              )}
              {(activeSubject === 'All' || activeSubject === 'Maths') && (
                <Area type="monotone" dataKey="Maths" stroke={SUBJECT_COLORS.Maths} fillOpacity={1} fill="url(#colorMath)" />
              )}
            </AreaChart>
          ) : (
            <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
              <XAxis dataKey="dayLabel" stroke="var(--text-tertiary)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--text-tertiary)" fontSize={11} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--text-secondary)' }} />
              <ReferenceLine y={unit === 'hours' ? 4 : 240} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Target', fill: '#ef4444', fontSize: 10, position: 'top' }} />

              {(activeSubject === 'All' || activeSubject === 'Physics') && (
                <Bar
                  dataKey="Physics"
                  name="Physics"
                  fill={SUBJECT_COLORS.Physics}
                  stackId={chartType === 'stacked' && activeSubject === 'All' ? 'a' : undefined}
                  radius={chartType === 'grouped' || activeSubject !== 'All' ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              )}
              {(activeSubject === 'All' || activeSubject === 'Chemistry') && (
                <Bar
                  dataKey="Chemistry"
                  name="Chemistry"
                  fill={SUBJECT_COLORS.Chemistry}
                  stackId={chartType === 'stacked' && activeSubject === 'All' ? 'a' : undefined}
                  radius={chartType === 'grouped' || activeSubject !== 'All' ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                />
              )}
              {(activeSubject === 'All' || activeSubject === 'Maths') && (
                <Bar
                  dataKey="Maths"
                  name="Maths"
                  fill={SUBJECT_COLORS.Maths}
                  stackId={chartType === 'stacked' && activeSubject === 'All' ? 'a' : undefined}
                  radius={[4, 4, 0, 0]}
                />
              )}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ background: 'var(--bg-tertiary)', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Weekly Total</div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>{totalWeekly} {unitSuffix}</div>
        </div>
        <div style={{ background: 'var(--bg-tertiary)', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Daily Average</div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>{avgDaily} {unitSuffix}/day</div>
        </div>
        <div style={{ background: 'var(--bg-tertiary)', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Most Consistent</div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#60a5fa', marginTop: '2px' }}>{topSubject}</div>
        </div>
        <div style={{ background: 'var(--bg-tertiary)', padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '600' }}>Consistency Rate</div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#34d399', marginTop: '2px' }}>
            {Math.round((formattedData.filter(d => d.Total >= (unit === 'hours' ? 3.5 : 210)).length / 7) * 100)}%
          </div>
        </div>
      </div>
    </div>
  );
}

window.PD = window.PD || {};
window.PD.Components = window.PD.Components || {};

window.PD.Components.StudyConsistencyChart = {
  render: function (containerEl, options) {
    if (!containerEl) return;
    options = options || {};
    containerEl.innerHTML = '';
    const root = createRoot(containerEl);
    root.render(<StudyConsistencyChartComponent initialSubject={options.subject || 'All'} />);
  }
};
