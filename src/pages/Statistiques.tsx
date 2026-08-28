import Card, { CardHeader, CardTitle } from "../components/UI/Card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";
import { TrendingUp, TrendingDown, Download } from "lucide-react";
import Button from "../components/UI/Button";
import { downloadCsv } from "../lib/csv";

const mensuel = [
  { mois: "Jan", conges: 142, permissions: 68, rejets: 12 },
  { mois: "Fév", conges: 189, permissions: 82, rejets: 15 },
  { mois: "Mar", conges: 210, permissions: 95, rejets: 8 },
  { mois: "Avr", conges: 175, permissions: 73, rejets: 20 },
  { mois: "Mai", conges: 234, permissions: 112, rejets: 11 },
  { mois: "Jun", conges: 198, permissions: 89, rejets: 14 },
  { mois: "Jul", conges: 267, permissions: 124, rejets: 9 },
  { mois: "Aoû", conges: 312, permissions: 145, rejets: 18 },
  { mois: "Sep", conges: 156, permissions: 67, rejets: 7 },
  { mois: "Oct", conges: 198, permissions: 88, rejets: 13 },
  { mois: "Nov", conges: 223, permissions: 102, rejets: 16 },
  { mois: "Déc", conges: 287, permissions: 134, rejets: 10 },
];

const parDirection = [
  { name: "DRH Centrale", val: 342 },
  { name: "DGBF", val: 289 },
  { name: "DGTCP", val: 234 },
  { name: "MEF", val: 198 },
  { name: "MEN", val: 176 },
  { name: "Autres", val: 312 },
];

const radarData = [
  { subject: "Congé annuel", A: 45 },
  { subject: "Maladie", A: 25 },
  { subject: "Maternité", A: 15 },
  { subject: "Permission", A: 35 },
  { subject: "Exceptionnel", A: 10 },
  { subject: "Sans solde", A: 5 },
];

const pieDir = [
  { name: "DRH Centrale", value: 342, color: "#E8751A" },
  { name: "DGBF", value: 289, color: "#009A4E" },
  { name: "DGTCP", value: 234, color: "#2563EB" },
  { name: "MEF", value: 198, color: "#D97706" },
  { name: "Autres", value: 488, color: "#94A3B8" },
];

const Tip = ({ active, payload, label }: any) => active && payload?.length ? (
  <div className="bg-white border border-gray-100 shadow-lg rounded-lg p-3 text-xs">
    <p className="font-semibold text-gray-700 mb-1">{label}</p>
    {payload.map((p: any) => <p key={p.name} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong></p>)}
  </div>
) : null;

export default function Statistiques() {
  const kpis = [
    { label: "Demandes totales", val: "2 591", delta: "+18%", up: true },
    { label: "Taux de validation", val: "94.2%", delta: "+2.1%", up: true },
    { label: "Délai moyen traitement", val: "2.4j", delta: "-0.6j", up: true },
    { label: "Actes générés", val: "2 441", delta: "+21%", up: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800 font-[family-name:var(--font-display)]">Statistiques annuelles 2024</h2>
          <p className="text-sm text-gray-500">Aperçu des demandes de congés et permissions</p>
        </div>
        <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={() => downloadCsv("statistiques-mensuelles", mensuel)}>Exporter le rapport</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="stat-card bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-3xl font-bold text-gray-800 font-[family-name:var(--font-display)]">{k.val}</p>
            <p className="text-xs text-gray-500 mt-1">{k.label}</p>
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${k.up ? "text-green-600" : "text-red-500"}`}>
              {k.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {k.delta} vs 2023
            </div>
          </div>
        ))}
      </div>

      {/* Main chart */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Évolution mensuelle des demandes</CardTitle>
            <p className="text-xs text-gray-500 mt-0.5">Congés, permissions et rejets — Janvier à Décembre 2024</p>
          </div>
          <div className="flex gap-4 text-xs">
            {[["#E8751A", "Congés"], ["#009A4E", "Permissions"], ["#DC2626", "Rejets"]].map(([c, l]) => (
              <div key={l} className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />{l}</div>
            ))}
          </div>
        </CardHeader>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={mensuel} barGap={2} barCategoryGap="25%">
            <XAxis dataKey="mois" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
            <Tooltip content={<Tip />} />
            <Bar dataKey="conges" name="Congés" fill="#E8751A" radius={[4, 4, 0, 0]} />
            <Bar dataKey="permissions" name="Permissions" fill="#009A4E" radius={[4, 4, 0, 0]} />
            <Bar dataKey="rejets" name="Rejets" fill="#FECDD3" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* By direction */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Par direction</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={pieDir} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {pieDir.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v) => Number(v).toLocaleString("fr-FR")} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {pieDir.map(d => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                <span className="text-gray-600 flex-1">{d.name}</span>
                <span className="font-semibold text-gray-700">{d.value.toLocaleString("fr-FR")}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Radar */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Types de demandes</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="65%">
              <PolarGrid stroke="#E2E8F0" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: "#94A3B8" }} />
              <Radar name="%" dataKey="A" stroke="#E8751A" fill="#E8751A" fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        {/* Trend line */}
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle>Tendance annuelle</CardTitle></CardHeader>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={mensuel}>
              <XAxis dataKey="mois" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
              <Tooltip content={<Tip />} />
              <Line type="monotone" dataKey="conges" name="Congés" stroke="#E8751A" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="permissions" name="Permissions" stroke="#009A4E" strokeWidth={2} dot={false} strokeDasharray="4 4" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Direction bar */}
      <Card>
        <CardHeader>
          <CardTitle>Demandes par direction</CardTitle>
          <Button variant="outline" size="sm" icon={<Download size={14} />} onClick={() => downloadCsv("demandes-par-direction", parDirection)}>CSV</Button>
        </CardHeader>
        <div className="space-y-3">
          {parDirection.map((d, i) => {
            const max = Math.max(...parDirection.map(x => x.val));
            const pct = (d.val / max) * 100;
            return (
              <div key={d.name} className="flex items-center gap-4">
                <span className="text-xs text-gray-600 w-28 text-right flex-shrink-0">{d.name}</span>
                <div className="flex-1 h-5 bg-gray-100 rounded-lg overflow-hidden">
                  <div className="h-full rounded-lg flex items-center pl-2 text-white text-xs font-medium transition-all"
                    style={{ width: `${pct}%`, backgroundColor: i === 0 ? "#E8751A" : i === 1 ? "#009A4E" : "#2563EB" }}>
                    {pct > 20 && d.val.toLocaleString("fr-FR")}
                  </div>
                </div>
                <span className="text-xs font-bold text-gray-700 w-12 text-right flex-shrink-0">{d.val.toLocaleString("fr-FR")}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
