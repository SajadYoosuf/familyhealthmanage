'use client';

export type MemberSummary = {
  id: string;
  name: string;
  relation: string;
  blood_group?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  latest_sugar?: { value: string; status: string } | null;
  latest_cholesterol?: { value: string; status: string } | null;
};

const RELATION_STYLE: Record<string, { bg: string; text: string; ring: string }> = {
  father:   { bg: 'bg-blue-500',   text: 'text-blue-500',   ring: 'ring-blue-100'   },
  mother:   { bg: 'bg-rose-500',   text: 'text-rose-500',   ring: 'ring-rose-100'   },
  son:      { bg: 'bg-indigo-500', text: 'text-indigo-500', ring: 'ring-indigo-100' },
  daughter: { bg: 'bg-purple-500', text: 'text-purple-500', ring: 'ring-purple-100' },
  other:    { bg: 'bg-gray-400',   text: 'text-gray-400',   ring: 'ring-gray-100'   },
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  normal:  { color: 'text-emerald-600', bg: 'bg-emerald-50',  label: 'Normal'  },
  high:    { color: 'text-red-600',     bg: 'bg-red-50',      label: 'High'    },
  low:     { color: 'text-amber-600',   bg: 'bg-amber-50',    label: 'Low'     },
  unknown: { color: 'text-gray-400',    bg: 'bg-gray-50',     label: '—'       },
};

function calcBmi(h?: number | null, w?: number | null): string | null {
  if (!h || !w || h <= 0) return null;
  return (w / ((h / 100) ** 2)).toFixed(1);
}

function bmiLabel(b: number): { text: string; color: string; bg: string } {
  if (b < 18.5) return { text: 'Underweight', color: 'text-amber-600', bg: 'bg-amber-50' };
  if (b < 25)   return { text: 'Normal',      color: 'text-emerald-600', bg: 'bg-emerald-50' };
  if (b < 30)   return { text: 'Overweight',  color: 'text-amber-600', bg: 'bg-amber-50' };
  return              { text: 'Obese',        color: 'text-red-600', bg: 'bg-red-50' };
}

function MetricPill({ label, value, unit, status }: {
  label: string; value?: string | null; unit?: string; status?: string;
}) {
  const cfg = status ? (STATUS_CONFIG[status] || STATUS_CONFIG.unknown) : null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</span>
      {value ? (
        <div className="flex items-baseline gap-1">
          <span className={`text-sm font-bold ${cfg?.color || 'text-gray-800'}`}>{value}</span>
          {unit && <span className="text-[10px] text-gray-400 font-medium">{unit}</span>}
        </div>
      ) : (
        <span className="text-sm font-semibold text-gray-300">—</span>
      )}
    </div>
  );
}

export function MemberHealthCard({ member }: { member: MemberSummary }) {
  const bmiVal = calcBmi(member.height_cm, member.weight_kg);
  const bmi = bmiVal ? bmiLabel(parseFloat(bmiVal)) : null;
  const rel = RELATION_STYLE[member.relation] || RELATION_STYLE.other;

  const sugarCfg = member.latest_sugar ? STATUS_CONFIG[member.latest_sugar.status] || STATUS_CONFIG.unknown : null;
  const cholCfg = member.latest_cholesterol ? STATUS_CONFIG[member.latest_cholesterol.status] || STATUS_CONFIG.unknown : null;

  return (
    <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-gray-100 hover:shadow-card-md transition-shadow">
      {/* Header strip */}
      <div className="px-4 pt-4 pb-3 flex items-center gap-3">
        <div className={`w-11 h-11 rounded-2xl ${rel.bg} flex items-center justify-center flex-shrink-0 ring-4 ${rel.ring}`}>
          <span className="text-white font-bold text-base">{member.name.charAt(0).toUpperCase()}</span>
        </div>
        <div className="min-w-0">
          <p className="font-bold text-gray-900 text-sm leading-tight truncate">{member.name}</p>
          <p className={`text-xs font-semibold capitalize mt-0.5 ${rel.text}`}>{member.relation}</p>
        </div>
        {member.blood_group && (
          <span className="ml-auto flex-shrink-0 text-xs font-bold text-gray-600 bg-gray-100 rounded-lg px-2 py-1">
            {member.blood_group}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-gray-50" />

      {/* Body metrics */}
      <div className="px-4 py-3 grid grid-cols-3 gap-3">
        <MetricPill label="Height" value={member.height_cm?.toString()} unit="cm" />
        <MetricPill label="Weight" value={member.weight_kg?.toString()} unit="kg" />
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">BMI</span>
          {bmiVal && bmi ? (
            <div className="flex items-center gap-1">
              <span className={`text-sm font-bold ${bmi.color}`}>{bmiVal}</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${bmi.color} ${bmi.bg}`}>{bmi.text}</span>
            </div>
          ) : (
            <span className="text-sm font-semibold text-gray-300">—</span>
          )}
        </div>
      </div>

      {/* Lab values */}
      <div className="mx-4 border-t border-gray-50" />
      <div className="px-4 py-3 grid grid-cols-2 gap-3">
        <div className="space-y-0.5">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Last Sugar</span>
          {member.latest_sugar ? (
            <div className="flex items-center gap-1.5">
              <span className={`text-sm font-bold ${sugarCfg?.color}`}>{member.latest_sugar.value}</span>
              <span className="text-[10px] text-gray-400">mg/dL</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${sugarCfg?.color} ${sugarCfg?.bg}`}>
                {sugarCfg?.label}
              </span>
            </div>
          ) : (
            <span className="text-sm font-semibold text-gray-300">—</span>
          )}
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Cholesterol</span>
          {member.latest_cholesterol ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-sm font-bold ${cholCfg?.color}`}>{member.latest_cholesterol.value}</span>
              <span className="text-[10px] text-gray-400">mg/dL</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${cholCfg?.color} ${cholCfg?.bg}`}>
                {cholCfg?.label}
              </span>
            </div>
          ) : (
            <span className="text-sm font-semibold text-gray-300">—</span>
          )}
        </div>
      </div>
    </div>
  );
}
