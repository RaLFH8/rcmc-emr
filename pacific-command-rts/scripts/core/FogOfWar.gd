extends Node2D
class_name FogOfWar

# Fog of War system with "last known position" memory (Improvement #1)

@export var player_id: int = 0
@export var tile_size: int = 64
@export var map_width: int = 40
@export var map_height: int = 40

# Visibility states per tile
enum TileVis { HIDDEN, LAST_KNOWN, VISIBLE }
var visibility_map: Array = []

# Last known positions of enemy units
var last_known_enemies: Dictionary = {}  # unit_id -> {position, unit_type, timestamp}

@onready var fog_canvas: ColorRect = $FogCanvas

func _ready() -> void:
	_init_visibility_map()

func _init_visibility_map() -> void:
	visibility_map.resize(map_width * map_height)
	visibility_map.fill(TileVis.HIDDEN)

func _process(_delta: float) -> void:
	_update_visibility()

func _update_visibility() -> void:
	# Reset all VISIBLE tiles to LAST_KNOWN (not HIDDEN - that's the memory feature)
	for i in visibility_map.size():
		if visibility_map[i] == TileVis.VISIBLE:
			visibility_map[i] = TileVis.LAST_KNOWN
	
	# Reveal tiles around friendly units
	for unit in UnitManager.get_units(player_id):
		if is_instance_valid(unit) and unit.is_alive():
			_reveal_around(unit.global_position, unit.vision_range)
	
	# Reveal tiles around friendly buildings
	for building in BuildingManager.get_buildings(player_id):
		if is_instance_valid(building) and not building.is_destroyed:
			_reveal_around(building.global_position, 200.0)
	
	# Track enemy last known positions
	for enemy in UnitManager.get_units(1 - player_id):
		if is_instance_valid(enemy) and enemy.is_alive():
			var tile = _world_to_tile(enemy.global_position)
			if _is_tile_visible(tile):
				last_known_enemies[enemy.get_instance_id()] = {
					"position": enemy.global_position,
					"unit_type": enemy.unit_id,
					"timestamp": Time.get_ticks_msec()
				}
			# If enemy leaves vision, their last known position stays in dictionary
	
	_redraw_fog()

func _reveal_around(world_pos: Vector2, radius: float) -> void:
	var center_tile = _world_to_tile(world_pos)
	var tile_radius = int(radius / tile_size) + 1
	
	for dx in range(-tile_radius, tile_radius + 1):
		for dy in range(-tile_radius, tile_radius + 1):
			var tx = center_tile.x + dx
			var ty = center_tile.y + dy
			if tx >= 0 and tx < map_width and ty >= 0 and ty < map_height:
				var tile_world = _tile_to_world(Vector2i(tx, ty))
				if world_pos.distance_to(tile_world) <= radius:
					visibility_map[ty * map_width + tx] = TileVis.VISIBLE

func _is_tile_visible(tile: Vector2i) -> bool:
	if tile.x < 0 or tile.x >= map_width or tile.y < 0 or tile.y >= map_height:
		return false
	return visibility_map[tile.y * map_width + tile.x] == TileVis.VISIBLE

func is_position_visible(world_pos: Vector2) -> bool:
	return _is_tile_visible(_world_to_tile(world_pos))

func _world_to_tile(world_pos: Vector2) -> Vector2i:
	return Vector2i(int(world_pos.x / tile_size), int(world_pos.y / tile_size))

func _tile_to_world(tile: Vector2i) -> Vector2:
	return Vector2(tile.x * tile_size + tile_size / 2, tile.y * tile_size + tile_size / 2)

func _redraw_fog() -> void:
	# Trigger canvas redraw - actual drawing done in FogCanvas
	if fog_canvas:
		fog_canvas.queue_redraw()

func get_last_known_enemies() -> Dictionary:
	return last_known_enemies
