extends Node

# Supply cap system
# Starting 50, max 200, buildings add +10

const BASE_SUPPLY: int = 50
const MAX_SUPPLY: int = 200
const SUPPLY_PER_BUILDING: int = 10

var supply_cap: Array[int] = [BASE_SUPPLY, BASE_SUPPLY]
var supply_used: Array[int] = [0, 0]

signal supply_changed(player_id: int, used: int, cap: int)

func add_supply_cap(player_id: int, amount: int = SUPPLY_PER_BUILDING) -> void:
	supply_cap[player_id] = min(supply_cap[player_id] + amount, MAX_SUPPLY)
	supply_changed.emit(player_id, supply_used[player_id], supply_cap[player_id])

func remove_supply_cap(player_id: int, amount: int = SUPPLY_PER_BUILDING) -> void:
	supply_cap[player_id] = max(BASE_SUPPLY, supply_cap[player_id] - amount)
	supply_changed.emit(player_id, supply_used[player_id], supply_cap[player_id])

func use_supply(player_id: int, amount: int) -> bool:
	if supply_used[player_id] + amount > supply_cap[player_id]:
		return false
	supply_used[player_id] += amount
	supply_changed.emit(player_id, supply_used[player_id], supply_cap[player_id])
	return true

func free_supply(player_id: int, amount: int) -> void:
	supply_used[player_id] = max(0, supply_used[player_id] - amount)
	supply_changed.emit(player_id, supply_used[player_id], supply_cap[player_id])

func can_train(player_id: int, supply_cost: int) -> bool:
	return supply_used[player_id] + supply_cost <= supply_cap[player_id]

func reset_for_match() -> void:
	supply_cap = [BASE_SUPPLY, BASE_SUPPLY]
	supply_used = [0, 0]
