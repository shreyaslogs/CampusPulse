function StatCard({ label, value, description }) {
  return (
    <article className="stat-card">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      <span className="stat-description">{description}</span>
    </article>
  )
}

export default StatCard