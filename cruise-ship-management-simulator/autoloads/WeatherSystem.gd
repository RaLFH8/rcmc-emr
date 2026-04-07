extends Node
# WeatherSystem — weather state machine (Section 46)
# Milestone 1 stub: one manual state change to trigger seasickness.

enum WeatherState { CALM, MODERATE, ROUGH, STORM, HURRICANE }

var current_state: WeatherState = WeatherState.CALM
var current_beaufort: int = 1


func set_state(new_state: WeatherState) -> void:
	var old_state := current_state
	current_state = new_state
	current_beaufort = _state_to_beaufort(new_state)
	EventBus.weather_state_changed.emit(int(old_state), int(new_state))
	EventBus.beaufort_changed.emit(current_beaufort)


func trigger_storm() -> void:
	set_state(WeatherState.ROUGH)


func calm_down() -> void:
	set_state(WeatherState.CALM)


func _state_to_beaufort(state: WeatherState) -> int:
	match state:
		WeatherState.CALM: return 1
		WeatherState.MODERATE: return 4
		WeatherState.ROUGH: return 7
		WeatherState.STORM: return 10
		WeatherState.HURRICANE: return 12
	return 1
