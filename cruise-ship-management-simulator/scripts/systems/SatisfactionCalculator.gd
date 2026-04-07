extends Node
# SatisfactionCalculator — win/lose condition for MVP (Section 15)
# Win: arrive at Nassau with avg satisfaction >= 60%
# Lose: satisfaction drops below 20% at any point

const WIN_THRESHOLD: float = 0.60
const LOSE_THRESHOLD: float = 0.20

var _game_over: bool = false


func _ready() -> void:
	EventBus.avg_satisfaction_changed.connect(_on_satisfaction_changed)
	EventBus.destination_reached.connect(_on_destination_reached)


func _on_satisfaction_changed(avg: float) -> void:
	if _game_over:
		return
	if avg < LOSE_THRESHOLD:
		_game_over = true
		_show_result(false, avg)


func _on_destination_reached(_port_id: String) -> void:
	if _game_over:
		return
	_game_over = true
	_show_result(PassengerManager.avg_satisfaction >= WIN_THRESHOLD,
				 PassengerManager.avg_satisfaction)


func _show_result(won: bool, satisfaction: float) -> void:
	var result := "WIN" if won else "LOSE"
	var pct := int(satisfaction * 100)
	print("=" .repeat(40))
	print("[SatisfactionCalculator] VOYAGE RESULT: %s" % result)
	print("[SatisfactionCalculator] Final satisfaction: %d%%" % pct)
	if won:
		print("[SatisfactionCalculator] Passengers are happy. Well done, Captain!")
	else:
		print("[SatisfactionCalculator] Too many unhappy passengers. Voyage failed.")
	print("=" .repeat(40))
	EventBus.hud_alert.emit("Voyage %s — Satisfaction: %d%%" % [result, pct],
							"info" if won else "alert")
