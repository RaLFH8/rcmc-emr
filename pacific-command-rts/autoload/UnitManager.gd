extends Node

# UnitManager - Singleton
# Tracks all active units per player, handles selection

var units_by_player: Array[Array] = [[], []]  # [player_0_units, player_1_units]
var selected_units: Array = []

const MAX_UNITS_PER_SCENE: int = 150  # Object pool budget cap

signal unit_selected(unit)
signal selection_cleared()
signal unit_died(unit)

func register_unit(unit: Node, player_id: int) -> void:
	if units_by_player[player_id].size() < MAX_UNITS_PER_SCENE:
		units_by_player[player_id].append(unit)

func unregister_unit(unit: Node, player_id: int) -> void:
	units_by_player[player_id].erase(unit)
	selected_units.erase(unit)
	unit_died.emit(unit)

func get_units(player_id: int) -> Array:
	return units_by_player[player_id]

func get_all_units() -> Array:
	return units_by_player[0] + units_by_player[1]

func select_unit(unit: Node) -> void:
	clear_selection()
	selected_units.append(unit)
	unit.set_selected(true)
	unit_selected.emit(unit)

func add_to_selection(unit: Node) -> void:
	if unit not in selected_units:
		selected_units.append(unit)
		unit.set_selected(true)

func clear_selection() -> void:
	for u in selected_units:
		if is_instance_valid(u):
			u.set_selected(false)
	selected_units.clear()
	selection_cleared.emit()

func select_units_in_rect(rect: Rect2, player_id: int) -> void:
	clear_selection()
	for unit in units_by_player[player_id]:
		if is_instance_valid(unit):
			var screen_pos = unit.get_viewport().get_camera_2d().unproject_position(unit.global_position) if unit.get_viewport().get_camera_2d() else unit.global_position
			# Use world position rect check
			if rect.has_point(unit.global_position):
				add_to_selection(unit)

func get_nearest_enemy(position: Vector2, player_id: int, max_range: float = INF) -> Node:
	var enemy_player = 1 - player_id
	var nearest: Node = null
	var nearest_dist: float = max_range
	for unit in units_by_player[enemy_player]:
		if is_instance_valid(unit) and unit.is_alive():
			var dist = position.distance_to(unit.global_position)
			if dist < nearest_dist:
				nearest_dist = dist
				nearest = unit
	return nearest

func reset_for_match() -> void:
	units_by_player = [[], []]
	selected_units.clear()
