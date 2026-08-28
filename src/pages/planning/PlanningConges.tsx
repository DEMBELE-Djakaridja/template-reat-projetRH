import { useState } from "react";
import Card, { CardHeader, CardTitle } from "../../components/UI/Card";
import Button from "../../components/UI/Button";
import Badge from "../../components/UI/Badge";
import { ChevronLeft, ChevronRight, Plus, Calendar, List } from "lucide-react";
import { useApp, DIRECTIONS } from "../../context/AppContext";

const MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const JOURS_SEMAINE = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const CONGE_COLOR = "#DC2626";

interface CongeEvent {
  id: string; agent: string; direction: string; type: string;
  debut: Date; fin: Date;
  color: string;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return (new Date(year, month, 1).getDay() + 6) % 7; // 0 = Monday
}

function parseFr(date: string): Date | null {
  const [d, m, y] = date.split("/").map(Number);
  if (!d || !m || !y) return null;
  return new Date(y, m - 1, d);
}

export default function PlanningConges() {
  const { conges, setCurrentPage } = useApp();
  const [year, setYear] = useState(2024);
  const [month, setMonth] = useState(11); // December
  const [view, setView] = useState<"month" | "timeline">("month");
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [filterDir, setFilterDir] = useState("all");

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();

  const prevMonth = () => { setSelectedDay(null); if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { setSelectedDay(null); if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const monthEvents: CongeEvent[] = conges
    .filter(c => c.statut === "success")
    .map(c => {
      const debut = parseFr(c.debut);
      const fin = parseFr(c.fin);
      if (!debut || !fin) return null;
      return { id: c.id, agent: c.agent, direction: c.direction, type: c.type, debut, fin, color: CONGE_COLOR };
    })
    .filter((e): e is CongeEvent => !!e && e.debut <= new Date(year, month, daysInMonth) && e.fin >= new Date(year, month, 1));

  const directions = ["all", ...DIRECTIONS];
  const filteredConges = filterDir === "all" ? monthEvents : monthEvents.filter(c => c.direction === filterDir);

  const dayInRange = (e: CongeEvent, day: number) => {
    const d = new Date(year, month, day);
    return d >= new Date(e.debut.getFullYear(), e.debut.getMonth(), e.debut.getDate()) && d <= new Date(e.fin.getFullYear(), e.fin.getMonth(), e.fin.getDate());
  };

  const getEventsForDay = (day: number) => filteredConges.filter(c => dayInRange(c, day));
  const dayEvents = selectedDay ? getEventsForDay(selectedDay) : [];

  const totalJours = filteredConges.reduce((sum, e) => sum + (Math.round((e.fin.getTime() - e.debut.getTime()) / 86400000) + 1), 0);

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 text-gray-500 transition-all">
            <ChevronLeft size={18} />
          </button>
          <h2 className="text-xl font-bold text-gray-800 font-[family-name:var(--font-display)] min-w-48 text-center">
            {MOIS[month]} {year}
          </h2>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-white border border-transparent hover:border-gray-200 text-gray-500 transition-all">
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
            <button onClick={() => setView("month")} className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${view === "month" ? "bg-white shadow-sm text-gray-800" : "text-gray-500"}`}>
              <Calendar size={13} />Mois
            </button>
            <button onClick={() => setView("timeline")} className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${view === "timeline" ? "bg-white shadow-sm text-gray-800" : "text-gray-500"}`}>
              <List size={13} />Timeline
            </button>
          </div>
          <select value={filterDir} onChange={e => setFilterDir(e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white form-input">
            {directions.map(d => <option key={d} value={d}>{d === "all" ? "Toutes directions" : d}</option>)}
          </select>
          <Button size="sm" icon={<Plus size={14} />} onClick={() => setCurrentPage("conge-nouvelle")}>Planifier un congé</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        {/* Calendar */}
        <div className="lg:col-span-3">
          {view === "month" ? (
            <Card padding="sm">
              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {JOURS_SEMAINE.map(j => (
                  <div key={j} className={`text-center text-xs font-semibold py-2 ${j === "Sam" || j === "Dim" ? "text-gray-300" : "text-gray-400"}`}>{j}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-y-1.5">
                {/* Empty cells before first day */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square p-1" />
                ))}
                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const events = getEventsForDay(day);
                  const primary = events[0];
                  const continuesToNext = primary && day < daysInMonth && dayInRange(primary, day + 1);
                  const isWeekend = ((firstDay + i) % 7) >= 5;
                  const isSelected = selectedDay === day;
                  const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                  return (
                    <div
                      key={day}
                      onClick={() => setSelectedDay(isSelected ? null : day)}
                      className={`aspect-square p-1 cursor-pointer relative transition-all
                        ${isSelected ? "ring-2 ring-[#E8751A] z-10" : ""}
                        ${!primary ? "rounded-xl cal-day" : ""}
                        ${isWeekend && !primary ? "opacity-60" : ""}
                        ${isToday ? "font-bold" : ""}`}
                      style={primary ? { backgroundColor: `${primary.color}1A` } : undefined}
                    >
                      {continuesToNext && (
                        <span className="absolute top-4 right-0 -translate-y-1/2 translate-x-1/2 z-10 text-xs leading-none pointer-events-none"
                          style={{ color: primary.color }}>✦</span>
                      )}
                      <div className="flex flex-col h-full">
                        <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full flex-shrink-0
                          ${isToday ? "bg-[#E8751A] text-white" : primary ? "font-semibold" : "text-gray-700"}`}
                          style={!isToday && primary ? { color: primary.color } : undefined}>
                          {day}
                        </span>
                        <div className="flex-1 overflow-hidden mt-0.5 leading-tight">
                          {events.slice(0, 2).map((e, ei) => (
                            <p key={ei} className="text-[9px] font-medium truncate" style={{ color: e.color }} title={e.agent}>
                              {e.agent.split(" ")[0]}
                            </p>
                          ))}
                          {events.length > 2 && <p className="text-[8px] text-gray-400">+{events.length - 2}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {filteredConges.length === 0 && (
                <p className="mt-4 pt-4 border-t border-gray-50 text-xs text-gray-400">Aucun congé ce mois-ci</p>
              )}
            </Card>
          ) : (
            // Timeline view
            <Card padding="none">
              <div className="px-5 py-4 border-b border-gray-50">
                <CardTitle>Timeline des congés — {MOIS[month]} {year}</CardTitle>
              </div>
              <div className="overflow-x-auto">
                <div className="min-w-[700px]">
                  {/* Day headers */}
                  <div className="flex border-b border-gray-50 bg-gray-50/50">
                    <div className="w-48 flex-shrink-0 px-4 py-2 text-xs font-medium text-gray-400">Agent</div>
                    {Array.from({ length: daysInMonth }).map((_, i) => (
                      <div key={i} className={`flex-1 text-center text-xs py-2 ${(firstDay + i) % 7 >= 5 ? "text-gray-300" : "text-gray-400"}`}>
                        {i + 1}
                      </div>
                    ))}
                  </div>
                  {/* Agent rows */}
                  {filteredConges.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-8">Aucun congé ce mois-ci</p>
                  )}
                  {filteredConges.map(c => (
                    <div key={c.id} className="flex border-b border-gray-50 hover:bg-gray-50/50 transition-colors group">
                      <div className="w-48 flex-shrink-0 px-4 py-2 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: c.color }}>
                          {c.agent[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-gray-800 truncate">{c.agent}</p>
                          <p className="text-xs text-gray-400 truncate">{c.direction}</p>
                        </div>
                      </div>
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const inRange = dayInRange(c, day);
                        const isStart = new Date(year, month, day).toDateString() === c.debut.toDateString();
                        const isEnd = new Date(year, month, day).toDateString() === c.fin.toDateString();
                        return (
                          <div key={i} className={`flex-1 py-2 flex items-center`}>
                            {inRange && (
                              <div
                                className={`h-5 w-full opacity-85 ${isStart ? "rounded-l-full ml-0.5" : ""} ${isEnd ? "rounded-r-full mr-0.5" : ""}`}
                                style={{ backgroundColor: c.color }}
                                title={`${c.agent} — ${c.type}`}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {selectedDay && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <CardTitle>{selectedDay} {MOIS[month]}</CardTitle>
                <button onClick={() => setSelectedDay(null)} className="text-xs text-gray-400 hover:text-gray-600">×</button>
              </div>
              {dayEvents.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Aucun congé ce jour</p>
              ) : (
                <div className="space-y-2">
                  {dayEvents.map(e => (
                    <div key={e.id} className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: e.color }} />
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{e.agent}</p>
                        <p className="text-xs text-gray-500">{e.type}</p>
                        <p className="text-xs text-gray-400">{e.direction}</p>
                        <Badge variant="success" size="sm" dot className="mt-1">Validée</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Congés du mois</CardTitle>
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full font-medium">{filteredConges.length}</span>
            </CardHeader>
            <div className="space-y-2.5">
              {filteredConges.length === 0 && <p className="text-xs text-gray-400 text-center py-2">Aucun congé</p>}
              {filteredConges.map(a => (
                <div key={a.id} className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#E8751A] to-[#C45E0D] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{a.agent[0]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{a.agent}</p>
                    <p className="text-xs text-gray-400 truncate">{a.debut.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} – {a.fin.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</p>
                  </div>
                  <Badge variant="success" size="sm" dot>Valid.</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardTitle className="mb-4">Statistiques</CardTitle>
            <div className="space-y-3">
              {[
                { label: "Agents en congé", val: new Set(filteredConges.map(c => c.agent)).size, color: CONGE_COLOR },
                { label: "Jours totaux", val: totalJours, color: "#009A4E" },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{s.label}</span>
                  <span className="text-sm font-bold" style={{ color: s.color }}>{s.val}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
