import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Legend,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import {
  ArrowUpRight, BarChart3, ChartNoAxesCombined, CircleDollarSign,
  Database, Gauge, TrendingUp,
} from 'lucide-react';

const sampleData = [
  { month: 'Jan', revenue: 42, expenses: 27, profit: 15 },
  { month: 'Feb', revenue: 48, expenses: 29, profit: 19 },
  { month: 'Mar', revenue: 45, expenses: 28, profit: 17 },
  { month: 'Apr', revenue: 56, expenses: 32, profit: 24 },
  { month: 'May', revenue: 61, expenses: 35, profit: 26 },
  { month: 'Jun', revenue: 68, expenses: 38, profit: 30 },
  { month: 'Jul', revenue: 65, expenses: 37, profit: 28 },
  { month: 'Aug', revenue: 76, expenses: 41, profit: 35 },
];

const chartOptions = [
  { key: 'revenue', label: 'Revenue', color: '#087eae' },
  { key: 'expenses', label: 'Expenses', color: '#d6b66d' },
  { key: 'profit', label: 'Profit', color: '#16a6a1' },
];

const metrics = [
  { label: 'Total revenue', value: '₹76.0L', change: '+12.8%', icon: CircleDollarSign },
  { label: 'Operating margin', value: '46.1%', change: '+3.4 pts', icon: Gauge },
  { label: 'Data sources', value: '08', change: 'Connected', icon: Database },
];

export default function AnalyticsShowcase() {
  const [metric, setMetric] = useState('revenue');
  const activeOption = chartOptions.find((item) => item.key === metric);
  const total = useMemo(
    () => sampleData.reduce((sum, row) => sum + row[metric], 0),
    [metric],
  );

  return (
    <section className="analytics-demo" aria-labelledby="analytics-demo-title">
      <div className="container">
        <motion.div
          className="analytics-demo-heading"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.55 }}
        >
          <div>
            <div className="kicker">A view of what better reporting can look like</div>
            <h2 id="analytics-demo-title">From raw numbers to a clearer business picture.</h2>
            <p>Explore this illustrative dashboard preview. Real client dashboards are designed around your own data, KPIs and reporting requirements.</p>
          </div>
          <div className="analytics-demo-mark"><ChartNoAxesCombined size={22} /> BI DASHBOARD PREVIEW</div>
        </motion.div>

        <motion.div
          className="analytics-dashboard"
          initial={{ opacity: 0, y: 26, scale: 0.985 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.65, delay: 0.08 }}
        >
          <div className="analytics-dashboard-top">
            <div>
              <span className="dashboard-overline">BUSINESS PERFORMANCE</span>
              <h3>Executive overview</h3>
              <p>Illustrative data · January–August</p>
            </div>
            <span className="dashboard-status"><span /> Sample report</span>
          </div>

          <div className="analytics-metrics">
            {metrics.map(({ label, value, change, icon: Icon }) => (
              <article className="analytics-metric" key={label}>
                <div className="analytics-metric-icon"><Icon size={18} /></div>
                <span>{label}</span>
                <strong>{value}</strong>
                <small><TrendingUp size={13} /> {change}</small>
              </article>
            ))}
          </div>

          <div className="analytics-chart-panel">
            <div className="analytics-chart-heading">
              <div>
                <h4>Performance trend</h4>
                <p>Monthly values · ₹ lakh</p>
              </div>
              <div className="analytics-tabs" role="group" aria-label="Choose chart metric">
                {chartOptions.map((option) => (
                  <button
                    type="button"
                    key={option.key}
                    className={metric === option.key ? 'active' : ''}
                    onClick={() => setMetric(option.key)}
                    aria-pressed={metric === option.key}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="analytics-chart-summary">
              <strong>₹{total}L</strong>
              <span>Combined {activeOption.label.toLowerCase()} across sample period</span>
              <ArrowUpRight size={17} />
            </div>
            <div className="analytics-chart" role="img" aria-label={`Illustrative monthly ${activeOption.label.toLowerCase()} chart`}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sampleData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="accentraChartFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={activeOption.color} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={activeOption.color} stopOpacity={0.015} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e8eef4" strokeDasharray="3 4" vertical={false} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#718196', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#718196', fontSize: 11 }} />
                  <Tooltip formatter={(value) => [`₹${value}L`, activeOption.label]} contentStyle={{ borderRadius: 10, border: '1px solid #dce5ee', boxShadow: '0 8px 24px rgba(16,43,78,.1)' }} />
                  <Area type="monotone" dataKey={metric} stroke={activeOption.color} strokeWidth={3} fill="url(#accentraChartFill)" activeDot={{ r: 5, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="analytics-dashboard-foot">
            <span><BarChart3 size={15} /> Interactive sample visualisation</span>
            <span>Illustrative figures only — not client results</span>
          </div>
        </motion.div>
        <div className="analytics-demo-note"><Database size={16} /> Connect data from Excel, SQL, accounting systems and other business tools to build a reporting view that fits your organisation.</div>
      </div>
    </section>
  );
}
