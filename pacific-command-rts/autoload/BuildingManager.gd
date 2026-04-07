extends Node

# BuildingManager - Singleton
# Tracks all buildings per player

var buildings_by_player: Array[Array] = [[], []]

signal building_destroyed(building, player_id: int)
signal command_center_destroyed(player_id: int)

func register_building(building: Node, player_id: int) -> void:
	buildings_by_player[player_id].append(building)

func unregister_building(building: Node, player_id: int) -> void:
	buildings_by_player[player_id].erase(building)
	building_destroyed.emit(building, player_id)
	
	# Check if command center was destroyed
	if building.building_type == "command_center":
		command_center_destroyed.emit(player_id)

func get_buildings(player_id: int) -> Array:
	return buildings_by_player[player_id]

func get_command_center(player_id: int) -> Node:
	for b in buildings_by_player[player_id]:
		if is_instance_valid(b) and b.building_type == "command_center":
			return b
	return null

func has_building_type(player_id: int, building_type: String) -> bool:
	for b in buildings_by_player[player_id]:
		if is_instance_valid(b) and b.building_type == building_type:
			return true
	return false

func reset_for_match() -> void:
	buildings_by_player = [[], []]
