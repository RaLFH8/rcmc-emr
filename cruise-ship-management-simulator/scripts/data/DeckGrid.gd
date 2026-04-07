class_name DeckGrid
extends RefCounted
# DeckGrid — 2D grid for one ship deck (Section 17.2, 114)
# Each cell is 1m x 1m. Cell states: EMPTY, OCCUPIED, WALKWAY, STRUCTURAL.

enum CellState { EMPTY, OCCUPIED, WALKWAY, STRUCTURAL }

var deck_index: int = 0
var grid_width: int = 12   # Classic Liner: 12m wide
var grid_length: int = 40  # Classic Liner: 40m long
var zones: Array[ZoneData] = []

var _cells: Array = []  # 2D array [x][z] of CellState


func _init(width: int = 12, length: int = 40) -> void:
	grid_width = width
	grid_length = length
	_cells.resize(width)
	for x in range(width):
		_cells[x] = []
		_cells[x].resize(length)
		for z in range(length):
			_cells[x][z] = CellState.EMPTY


func get_cell(x: int, z: int) -> CellState:
	if x < 0 or x >= grid_width or z < 0 or z >= grid_length:
		return CellState.STRUCTURAL
	return _cells[x][z]


func place_zone(zone: ZoneData) -> bool:
	# Validate all target cells are EMPTY
	for dx in range(zone.size_cells.x):
		for dz in range(zone.size_cells.y):
			var cx := zone.origin_cell.x + dx
			var cz := zone.origin_cell.y + dz
			if get_cell(cx, cz) != CellState.EMPTY:
				return false

	# Mark cells OCCUPIED
	for dx in range(zone.size_cells.x):
		for dz in range(zone.size_cells.y):
			_cells[zone.origin_cell.x + dx][zone.origin_cell.y + dz] = CellState.OCCUPIED

	# Mark 1-cell walkway border (if within bounds)
	_mark_walkways(zone)

	zones.append(zone)
	return true


func _mark_walkways(zone: ZoneData) -> void:
	for dx in range(-1, zone.size_cells.x + 1):
		for dz in range(-1, zone.size_cells.y + 1):
			var cx := zone.origin_cell.x + dx
			var cz := zone.origin_cell.y + dz
			if cx >= 0 and cx < grid_width and cz >= 0 and cz < grid_length:
				if _cells[cx][cz] == CellState.EMPTY:
					_cells[cx][cz] = CellState.WALKWAY


func get_zones_by_type(type: ZoneData.ZoneType) -> Array[ZoneData]:
	var result: Array[ZoneData] = []
	for z in zones:
		if z.zone_type == type:
			result.append(z)
	return result
