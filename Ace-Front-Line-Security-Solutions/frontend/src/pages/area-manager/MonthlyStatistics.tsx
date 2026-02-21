import { useEffect, useState } from "react";
import "./MonthlyStatistics.css";

const MANAGER_ID = 1;
const MAX_SHIFTS_FOR_OT = 60;
const OT_HOURS_PER_SHIFT = 3;

interface StatRow {
  securityId: string;
  officerName: string;
  monthlyShifts: number;
  monthlyOvertimeHours: number;
}

export default function MonthlyStatistics() {
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return String(d.getMonth() + 1).padStart(2, "0");
  });
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [stats, setStats] = useState<StatRow[]>([]);

  async function loadData() {
    setLoading(true);
    try {
      const mo = parseInt(month, 10);
      const yr = year;
      const res = await fetch(`/api/monthly-statistics/manager/${MANAGER_ID}?month=${mo}&year=${yr}`);
      const data = await res.json();
      const rows: StatRow[] = Array.isArray(data) ? data : [];
      setStats(rows);
    } catch (e) {
      console.error("Error loading monthly statistics:", e);
      setStats([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [month, year]);

  const monthLabel = (() => {
    const mo = parseInt(month, 10);
    if (Number.isNaN(mo) || mo < 1 || mo > 12) return `${year}`;
    const names = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    return `${names[mo - 1]} ${year}`;
  })();

  return (
    <div className="area-monthly-stats">
      <div className="header">
        <h2>Monthly Statistics</h2>
        <p>
          Security ID, monthly shifts, and monthly OT hours (OT = min(shifts, 60) × 3)
        </p>
      </div>

      <div className="content-wrapper">
        <div className="form-section filter-row">
          <label>Month</label>
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
              <option key={m} value={String(m).padStart(2, "0")}>
                {new Date(2000, m - 1, 1).toLocaleString("default", { month: "long" })}
              </option>
            ))}
          </select>
          <label>Year</label>
          <input
            type="number"
            min={2020}
            max={2030}
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value, 10) || new Date().getFullYear())}
          />
          <button type="button" className="btn btn-primary" onClick={loadData}>
            Refresh
          </button>
        </div>

        <table className="stats-table">
          <thead>
            <tr>
              <th>Security ID</th>
              <th>Officer Name</th>
              <th>Monthly Shifts</th>
              <th>Monthly OT Hours</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="empty-state">
                  Loading…
                </td>
              </tr>
            ) : stats.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-state">
                  No officers or no data for {monthLabel}.
                </td>
              </tr>
            ) : (
              stats.map((row) => (
                <tr key={row.securityId}>
                  <td>{row.securityId}</td>
                  <td>{row.officerName}</td>
                  <td>{row.monthlyShifts}</td>
                  <td>{row.monthlyOvertimeHours.toFixed(2)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <p className="stats-note">
          Monthly OT hours = min(monthly shifts, {MAX_SHIFTS_FOR_OT}) × {OT_HOURS_PER_SHIFT}. Maximum
          shifts used for OT is {MAX_SHIFTS_FOR_OT}.
        </p>
      </div>
    </div>
  );
}

