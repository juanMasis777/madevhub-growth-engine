// ============================================================
// One headline metric on the dashboard.
// ============================================================

export default function StatCard({ title, value }) {
  return (
    <div className="stat-card">
      <p>{title}</p>
      <h3>{value}</h3>
    </div>
  );
}
