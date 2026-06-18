import { useMemo } from 'react';
import type { Session } from '../../shared/types';

interface ComparisonChartProps {
  sessions: Session[];  // 같은 종목, 시간순 정렬
}

export function ComparisonChart({ sessions }: ComparisonChartProps) {
  // 카테고리별 데이터 추출
  const chartData = useMemo(() => {
    if (sessions.length === 0) return null;

    // 모든 세션에서 카테고리 이름 수집 (첫 세션 기준)
    const categoryNames = sessions[0].result.categories.map(c => c.name);

    // 카테고리별 점수 배열
    const series: { name: string; scores: number[]; color: string }[] = categoryNames.map((name, i) => ({
      name,
      scores: sessions.map(s => {
        const cat = s.result.categories.find(c => c.name === name);
        return cat?.score ?? 0;
      }),
      color: COLORS[i % COLORS.length],
    }));

    // 평균 점수 시리즈
    const avgSeries = {
      name: '평균',
      scores: sessions.map(s => {
        const sum = s.result.categories.reduce((acc, c) => acc + c.score, 0);
        return sum / s.result.categories.length;
      }),
      color: '#00d4ff',
    };

    return {
      labels: sessions.map(s => {
        const date = new Date(s.createdAt);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }),
      series: [...series, avgSeries],
      sessions,
    };
  }, [sessions]);

  if (!chartData || sessions.length < 2) {
    return (
      <div className="text-center py-8 text-[var(--descent-text-dim)]">
        <p>비교하려면 최소 2회 이상의 분석 기록이 필요합니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 차트 */}
      <div className="bg-[var(--descent-card)] border border-[var(--descent-border)] rounded-xl p-4">
        <LineChart data={chartData} />
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap gap-3 justify-center">
        {chartData.series.map((s) => (
          <div key={s.name} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-[var(--descent-text-dim)]">{s.name}</span>
          </div>
        ))}
      </div>

      {/* 변화 요약 */}
      <ChangesSummary sessions={sessions} />
    </div>
  );
}

const COLORS = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#f38181', '#aa96da'];

interface LineChartProps {
  data: {
    labels: string[];
    series: { name: string; scores: number[]; color: string }[];
  };
}

function LineChart({ data }: LineChartProps) {
  const width = 100;
  const height = 50;
  const padding = { top: 5, right: 5, bottom: 8, left: 8 };

  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const xScale = (i: number) => padding.left + (i / (data.labels.length - 1)) * innerWidth;
  const yScale = (score: number) => padding.top + innerHeight - ((score - 1) / 4) * innerHeight;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-48"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* 그리드 라인 */}
      {[1, 2, 3, 4, 5].map((score) => (
        <g key={score}>
          <line
            x1={padding.left}
            y1={yScale(score)}
            x2={width - padding.right}
            y2={yScale(score)}
            stroke="var(--descent-border)"
            strokeWidth="0.2"
            strokeDasharray="1,1"
          />
          <text
            x={padding.left - 1}
            y={yScale(score)}
            fontSize="2.5"
            fill="var(--descent-text-dim)"
            textAnchor="end"
            dominantBaseline="middle"
          >
            {score}
          </text>
        </g>
      ))}

      {/* X축 라벨 */}
      {data.labels.map((label, i) => (
        <text
          key={i}
          x={xScale(i)}
          y={height - 1}
          fontSize="2.5"
          fill="var(--descent-text-dim)"
          textAnchor="middle"
        >
          {label}
        </text>
      ))}

      {/* 데이터 라인 */}
      {data.series.map((series) => {
        const pathD = series.scores
          .map((score, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(score)}`)
          .join(' ');

        return (
          <g key={series.name}>
            {/* 라인 */}
            <path
              d={pathD}
              fill="none"
              stroke={series.color}
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* 포인트 */}
            {series.scores.map((score, i) => (
              <circle
                key={i}
                cx={xScale(i)}
                cy={yScale(score)}
                r="1"
                fill={series.color}
              />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

interface ChangesSummaryProps {
  sessions: Session[];
}

function ChangesSummary({ sessions }: ChangesSummaryProps) {
  if (sessions.length < 2) return null;

  const first = sessions[0];
  const last = sessions[sessions.length - 1];

  const changes = first.result.categories.map((firstCat) => {
    const lastCat = last.result.categories.find(c => c.name === firstCat.name);
    const change = lastCat ? lastCat.score - firstCat.score : 0;
    return {
      name: firstCat.name,
      first: firstCat.score,
      last: lastCat?.score ?? 0,
      change,
    };
  });

  const avgFirst = first.result.categories.reduce((sum, c) => sum + c.score, 0) / first.result.categories.length;
  const avgLast = last.result.categories.reduce((sum, c) => sum + c.score, 0) / last.result.categories.length;
  const avgChange = avgLast - avgFirst;

  return (
    <div className="bg-[var(--descent-card)] border border-[var(--descent-border)] rounded-xl p-4">
      <h4 className="text-sm font-medium text-[var(--descent-text)] mb-3">
        변화 요약 ({sessions.length}회 분석)
      </h4>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {changes.map((item) => (
          <div key={item.name} className="text-center">
            <span className="text-xs text-[var(--descent-text-dim)] block">{item.name}</span>
            <div className="flex items-center justify-center gap-1 mt-1">
              <span className="text-sm text-[var(--descent-text)]">{item.first.toFixed(1)}</span>
              <span className="text-xs text-[var(--descent-text-dim)]">→</span>
              <span className="text-sm text-[var(--descent-text)]">{item.last.toFixed(1)}</span>
              <ChangeIndicator change={item.change} />
            </div>
          </div>
        ))}

        {/* 평균 */}
        <div className="text-center col-span-2 sm:col-span-3 pt-2 border-t border-[var(--descent-border)]">
          <span className="text-xs text-[var(--descent-accent)] block">평균</span>
          <div className="flex items-center justify-center gap-1 mt-1">
            <span className="text-lg font-medium text-[var(--descent-text)]">{avgFirst.toFixed(1)}</span>
            <span className="text-sm text-[var(--descent-text-dim)]">→</span>
            <span className="text-lg font-medium text-[var(--descent-text)]">{avgLast.toFixed(1)}</span>
            <ChangeIndicator change={avgChange} large />
          </div>
        </div>
      </div>
    </div>
  );
}

function ChangeIndicator({ change, large }: { change: number; large?: boolean }) {
  if (Math.abs(change) < 0.1) {
    return <span className={`text-[var(--descent-text-dim)] ${large ? 'text-sm' : 'text-xs'}`}>−</span>;
  }

  const isPositive = change > 0;
  const color = isPositive ? 'text-[var(--descent-success)]' : 'text-red-400';

  return (
    <span className={`${color} ${large ? 'text-sm font-medium' : 'text-xs'}`}>
      {isPositive ? '↑' : '↓'}{Math.abs(change).toFixed(1)}
    </span>
  );
}
