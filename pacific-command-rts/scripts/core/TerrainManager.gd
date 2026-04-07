extends Node
class_name TerrainManager

# Terrain system — 5 terrain types, 64x64 tiles
# Improvement #2: Elevation system (high/low ground)

# Terrain type IDs (match TileSet layer 0 source IDs)
const TERRAIN_OPEN     = 0
const TERRAIN_JUNGLE   = 1
const TERRAIN_ROAD     = 2
const TERRAIN_WATER    = 3
const TERRAIN_BEACH    = 4

# Elevation layer IDs (TileSet layer 1)
const ELEV_LOW  = 0
const ELEV_HIGH = 1

# Movement speed multipliers per terrain type per unit class
# Keys: terrain_id -> { armor_type -> multiplier }
const MOVE_MODIFIERS: Dictionary = {
	TERRAIN_OPEN:   { "infantry": 1.0, "light_armor": 1.0, "heavy_armor": 0.9, "air": 1.0 },
	TERRAIN_JUNGLE: { "infantry": 0.7, "light_armor": 0.5, "heavy_armor": 0.3, "air": 1.0 },
	TERRAIN_ROAD:   { "infantry": 1.2, "light_armor": 1.3, "heavy_armor": 1.1, "air": 1.0 },
	TERRAIN_WATER:  { "infantry": 0.0, "light_armor": 0.0, "heavy_armor": 0.0, "air": 1.0 },
	TERRAIN_BEACH:  { "infantry": 0.8, "light_armor": 0.7, "heavy_armor": 0.5, "air": 1.0 },
}

# Elevation bonuses (Improvement #2)
# High ground: +15% range, +10% damage
const HIGH_GROUND_RANGE_BONUS: float  = 0.15
const HIGH_GROUND_DAMAGE_BONUS: float = 0.10

var tilemap: TileMap = null

func _ready() -> void:
	pass

func setup(tm: TileMap) -> void:
	tilemap = tm

func get_terrain_at(world_pos: Vector2) -> int:
	if not tilemap:
		return TERRAIN_OPEN
	var cell = tilemap.local_to_map(tilemap.to_local(world_pos))
	var tile_data = tilemap.get_cell_tile_data(0, cell)
	if not tile_data:
		return TERRAIN_OPEN
	return tile_data.get_custom_data("terrain_type") if tile_data.has_custom_data("terrain_type") else TERRAIN_OPEN

func get_elevation_at(world_pos: Vector2) -> int:
	if not tilemap:
		return ELEV_LOW
	var cell = tilemap.local_to_map(tilemap.to_local(world_pos))
	var tile_data = tilemap.get_cell_tile_data(1, cell)
	if not tile_data:
		return ELEV_LOW
	return tile_data.get_custom_data("elevation") if tile_data.has_custom_data("elevation") else ELEV_LOW

func get_move_modifier(world_pos: Vector2, armor_type: String) -> float:
	var terrain = get_terrain_at(world_pos)
	if MOVE_MODIFIERS.has(terrain):
		var terrain_mods = MOVE_MODIFIERS[terrain]
		return terrain_mods.get(armor_type, 1.0)
	return 1.0

func is_passable(world_pos: Vector2, armor_type: String) -> bool:
	return get_move_modifier(world_pos, armor_type) > 0.0

func get_range_multiplier(attacker_pos: Vector2, target_pos: Vector2) -> float:
	# High ground advantage: attacker on high ground vs target on low ground
	var attacker_elev = get_elevation_at(attacker_pos)
	var target_elev   = get_elevation_at(target_pos)
	if attacker_elev == ELEV_HIGH and target_elev == ELEV_LOW:
		return 1.0 + HIGH_GROUND_RANGE_BONUS
	return 1.0

func get_damage_multiplier(attacker_pos: Vector2, target_pos: Vector2) -> float:
	var attacker_elev = get_elevation_at(attacker_pos)
	var target_elev   = get_elevation_at(target_pos)
	if attacker_elev == ELEV_HIGH and target_elev == ELEV_LOW:
		return 1.0 + HIGH_GROUND_DAMAGE_BONUS
	return 1.0

func get_terrain_name(terrain_id: int) -> String:
	match terrain_id:
		TERRAIN_OPEN:   return "Open"
		TERRAIN_JUNGLE: return "Jungle"
		TERRAIN_ROAD:   return "Road"
		TERRAIN_WATER:  return "Water"
		TERRAIN_BEACH:  return "Beach"
	return "Unknown"

func is_coastal(world_pos: Vector2) -> bool:
	var terrain = get_terrain_at(world_pos)
	return terrain == TERRAIN_BEACH or terrain == TERRAIN_WATER
