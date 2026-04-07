extends Node

# ResourceManager - Singleton
# Tracks Credits, Fuel, Manpower per player
# Player 0 = human, Player 1 = AI

const MAX_PLAYERS: int = 2

var credits: Array[float] = [500.0, 500.0]
var fuel: Array[float] = [200.0, 200.0]
var manpower: Array[float] = [100.0, 100.0]

var credits_rate: Array[float] = [0.0, 0.0]   # per second from buildings
var manpower_rate: Array[float] = [5.0, 5.0]   # base regen per second

const MAX_CREDITS: float = 9999.0
const MAX_FUEL: float = 9999.0
const MAX_MANPOWER: float = 200.0

signal resources_changed(player_id: int)

func _ready() -> void:
	set_process(true)

func _process(delta: float) -> void:
	for i in MAX_PLAYERS:
		# Credits tick from refineries (set via add_credits_rate)
		credits[i] = minf(credits[i] + credits_rate[i] * delta * GameManager.game_speed, MAX_CREDITS)
		# Manpower regenerates passively
		manpower[i] = minf(manpower[i] + manpower_rate[i] * delta * GameManager.game_speed, MAX_MANPOWER)
		resources_changed.emit(i)

func can_afford(player_id: int, cost_credits: float, cost_fuel: float, cost_manpower: float) -> bool:
	return credits[player_id] >= cost_credits and \
		   fuel[player_id] >= cost_fuel and \
		   manpower[player_id] >= cost_manpower

func spend(player_id: int, cost_credits: float, cost_fuel: float, cost_manpower: float) -> bool:
	if not can_afford(player_id, cost_credits, cost_fuel, cost_manpower):
		return false
	credits[player_id] -= cost_credits
	fuel[player_id] -= cost_fuel
	manpower[player_id] -= cost_manpower
	resources_changed.emit(player_id)
	return true

func add_credits(player_id: int, amount: float) -> void:
	credits[player_id] = minf(credits[player_id] + amount, MAX_CREDITS)
	resources_changed.emit(player_id)

func add_fuel(player_id: int, amount: float) -> void:
	fuel[player_id] = minf(fuel[player_id] + amount, MAX_FUEL)
	resources_changed.emit(player_id)

func add_credits_rate(player_id: int, rate: float) -> void:
	credits_rate[player_id] += rate

func remove_credits_rate(player_id: int, rate: float) -> void:
	credits_rate[player_id] = maxf(0.0, credits_rate[player_id] - rate)

func reset_for_match() -> void:
	for i in MAX_PLAYERS:
		credits[i] = 500.0
		fuel[i] = 200.0
		manpower[i] = 100.0
		credits_rate[i] = 0.0
		manpower_rate[i] = 5.0
