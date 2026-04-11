import type { Stats } from '../types.js'

interface Props {
  stats: Stats | null
}

export function StatsBar({ stats }: Props) {
  const totalUsdc = stats?.totalUsdc ?? '0.000'
  const totalCalls = stats?.totalCalls ?? 0
  const services = stats?.services ?? {}
  const serviceNames = Object.keys(services)

  return (
    <div className="stats-bar">
      <div className="stat-card">
        <div className="stat-label">Total USDC Paid</div>
        <div className="stat-value green">{parseFloat(totalUsdc).toFixed(4)}</div>
        <div className="stat-sub">Stellar testnet</div>
      </div>

      <div className="stat-card">
        <div className="stat-label">API Calls</div>
        <div className="stat-value accent">{totalCalls.toLocaleString()}</div>
        <div className="stat-sub">all services</div>
      </div>

      {serviceNames.map((name) => {
        const svc = services[name]!
        return (
          <div className="stat-card" key={name}>
            <div className="stat-label">{name}</div>
            <div className="stat-value">{svc.calls.toLocaleString()}</div>
            <div className="stat-sub">{svc.usdc.toFixed(4)} USDC</div>
          </div>
        )
      })}

      {serviceNames.length === 0 && (
        <>
          <div className="stat-card">
            <div className="stat-label">Search</div>
            <div className="stat-value">—</div>
            <div className="stat-sub">0.01 USDC / call</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Finance</div>
            <div className="stat-value">—</div>
            <div className="stat-sub">0.001 USDC / call</div>
          </div>
        </>
      )}
    </div>
  )
}
