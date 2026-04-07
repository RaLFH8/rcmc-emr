extends Node
# WorldClock — simulation heartbeat (Section 62)
# All time-dependent systems subscribe to EventBus time signals.
# Port phase pauses the clock; navigation runs it.

var current_hour: int = 6    # 0–23
var current_day: int = 1     # 1–30
var current_month: int = 1   # 1–12
var current_year: int = 1    # game year

var time_scale: float = 1.0  # set by player speed setting
var running: bool = false     # false during port phase and docking

# Real seconds per in-game hour at 1× speed
const REAL_SECONDS_PER_GAME_HOUR: float = 60.0

var _accumulated: float = 0.0

# Time-of-day period strings
const PERIOD_MORNING: String = "morning"     # 06–12
const PERIOD_AFTERNOON: String = "afternoon" # 12–18
const PERIOD_EVENING: String = "evening"     # 18–23
const PERIOD_NIGHT: String = "night"         # 23–06

var _last_period: String = PERIOD_MORNING


func _process(delta: float) -> void:
	if not running:
		return
	_accumulated += delta * time_scale
	var seconds_per_hour := REAL_SECONDS_PER_GAME_HOUR
	while _accumulated >= seconds_per_hour:
		_accumulated -= seconds_per_hour
		_advance_hour()


func _advance_hour() -> void:
	current_hour += 1
	if current_hour >= 24:
		current_hour = 0
		_advance_day()
	EventBus.hour_changed.emit(current_hour)
	_check_time_of_day()


func _advance_day() -> void:
	current_day += 1
	if current_day > 30:
		current_day = 1
		_advance_month()
	EventBus.day_changed.emit(current_day)


func _advance_month() -> void:
	current_month += 1
	if current_month > 12:
		current_month = 1
		_advance_year()
	EventBus.month_changed.emit(current_month)


func _advance_year() -> void:
	current_year += 1
	EventBus.year_changed.emit(current_year)


func _check_time_of_day() -> void:
	var period := get_time_period()
	if period != _last_period:
		_last_period = period
		EventBus.time_of_day_changed.emit(period)


func get_time_period() -> String:
	if current_hour >= 6 and current_hour < 12:
		return PERIOD_MORNING
	elif current_hour >= 12 and current_hour < 18:
		return PERIOD_AFTERNOON
	elif current_hour >= 18 and current_hour < 23:
		return PERIOD_EVENING
	else:
		return PERIOD_NIGHT


func start() -> void:
	running = true


func stop() -> void:
	running = false


func set_speed(scale: float) -> void:
	# Valid: 0.5, 1.0, 2.0, 4.0
	time_scale = clampf(scale, 0.5, 4.0)


func get_datetime_string() -> String:
	return "Day %d, Month %d, Year %d — %02d:00" % [current_day, current_month, current_year, current_hour]
