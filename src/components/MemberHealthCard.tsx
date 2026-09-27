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

const RELATION_BG: Record<string, string> = {
  father: 'bg-blue-100 text-blue-700',
  mother: 'bg-pink-100 text-pink-700',
  son: 'bg-indigo-100 text-indigo-700',
  daughter: 'bg-purple-100 text-purple-700',
  other: 'bg-gray-100 text-gray-700',
};

const STATUS_COLOR: Record<string, string> = {
  normal: 'text-green-600',
  high: 'text-red-500',
  low: 'text-amber-500',
  unknown: 'text-gray-400',
};

function calcBmi(h?: number | null, w?: number | null): string | null {
  if (!h || !w || h <= 0) return null;
  return (w / ((h / 100) ** 2)).toFixed(1);
}

function bmiLabel(b: number): { text: string; color: string } {
  if (b < 18.5) return { text: 'Underweight', color: 'text-amber-600 bg-amber-50' };
  if (b < 25) return { text: 'Normal', color: 'text-green-600 bg-green-50' };
  if (b < 30) return { text: 'Overweight', color: 'text-amber-600 bg-amber-50' };
  return { text: 'Obese', color: 'text-red-600 bg-red-50' };
}

function Marker({ label, value, unit, status }: {
  label: string; value?: string | null; unit?: string; status?: string;
}) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-gray-400">{label}</p>
      {value ? (
        <p className={`text-sm font-semibold leading-tight ${status ? (STATUS_COLOR[status] || 'text-gray-800') : 'text-gray-800'}`}>
          {value}
          {unit && <span className="text-xs font-normal text-gray-400"> {unit}</span>}
        </p>
      ) : (
        <p className="text-xs text-gray-300 font-medium">—</p>
      )}
    </div>
  );
}

export function MemberHealthCard({ member }: { member: MemberSummary }) {
  const bmiVal = calcBmi(member.height_cm, member.weight_kg);
  const bmi = bmiVal ? bmiLabel(parseFloat(bmiVal)) : null;
  const relClass = RELATION_BG[member.relation] || RELATION_BG.other;

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3 border border-gray-100">
      {/* Name */}
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base flex-shrink-0 ${relClass}`}>
          {member.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-800 text-sm leading-tight">{member.name}</p>
          <p className="text-xs text-gray-400 capitalize">{member.relation}</p>
        </div>
      </div>

      {/* Static markers */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-50">
        <Marker label="Blood Group" value={member.blood_group} />
        <Marker label="Height" value={member.height_cm?.toString()} unit="cm" />
        <Marker label="Weight" value={member.weight_kg?.toString()} unit="kg" />
      </div>

      {/* BMI row */}
      {bmiVal && bmi && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">BMI</span>
          <span className="text-sm font-bold text-gray-800">{bmiVal}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${bmi.color}`}>{bmi.text}</span>
        </div>
      )}

      {/* Latest lab values */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-50">
        <Marker
          label="Last Sugar"
          value={member.latest_sugar?.value}
          unit="mg/dL"
          status={member.latest_sugar?.status}
        />
        <Marker
          label="Last Cholesterol"
          value={member.latest_cholesterol?.value}
          unit="mg/dL"
          status={member.latest_cholesterol?.status}
        />
      </div>
    </div>
  );
}
