export default function HeartbeatLoader({ message = "Loading..." }) {
  return (
    <div className="text-center">
      {/* Heartbeat Line */}
      <div className="relative w-48 h-16 mx-auto mb-4">
        <svg className="w-full h-full" viewBox="0 0 400 100" preserveAspectRatio="xMidYMid meet">
          <polyline
            className="heartbeat-line"
            fill="none"
            stroke="#14b8a6"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            points="0,50 80,50 85,50 90,10 95,90 100,50 105,50 400,50"
          />
        </svg>
      </div>
      <p className="text-slate-600">{message}</p>
    </div>
  )
}
