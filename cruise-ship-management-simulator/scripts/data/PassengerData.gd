class_name PassengerData
extends RefCounted
# PassengerData — per-passenger resource ticked every in-game hour (Section 17.2)
# Milestone 1: 3 needs (hunger, fatigue, seasickness)

var id: int = 0
var passenger_name: String = ""
var type: int = 1  # 0=Budget, 1=Standard, 2=Luxury, 3=VIP

# === NEEDS (0.0 = critical, 1.0 = fully satisfied) ===
var hunger: float = 1.0
var fun: float = 1.0
var fatigue: float = 1.0
var seasickness: float = 1.0
var comfort: float = 1.0

# Decay rates per in-game hour
const HUNGER_DECAY: float = 0.08
const FUN_DECAY: float = 0.05
const FATIGUE_DECAY: float = 0.04
const COMFORT_DECAY: float = 0.02
# seasickness driven externally by WeatherSystem

var satisfaction: float:
	get: return (hunger + fun + fatigue + seasickness + comfort) / 5.0

# Loyalty
var voyages_completed: int = 0
var loyalty_tier: int = 0  # 0=None, 1=Silver, 2=Gold, 3=Platinum
var total_spent: float = 0.0
var home_port: String = ""
var preferred_cabin_type: int = 0

# Social group
var group_id: int = -1
var group_type: String = "solo"

# Spending budget (set at voyage start)
var spending_budget: float = 0.0


func tick(delta_hours: float) -> void:
	hunger   = clampf(hunger   - HUNGER_DECAY   * delta_hours, 0.0, 1.0)
	fun      = clampf(fun      - FUN_DECAY      * delta_hours, 0.0, 1.0)
	fatigue  = clampf(fatigue  - FATIGUE_DECAY  * delta_hours, 0.0, 1.0)
	comfort  = clampf(comfort  - COMFORT_DECAY  * delta_hours, 0.0, 1.0)
	# seasickness set externally by PassengerManager via WeatherSystem signal
