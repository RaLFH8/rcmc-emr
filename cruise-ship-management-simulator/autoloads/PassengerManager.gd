extends Node
# PassengerManager — passenger agent pool, needs ticks (Section 17.2)
# Milestone 1 stub: manages 30 passengers with 3 needs.

var all_passengers: Array = []
var avg_satisfaction: float = 1.0


func _ready() -> void:
	EventBus.hour_changed.connect(_on_hour_changed)
	EventBus.beaufort_changed.connect(_on_beaufort_changed)


func _on_hour_changed(_hour: int) -> void:
	_tick_all(1.0)
	_recalculate_avg()


func _on_beaufort_changed(level: int) -> void:
	var rate := _seasick_rate(level)
	for p in all_passengers:
		p.seasickness = clampf(p.seasickness - rate, 0.0, 1.0)


func _tick_all(delta_hours: float) -> void:
	for p in all_passengers:
		p.tick(delta_hours)


func _recalculate_avg() -> void:
	if all_passengers.is_empty():
		avg_satisfaction = 1.0
		return
	var total := 0.0
	for p in all_passengers:
		total += p.satisfaction
	avg_satisfaction = total / all_passengers.size()
	EventBus.avg_satisfaction_changed.emit(avg_satisfaction)


func _seasick_rate(beaufort: int) -> float:
	var table := [0.0, 0.0, 0.0, 0.01, 0.01, 0.03, 0.03, 0.07, 0.07, 0.12, 0.12, 0.20, 0.20]
	return table[clampi(beaufort, 0, 12)]
