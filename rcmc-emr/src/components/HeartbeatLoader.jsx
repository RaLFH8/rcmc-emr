export default function HeartbeatLoader({ message = "Loading..." }) {
  return (
    <div className="text-center">
      {/* ECG Heartbeat Line */}
      <div className="relative w-64 h-20 mx-auto mb-4 overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 500 100" preserveAspectRatio="xMidYMid meet">
          {/* ECG waveform with P wave, QRS complex, and T wave */}
          <polyline
            className="heartbeat-line"
            fill="none"
            stroke="#14b8a6"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points="0,50 40,50 45,48 50,52 55,50 65,50 70,45 75,50 80,30 85,70 90,50 95,48 100,50 110,50 115,52 120,48 125,50 180,50 185,48 190,52 195,50 205,50 210,45 215,50 220,30 225,70 230,50 235,48 240,50 250,50 255,52 260,48 265,50 320,50 325,48 330,52 335,50 345,50 350,45 355,50 360,30 365,70 370,50 375,48 380,50 390,50 395,52 400,48 405,50 500,50"
          />
        </svg>
      </div>
      <p className="text-slate-600 animate-pulse">{message}</p>
    </div>
  )
}
