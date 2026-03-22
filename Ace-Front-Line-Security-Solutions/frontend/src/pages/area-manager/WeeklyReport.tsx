import { useEffect, useRef, useState } from "react";
import { Chart } from "chart.js/auto";
import "./WeeklyReport.css";
import { hslVar } from "@/lib/utils";

const MANAGER_ID = 1;

interface WeeklyReportRecord {
  id: number;
  securityOfficerName: string;
  securityId: string;
  companyName: string;
  weekNumber: number;
  month: number | null;
  year: number;
  totalShifts: number;
  totalOvertimeHours: number;
  totalHoursWorked: number;
  remarks: string | null;
}

interface SecurityOfficer {
  id: number;
  fullName: string;
  securityId: string;
}

function weekDisplayLabel(r: WeeklyReportRecord): string {
  if (r.month != null && r.month >= 1 && r.month <= 12) {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return "Week " + r.weekNumber + ", " + months[r.month - 1] + " " + r.year;
  }
  return "Week " + r.weekNumber + ", " + r.year;
}

function getWeekAndYearFromDate(
  dateStr: string
): { weekNumber: number; month: number; year: number; label: string } | null {
  if (!dateStr) return null;
  const d = new Date(dateStr + "T12:00:00");
  const year = d.getFullYear();
  const month = d.getMonth();
  const dayOfMonth = d.getDate();
  const weekNumber = Math.min(4, Math.floor((dayOfMonth - 1) / 7) + 1);
  const weekStartDay = (weekNumber - 1) * 7 + 1;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const weekEndDay = weekNumber < 4 ? weekNumber * 7 : lastDay;
  const weekStartDate = new Date(year, month, weekStartDay);
  const weekEndDate = new Date(year, month, weekEndDay);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const fmt = (dt: Date) => dt.getDate() + " " + months[dt.getMonth()];
  return {
    weekNumber,
    month: month + 1,
    year,
    label:
      "Week " +
      weekNumber +
      ", " +
      months[month] +
      " " +
      year +
      " (" +
      fmt(weekStartDate) +
      " – " +
      fmt(weekEndDate) +
      ")",
  };
}

