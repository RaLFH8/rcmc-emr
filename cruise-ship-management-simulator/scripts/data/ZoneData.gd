class_name ZoneData
extends RefCounted
# ZoneData — a zone placed on the deck grid (Section 17.2)

enum ZoneType { CABIN, RESTAURANT, LOUNGE }

var id: String = ""
var zone_type: ZoneType = ZoneType.CABIN
var origin_cell: Vector2i = Vector2i.ZERO  # top-left cell on the grid
var size_cells: Vector2i = Vector2i(2, 2)  # width x height in grid cells
var capacity: int = 4
var condition: float = 1.0   # 0.0–1.0
var current_occupants: int = 0

# Visual node in the scene (set when placed)
var mesh_instance: MeshInstance3D = null


static func make(type: ZoneType, origin: Vector2i, size: Vector2i) -> ZoneData:
	var z := ZoneData.new()
	z.zone_type = type
	z.origin_cell = origin
	z.size_cells = size
	z.id = "%s_%d_%d" % [ZoneType.keys()[type], origin.x, origin.y]
	z.capacity = size.x * size.y * 2
	return z


func get_color() -> Color:
	match zone_type:
		ZoneType.CABIN:     return Color(0.53, 0.73, 0.87)  # soft blue
		ZoneType.RESTAURANT: return Color(0.95, 0.77, 0.46) # warm amber
		ZoneType.LOUNGE:    return Color(0.60, 0.85, 0.65)  # soft green
	return Color.WHITE
