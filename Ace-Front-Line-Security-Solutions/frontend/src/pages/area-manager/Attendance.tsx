import { useEffect, useRef, useState } from "react";
import { Chart } from "chart.js/auto";
import "./Attendance.css";

const MANAGER_ID = 1;

interface SecurityOfficer {
  id: number;
  fullName: string;
  securityId: string;
}

interface AttendanceRecord {
  id?: number;
  attendanceDate: string;
  securityOfficerName: string;
  securityId: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  hoursWorked: number;
  overtimeHours: number;
  status: string;
}

export default function Attendance() {
  const [officers, setOfficers] = useState<SecurityOfficer[]>([]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [shiftAlert, setShiftAlert] = useState({ show: false, message: "" });
  const [form, setForm] = useState({
    securityOfficerId: "",
    attendanceDate: "",
    checkInTime: "",
    checkOutTime: "",
    status: "PRESENT",
    remarks: "",
    isShiftCounted: "true",
    overtimeHours: "",
  });
  const [tableFilters, setTableFilters] = useState({
    date: "",
    officerName: "",
    securityId: "",
  });
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  const filteredRecords = records.filter((r) => {
    if (tableFilters.date && r.attendanceDate !== tableFilters.date) return false;
    if (
      tableFilters.officerName &&
      !r.securityOfficerName.toLowerCase().includes(tableFilters.officerName.toLowerCase())
    )
      return false;
    if (
      tableFilters.securityId &&
      !r.securityId.toLowerCase().includes(tableFilters.securityId.toLowerCase())
    )
      return false;
    return true;
  });
  const hasActiveFilters =
    tableFilters.date !== "" ||
    tableFilters.officerName !== "" ||
    tableFilters.securityId !== "";

  const recentRecords = [...filteredRecords]
    .sort((a, b) => b.attendanceDate.localeCompare(a.attendanceDate))
    .slice(0, 10);

  const calculatedHours = (() => {
    const { checkInTime: inVal, checkOutTime: outVal } = form;
    if (!inVal || !outVal) return "--";
    const inParts = inVal.split(":");
    const outParts = outVal.split(":");
    if (inParts.length !== 2 || outParts.length !== 2) return "--";
    const inMinutes = parseInt(inParts[0], 10) * 60 + parseInt(inParts[1], 10);
    const outMinutes = parseInt(outParts[0], 10) * 60 + parseInt(outParts[1], 10);
    let diff = outMinutes - inMinutes;
    if (diff < 0) diff += 24 * 60;
    return (diff / 60).toFixed(2) + " hours";
  })();

  // Automatically set "Count as Shift" to "No" when calculated working hours < 12
  useEffect(() => {
    const { checkInTime: inVal, checkOutTime: outVal } = form;
    if (!inVal || !outVal) return;
    const inParts = inVal.split(":");
    const outParts = outVal.split(":");
    if (inParts.length !== 2 || outParts.length !== 2) return;
    const inMinutes = parseInt(inParts[0], 10) * 60 + parseInt(inParts[1], 10);
    const outMinutes = parseInt(outParts[0], 10) * 60 + parseInt(outParts[1], 10);
    let diff = outMinutes - inMinutes;
    if (diff < 0) diff += 24 * 60;
    const hours = diff / 60;
    if (hours < 12) {
      setForm((f) => (f.isShiftCounted === "false" ? f : { ...f, isShiftCounted: "false" }));
    }
  }, [form.checkInTime, form.checkOutTime]);

  async function loadOfficers() {
    try {
      const res = await fetch(`/api/security-officers/manager/${MANAGER_ID}`);
      const data = await res.json();
      setOfficers(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error loading officers:", e);
      setOfficers([]);
    }
  }

  async function loadAttendance() {
    setRecordsLoading(true);
    try {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0];
      const res = await fetch(`/api/attendance/date-range?startDate=${startDate}&endDate=${endDate}`);
      const raw = await res.json();
      const data: AttendanceRecord[] = Array.isArray(raw) ? raw : [];
      setRecords(data);
      updateChart(data);
    } catch (e) {
      console.error("Error loading attendance:", e);
      setRecords([]);
      updateChart([]);
    } finally {
      setRecordsLoading(false);
    }
  }

  function updateChart(records: AttendanceRecord[]) {
    const ctx = chartRef.current?.getContext("2d");
    if (!ctx) return;
    const statusCounts = records.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] || 0) + 1;
      return acc;
    }, {});
    if (chartInstance.current) chartInstance.current.destroy();
    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: Object.keys(statusCounts),
        datasets: [
          {
            label: "Attendance Status",
            data: Object.values(statusCounts),
            backgroundColor: ["#28a745", "#dc3545", "#ffc107", "#17a2b8"],
            borderColor: "#1a1a1a",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
        plugins: { legend: { display: false } },
      },
    });
  }

  useEffect(() => {
    loadOfficers();
    loadAttendance();
    setForm((f) => ({ ...f, attendanceDate: new Date().toISOString().split("T")[0] }));
    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setShiftAlert({ show: false, message: "" });
    const payload = {
      securityOfficerId: parseInt(form.securityOfficerId, 10),
      attendanceDate: form.attendanceDate,
      checkInTime: form.checkInTime || null,
      checkOutTime: form.checkOutTime || null,
      status: form.status,
      remarks: form.remarks,
      isShiftCounted: form.isShiftCounted === "true",
      overtimeHours: form.overtimeHours !== "" ? parseFloat(form.overtimeHours) : null,
    };
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        alert("Attendance recorded successfully!");
        setForm({
          securityOfficerId: "",
          attendanceDate: new Date().toISOString().split("T")[0],
          checkInTime: "",
          checkOutTime: "",
          status: "PRESENT",
          remarks: "",
          isShiftCounted: "true",
          overtimeHours: "",
        });
        loadAttendance();
      } else {
        const error = await res.text();
        if (error.includes("maximum shifts")) {
          setShiftAlert({ show: true, message: error });
        } else {
          alert("Error: " + error);
        }
      }
    } catch (e) {
      console.error(e);
      alert("Failed to record attendance");
    }
  }

  function statusClass(s: string) {
    return "status-" + s.toLowerCase();
  }

  return (
    <div className="attendance-page">
      <div className="header">
        <h2>Attendance Sheet</h2>
        <p>Record daily attendance for security officers</p>
      </div>

      {shiftAlert.show && (
        <div className="alert alert-warning">
          <strong>Warning:</strong> <span>{shiftAlert.message}</span>
        </div>
      )}

      <div className="content-wrapper">
        <div className="form-section">
          <h3>Record Attendance</h3>
          <form id="attendanceForm" onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Security Officer *</label>
                <select
                  required
                  value={form.securityOfficerId}
                  onChange={(e) => setForm((f) => ({ ...f, securityOfficerId: e.target.value }))}
                >
                  <option value="">Select Officer</option>
                  {officers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.fullName} ({o.securityId})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Date *</label>
                <input
                  type="date"
                  required
                  value={form.attendanceDate}
                  onChange={(e) => setForm((f) => ({ ...f, attendanceDate: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Check-In Time</label>
                <input
                  type="time"
                  value={form.checkInTime}
                  onChange={(e) => setForm((f) => ({ ...f, checkInTime: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Check-Out Time</label>
                <input
                  type="time"
                  value={form.checkOutTime}
                  onChange={(e) => setForm((f) => ({ ...f, checkOutTime: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Calculated Working Hours</label>
                <input
                  type="text"
                  readOnly
                  value={calculatedHours}
                  placeholder="--"
                  className="calculated-hours"
                />
              </div>
              <div className="form-group">
                <label>OT Hours</label>
                <input
                  type="number"
                  min={0}
                  step={0.25}
                  placeholder="e.g. 1.5"
                  value={form.overtimeHours}
                  onChange={(e) => setForm((f) => ({ ...f, overtimeHours: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label>Status *</label>
                <select
                  required
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="PRESENT">Present</option>
                  <option value="ABSENT">Absent</option>
                  <option value="HALF_DAY">Half Day</option>
                  <option value="LEAVE">Leave</option>
                </select>
              </div>
              <div className="form-group">
                <label>Count as Shift</label>
                <select
                  value={form.isShiftCounted}
                  onChange={(e) => setForm((f) => ({ ...f, isShiftCounted: e.target.value }))}
                >
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Remarks</label>
              <textarea
                placeholder="Any additional notes..."
                value={form.remarks}
                onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
                className="remarks-textarea"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Save Attendance
            </button>
          </form>
        </div>
      </div>

      <div className="content-wrapper">
        <h3 className="section-title">Recent Attendance Records</h3>
        <div className="table-filters">
          <div className="form-group">
            <label>Filter by Date</label>
            <input
              type="date"
              value={tableFilters.date}
              onChange={(e) =>
                setTableFilters((f) => ({ ...f, date: e.target.value }))
              }
            />
          </div>
          <div className="form-group">
            <label>Filter by Officer Name</label>
            <input
              type="text"
              placeholder="e.g. Kamal"
              value={tableFilters.officerName}
              onChange={(e) =>
                setTableFilters((f) => ({ ...f, officerName: e.target.value }))
              }
            />
          </div>
          <div className="form-group">
            <label>Filter by Security ID</label>
            <input
              type="text"
              placeholder="e.g. SO-2026"
              value={tableFilters.securityId}
              onChange={(e) =>
                setTableFilters((f) => ({ ...f, securityId: e.target.value }))
              }
            />
          </div>
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-secondary btn-clear-filters"
              onClick={() =>
                setTableFilters({ date: "", officerName: "", securityId: "" })
              }
            >
              Clear filters
            </button>
          )}
        </div>
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Officer Name</th>
              <th>Security ID</th>
              <th>Check-In</th>
              <th>Check-Out</th>
              <th>Hours</th>
              <th>OT Hours</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {recordsLoading ? (
              <tr>
                <td colSpan={8} className="empty-state">
                  Loading records...
                </td>
              </tr>
            ) : recentRecords.length === 0 ? (
              <tr>
                <td colSpan={8} className="empty-state">
                  {hasActiveFilters
                    ? "No records match your filters"
                    : "No attendance records for this month"}
                </td>
              </tr>
            ) : (
              recentRecords.map((record, idx) => (
                <tr key={record.id ?? idx}>
                  <td>{new Date(record.attendanceDate).toLocaleDateString()}</td>
                  <td>{record.securityOfficerName}</td>
                  <td>{record.securityId}</td>
                  <td>{record.checkInTime ?? "-"}</td>
                  <td>{record.checkOutTime ?? "-"}</td>
                  <td>{(record.hoursWorked ?? 0).toFixed(2)}</td>
                  <td>{(record.overtimeHours ?? 0).toFixed(2)}</td>
                  <td>
                    <span className={`status-badge ${statusClass(record.status)}`}>{record.status}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="histogram-container">
        <h3>Monthly Attendance Overview</h3>
        <div className="chart-wrapper">
          <canvas ref={chartRef} id="attendanceChart" />
        </div>
      </div>
    </div>
  );
}