export default function WeeklyReport() {
  const [companies, setCompanies] = useState<string[]>([]);
  const [officers, setOfficers] = useState<SecurityOfficer[]>([]);
  const [allReports, setAllReports] = useState<WeeklyReportRecord[]>([]);
  const [crudReports, setCrudReports] = useState<WeeklyReportRecord[]>([]);
  const [filterCompany, setFilterCompany] = useState("");
  const [filterOfficerId, setFilterOfficerId] = useState("");
  const [filterWeekDate, setFilterWeekDate] = useState("");
  const [crudCompany, setCrudCompany] = useState("");
  const [crudWeekDate, setCrudWeekDate] = useState("");
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [manageGroup, setManageGroup] = useState<WeeklyReportRecord[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editReport, setEditReport] = useState<WeeklyReportRecord | null>(null);
  const [editForm, setEditForm] = useState({
    totalShifts: 0,
    totalOvertimeHours: 0,
    totalHoursWorked: 0,
    remarks: "",
  });
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const lastGeneratedKeyRef = useRef<string>("");
  const lastCrudGeneratedKeyRef = useRef<string>("");

  const crudWeekDateInputRef = useRef<HTMLInputElement | null>(null);
  const filterWeekDateInputRef = useRef<HTMLInputElement | null>(null);

  function openDatePicker(ref: React.RefObject<HTMLInputElement>) {
    const el = ref.current;
    if (!el) return;
    if (typeof (el as HTMLInputElement & { showPicker?: () => void }).showPicker === "function") {
      (el as HTMLInputElement & { showPicker: () => void }).showPicker();
    } else {
      el.focus();
      el.click();
    }
  }

  async function loadCompanies() {
    try {
      // Load companies from `client_companies` so the selector reflects database reality.
      const res = await fetch(`/api/shift-schedules/client-companies`);
      const data = await res.json();
      const names = Array.isArray(data) ? data.map((c) => c?.name).filter(Boolean) : [];
      setCompanies(names);
    } catch (e) {
      console.error("Error loading companies:", e);
      setCompanies([]);
    }
  }

  async function loadOfficersForCompany(companyName: string) {
    try {
      const res = await fetch(
        `/api/security-officers/manager/${MANAGER_ID}/by-company?companyName=${encodeURIComponent(companyName)}`
      );
      const data = await res.json();
      setOfficers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error loading officers:", e);
      setOfficers([]);
    }
  }

  async function loadReports() {
    try {
      const res = await fetch(`/api/weekly-reports/manager/${MANAGER_ID}`);
      const data = await res.json();
      setAllReports(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error loading reports:", e);
      setAllReports([]);
    }
  }

  // When the user selects a company + week date in the filter section,
  // generate weekly report rows from APPROVED shift scheduling allocations,
  // then reload the list so those rows show up immediately.
  useEffect(() => {
    (async () => {
      if (!filterCompany || !filterWeekDate) return;

      const key = `${filterCompany}|${filterWeekDate}`;
      if (lastGeneratedKeyRef.current === key) return;
      lastGeneratedKeyRef.current = key;

      try {
        await fetch(
          `/api/weekly-reports/generate/company?companyName=${encodeURIComponent(
            filterCompany
          )}&weekDate=${encodeURIComponent(filterWeekDate)}`,
          { method: "POST" }
        );
        await loadReports();
      } catch (e) {
        console.error(e);
        alert("Failed to generate weekly reports for the selected company/week.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCompany, filterWeekDate]);

  async function loadCrudReports() {
    if (!crudCompany) {
      alert("Please select a company.");
      return;
    }
    try {
      // Ensure rows exist for the selected company/week by generating from
      // APPROVED shift allocations. This makes "Load Report" behave like the user expects.
      if (crudWeekDate) {
        const key = `${crudCompany}|${crudWeekDate}`;
        if (lastCrudGeneratedKeyRef.current !== key) {
          lastCrudGeneratedKeyRef.current = key;
          await fetch(
            `/api/weekly-reports/generate/company?companyName=${encodeURIComponent(
              crudCompany
            )}&weekDate=${encodeURIComponent(crudWeekDate)}`,
            { method: "POST" }
          );
        }
      }

      let url = `/api/weekly-reports/manager/${MANAGER_ID}/company?companyName=${encodeURIComponent(crudCompany)}`;
      if (crudWeekDate) url += "&weekDate=" + encodeURIComponent(crudWeekDate);
      const res = await fetch(url);
      const data = await res.json();
      setCrudReports(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error loading CRUD reports:", e);
      alert("Failed to load report data.");
      setCrudReports([]);
    }
  }

  const filteredReports = (() => {
    const base = Array.isArray(allReports) ? allReports : [];
    let list = base.slice().filter((r) => r && typeof r === "object");
    if (filterCompany) list = list.filter((r) => r.companyName === filterCompany);
    if (filterOfficerId) list = list.filter((r) => r.securityId === filterOfficerId);
    if (filterWeekDate) {
      const wk = getWeekAndYearFromDate(filterWeekDate);
      if (wk) {
        list = list.filter(
          (r) => r.year === wk.year && r.month === wk.month && r.weekNumber === wk.weekNumber
        );
      }
    }
    list.sort((a, b) => (a.year !== b.year ? a.year - b.year : a.weekNumber - b.weekNumber));
    return list;
  })();

  const summary =
    filteredReports.length > 0
      ? (() => {
          const first = filteredReports[0];
          const seenIds: Record<string, boolean> = {};
          const officerLabels: string[] = [];
          let totalShiftsSum = 0;
          filteredReports.forEach((r) => {
            if (!seenIds[r.securityId]) {
              seenIds[r.securityId] = true;
              officerLabels.push(r.securityOfficerName + " (" + r.securityId + ")");
            }
            totalShiftsSum += r.totalShifts;
          });
          return { company: first.companyName, officers: officerLabels.join(", "), totalShifts: totalShiftsSum };
        })()
      : null;

  function updateChart() {
    const ctx = chartRef.current?.getContext("2d");
    if (!ctx) return;
    const reports = filteredReports;
    let labels: string[];
    let dataValues: number[];
    const perOfficer = !!filterOfficerId;

    if (perOfficer) {
      const data = reports.slice(0, 10).map((r) => ({
        weekLabel: "W" + r.weekNumber + " " + r.year,
        shifts: r.totalShifts,
      }));
      labels = data.map((d) => d.weekLabel);
      dataValues = data.map((d) => d.shifts);
    } else {
      const grouped: { weekNumber: number; year: number; totalShifts: number }[] = [];
      reports.forEach((r) => {
        const existing = grouped.find((g) => g.weekNumber === r.weekNumber && g.year === r.year);
        if (existing) existing.totalShifts += r.totalShifts;
        else grouped.push({ weekNumber: r.weekNumber, year: r.year, totalShifts: r.totalShifts });
      });
      const limited = grouped.slice(0, 10);
      labels = limited.map((g) => "W" + g.weekNumber + " " + g.year);
      dataValues = limited.map((g) => g.totalShifts);
    }

    if (chartInstance.current) chartInstance.current.destroy();

    const primary = hslVar("--primary");
    const foreground = hslVar("--foreground");
    const mutedForeground = hslVar("--muted-foreground");
    const border = hslVar("--border");
    const tooltipBg = hslVar("--card") || hslVar("--background");

    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: perOfficer ? "Shifts per Week (Officer)" : "Shifts per Week (Company total)",
            data: dataValues,
            backgroundColor: primary || "#F4CC00",
            borderColor: border || primary || "#111111",
            hoverBackgroundColor: primary ? primary : "#F4CC00",
            borderWidth: 1,
            borderRadius: 8,
            maxBarThickness: 44,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: mutedForeground || "#666",
              font: { family: "Public Sans" },
            },
          },
          tooltip: {
            backgroundColor: tooltipBg || "rgba(255,255,255,0.95)",
            titleColor: foreground || "#111",
            bodyColor: mutedForeground || "#444",
            borderColor: border || "rgba(0,0,0,0.1)",
            borderWidth: 1,
            titleFont: { family: "Public Sans", weight: "600" as const },
            bodyFont: { family: "Public Sans" },
          },
        },
        scales: {
          x: {
            grid: { color: border ? border : "rgba(0,0,0,0.06)" },
            ticks: { color: mutedForeground || "#666", font: { family: "Public Sans" } },
          },
          y: {
            beginAtZero: true,
            grid: { color: border ? border : "rgba(0,0,0,0.06)" },
            ticks: { stepSize: 1, color: mutedForeground || "#666", font: { family: "Public Sans" } },
          },
        },
      },
    });
  }

  useEffect(() => {
    updateChart();
    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [filteredReports.length, filterOfficerId]);

  useEffect(() => {
    loadCompanies();
    loadReports();
  }, []);

  useEffect(() => {
    if (filterCompany) loadOfficersForCompany(filterCompany);
    else setOfficers([]);
  }, [filterCompany]);

  function viewReport(id: number) {
    alert("Report details view - Coming soon!\nReport ID: " + id);
  }

  function openManageModal(idsStr: string) {
    const ids = idsStr.split(",").map((s) => parseInt(s.trim(), 10));
    const group = ids
      .map((id) => crudReports.find((x) => x.id === id))
      .filter(Boolean) as WeeklyReportRecord[];
    setManageGroup(group);
    setManageModalOpen(true);
  }

  function openEditModal(r: WeeklyReportRecord) {
    setManageModalOpen(false);
    setEditReport(r);
    setEditForm({
      totalShifts: r.totalShifts ?? 0,
      totalOvertimeHours: r.totalOvertimeHours ?? 0,
      totalHoursWorked: r.totalHoursWorked ?? 0,
      remarks: r.remarks ?? "",
    });
    setEditModalOpen(true);
  }

  async function saveEdit() {
    if (!editReport) return;
    let totalShifts = editForm.totalShifts;
    let totalOvertimeHours = editForm.totalOvertimeHours;
    if (totalShifts > 14) {
      alert(
        "A security officer can have a maximum of 14 shifts per week (2 per day). The value will be capped at 14."
      );
      totalShifts = 14;
      setEditForm((f) => ({ ...f, totalShifts: 14 }));
    }
    if (totalOvertimeHours > 42) {
      alert("Maximum overtime allowed is 42 hours per week. The value will be capped at 42.");
      totalOvertimeHours = 42;
      setEditForm((f) => ({ ...f, totalOvertimeHours: 42 }));
    }
    try {
      const res = await fetch("/api/weekly-reports/" + editReport.id, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editReport.id,
          totalShifts,
          totalOvertimeHours,
          totalHoursWorked: editForm.totalHoursWorked,
          remarks: editForm.remarks,
        }),
      });
      if (!res.ok) {
        alert("Update failed: " + (await res.text()));
        return;
      }
      setEditModalOpen(false);
      setEditReport(null);
      loadCrudReports();
      loadReports();
    } catch (e) {
      console.error(e);
      alert("Failed to update report.");
    }
  }

  async function deleteReport(reportId: number) {
    if (!confirm("Delete this weekly report row?")) return;
    try {
      const res = await fetch("/api/weekly-reports/" + reportId, { method: "DELETE" });
      if (!res.ok) {
        alert("Delete failed: " + (await res.text()));
        return;
      }
      setManageModalOpen(false);
      loadCrudReports();
      loadReports();
    } catch (e) {
      console.error(e);
      alert("Failed to delete report.");
    }
  }

  function handleCrudGenerateClick() {
    (async () => {
      if (!crudCompany || !crudWeekDate) {
        alert("Please select a company and a week date first.");
        return;
      }

      try {
        // Generate weekly report rows based on APPROVED shift scheduling.
        await fetch(
          `/api/weekly-reports/generate/company?companyName=${encodeURIComponent(
            crudCompany
          )}&weekDate=${encodeURIComponent(crudWeekDate)}`,
          { method: "POST" }
        );

        await loadCrudReports();
        await loadReports();
        alert(`Weekly reports generated for ${crudCompany}.`);
      } catch (e) {
        console.error(e);
        alert("Failed to generate weekly report for this company/week.");
      }
    })();
  }

  const crudTableRows = (() => {
    if (!crudCompany || crudReports.length === 0) return null;
    const byPerson: Record<string, WeeklyReportRecord[]> = {};
    crudReports.forEach((r) => {
      const key = r.securityId ?? r.securityOfficerName ?? "";
      if (!byPerson[key]) byPerson[key] = [];
      byPerson[key].push(r);
    });
    const selectedWeekLabel = crudWeekDate ? getWeekAndYearFromDate(crudWeekDate)?.label : null;
    const rows: {
      name: string;
      sid: string;
      weekLabel: string;
      totalShifts: number;
      totalOT: number;
      totalHours: number;
      remarks: string;
      group: WeeklyReportRecord[];
    }[] = [];
    for (const key of Object.keys(byPerson)) {
      const group = byPerson[key];
      const first = group[0];
      let totalShifts = 0,
        totalOT = 0,
        totalHours = 0;
      const remarksParts: string[] = [];
      group.forEach((r) => {
        totalShifts += r.totalShifts ?? 0;
        totalOT += r.totalOvertimeHours ?? 0;
        totalHours += r.totalHoursWorked ?? 0;
        if (r.remarks) remarksParts.push(r.remarks);
      });
      const weekLabel =
        selectedWeekLabel ?? (group.length === 1 ? weekDisplayLabel(first) : group.length + " weeks (merged)");
      rows.push({
        name: first.securityOfficerName,
        sid: first.securityId ?? key,
        weekLabel,
        totalShifts,
        totalOT,
        totalHours,
        remarks: remarksParts.length > 0 ? remarksParts.join(" | ") : "-",
        group,
      });
    }
    return rows;
  })();

  return (
    <div className="area-weekly">
      <div className="header">
        <h2>Weekly Report</h2>
        <p>Generate and view weekly shift reports for security officers</p>
      </div>

      <div className="content-wrapper">
        <div className="form-section">
          <h3>Generate Weekly Report</h3>
          <p className="section-desc">
            Select a company to see security officers and their weekly report details. You can generate, edit, or delete
            report rows.
          </p>
          <div className="form-grid">
            <div className="form-group">
              <label>Company *</label>
              <select value={crudCompany} onChange={(e) => setCrudCompany(e.target.value)}>
                <option value="">Select Company</option>
                {companies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Week Date</label>
              <div className="date-input-wrapper">
                <input
                  ref={crudWeekDateInputRef}
                  type="date"
                  value={crudWeekDate}
                  onChange={(e) => setCrudWeekDate(e.target.value)}
                />
                <button
                  type="button"
                  className="btn calendar-btn"
                  onClick={() => openDatePicker(crudWeekDateInputRef)}
                >
                  📅
                </button>
              </div>
            </div>
          </div>
          <button type="button" className="btn btn-primary" onClick={loadCrudReports}>
            Load Report
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleCrudGenerateClick}>
            Generate Report for this Company &amp; Week
          </button>

          {crudCompany && crudReports.length > 0 && (
            <>
              <div className="crud-company-header">{crudCompany}</div>
              <table className="reports-table">
                <thead>
                  <tr>
                    <th>Officer Name</th>
                    <th>Security ID</th>
                    <th>Week</th>
                    <th>Shifts</th>
                    <th>OT Hours</th>
                    <th>Total Hours</th>
                    <th>Remarks</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {crudTableRows?.map((row) => (
                    <tr key={row.sid + row.weekLabel}>
                      <td>{row.name}</td>
                      <td>{row.sid}</td>
                      <td>{row.weekLabel}</td>
                      <td>{row.totalShifts}</td>
                      <td>{row.totalOT.toFixed(2)}</td>
                      <td>{row.totalHours.toFixed(2)}</td>
                      <td>{row.remarks}</td>
                      <td>
                        {row.group.length === 1 ? (
                          <>
                            <button
                              type="button"
                              className="btn-view"
                              onClick={() => openEditModal(row.group[0])}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn-secondary btn-sm"
                              onClick={() => deleteReport(row.group[0].id)}
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            className="btn-view"
                            onClick={() => openManageModal(row.group.map((r) => r.id).join(","))}
                          >
                            Manage
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          {crudCompany && crudReports.length === 0 && (
            <div className="crud-empty-message">
              No report rows for this company. Use &quot;Generate Report for this Company &amp; Week&quot; after selecting
              a week date.
            </div>
          )}
        </div>
      </div>

      <div className="content-wrapper">
        <div className="form-section">
          <h3>Filter the weekly reports</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Company *</label>
              <select value={filterCompany} onChange={(e) => setFilterCompany(e.target.value)}>
                <option value="">Select Company</option>
                {companies.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Security Officers in Company</label>
              <select value={filterOfficerId} onChange={(e) => setFilterOfficerId(e.target.value)}>
                <option value="">Select Officer (optional)</option>
                {officers.map((o) => (
                  <option key={o.id} value={o.securityId}>
                    {o.fullName} ({o.securityId})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Week Date *</label>
              <div className="date-input-wrapper">
                <input
                  ref={filterWeekDateInputRef}
                  type="date"
                  value={filterWeekDate}
                  onChange={(e) => setFilterWeekDate(e.target.value)}
                />
                <button
                  type="button"
                  className="btn calendar-btn"
                  onClick={() => openDatePicker(filterWeekDateInputRef)}
                >
                  📅
                </button>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => window.location.reload()}
          >
            Refresh List
          </button>
        </div>
      </div>

      {manageModalOpen && manageGroup.length > 0 && (
        <div className="modal-overlay" onClick={() => setManageModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>
              Reports for {manageGroup[0].securityOfficerName} ({manageGroup[0].securityId})
            </h3>
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Week</th>
                  <th>Shifts</th>
                  <th>OT Hours</th>
                  <th>Total Hours</th>
                  <th>Remarks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {manageGroup.map((r) => (
                  <tr key={r.id}>
                    <td>{weekDisplayLabel(r)}</td>
                    <td>{r.totalShifts ?? 0}</td>
                    <td>{(r.totalOvertimeHours ?? 0).toFixed(2)}</td>
                    <td>{(r.totalHoursWorked ?? 0).toFixed(2)}</td>
                    <td>{r.remarks ?? "-"}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-view"
                        onClick={() => openEditModal(r)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => deleteReport(r.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              type="button"
              className="btn btn-secondary"
              style={{ marginTop: 16 }}
              onClick={() => setManageModalOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {editModalOpen && editReport && (
        <div className="modal-overlay" onClick={() => setEditModalOpen(false)}>
          <div className="modal-content modal-edit" onClick={(e) => e.stopPropagation()}>
            <h3>Edit Weekly Report</h3>
            <div className="form-group">
              <label>Total Shifts (max 14 per week)</label>
              <input
                type="number"
                min={0}
                max={14}
                step={1}
                value={editForm.totalShifts}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, totalShifts: parseInt(e.target.value, 10) || 0 }))
                }
              />
            </div>
            <div className="form-group">
              <label>OT Hours (max 42 per week)</label>
              <input
                type="number"
                min={0}
                max={42}
                step={0.25}
                value={editForm.totalOvertimeHours}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, totalOvertimeHours: parseFloat(e.target.value) || 0 }))
                }
              />
            </div>
            <div className="form-group">
              <label>Total Hours Worked</label>
              <input
                type="number"
                min={0}
                step={0.25}
                value={editForm.totalHoursWorked}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, totalHoursWorked: parseFloat(e.target.value) || 0 }))
                }
              />
            </div>
            <div className="form-group">
              <label>Remarks</label>
              <input
                type="text"
                placeholder="Optional"
                value={editForm.remarks}
                onChange={(e) => setEditForm((f) => ({ ...f, remarks: e.target.value }))}
              />
            </div>
            <button type="button" className="btn btn-primary" onClick={saveEdit}>
              Save
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditModalOpen(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="content-wrapper">
        <h3 className="section-title">Recent Weekly Reports</h3>
        <div className="company-weekly-summary">
          <p>
            <strong>Company Name:</strong> <span>{summary?.company ?? "-"}</span>
          </p>
          <p>
            <strong>Security Officers:</strong> <span>{summary?.officers ?? "-"}</span>
          </p>
          <p>
            <strong>Total Shifts (all officers):</strong> <span>{summary?.totalShifts ?? "-"}</span>
          </p>
        </div>
        <table className="reports-table">
          <thead>
            <tr>
              <th>Week</th>
              <th>Officer Name</th>
              <th>Security ID</th>
              <th>Company</th>
              <th>Shifts</th>
              <th>OT Hours</th>
              <th>Total Hours</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredReports.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-state">
                  No reports generated yet
                </td>
              </tr>
            ) : (
              filteredReports.map((report) => (
                <tr key={report.id}>
                  <td>{weekDisplayLabel(report)}</td>
                  <td>{report.securityOfficerName}</td>
                  <td>{report.securityId}</td>
                  <td>{report.companyName}</td>
                  <td>
                    {report.totalShifts}{" "}
                    {report.totalShifts >= 15 ? (
                      <span className="badge badge-warning">High</span>
                    ) : (
                      <span className="badge badge-success">Normal</span>
                    )}
                  </td>
                  <td>{(report.totalOvertimeHours ?? 0).toFixed(2)}</td>
                  <td>{(report.totalHoursWorked ?? 0).toFixed(2)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn-view"
                      onClick={() => viewReport(report.id)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="histogram-container">
        <h3>Weekly Shifts Overview</h3>
        <div className="chart-wrapper">
          <canvas ref={chartRef} />
        </div>
      </div>
    </div>
  );
}

