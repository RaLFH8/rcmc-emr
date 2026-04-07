extends Node3D
# InteriorLayer — dollhouse isometric view (Section 17.1, 79)
# Milestone 1: one deck with 3 zone types placed and rendered.

const CELL_SIZE: float = 1.0
const ZONE_HEIGHT: float = 0.15  # visual thickness of zone blocks

# Grid origin offset so grid is centered
var _grid_offset: Vector3


func _ready() -> void:
	var deck := DeckGridManager.get_deck(0)
	_grid_offset = Vector3(-deck.grid_width * 0.5, 0.0, -deck.grid_length * 0.5)

	_build_floor(deck)
	_place_starter_zones(deck)
	_build_grid_lines(deck)
	# Defer passenger spawn so PassengerManager is populated first
	call_deferred("_spawn_passengers")


func _build_floor(deck: DeckGrid) -> void:
	# Replace PlaceholderFloor MeshInstance with a StaticBody so agents don't fall through
	var old_mi := $DeckRoot/PlaceholderFloor as MeshInstance3D
	old_mi.queue_free()

	var static_body := StaticBody3D.new()
	static_body.name = "Floor"
	$DeckRoot.add_child(static_body)

	var mi := MeshInstance3D.new()
	var plane := PlaneMesh.new()
	plane.size = Vector2(deck.grid_width * CELL_SIZE, deck.grid_length * CELL_SIZE)
	mi.mesh = plane
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(0.85, 0.80, 0.72)
	mi.material_override = mat
	static_body.add_child(mi)

	var col := CollisionShape3D.new()
	var shape := BoxShape3D.new()
	shape.size = Vector3(deck.grid_width * CELL_SIZE, 0.1, deck.grid_length * CELL_SIZE)
	col.shape = shape
	col.position = Vector3(0.0, -0.05, 0.0)
	static_body.add_child(col)


func _place_starter_zones(deck: DeckGrid) -> void:
	# Cabin block: top section of deck (rows 2–9, cols 1–10)
	var cabin := ZoneData.make(ZoneData.ZoneType.CABIN, Vector2i(1, 2), Vector2i(10, 8))
	DeckGridManager.place_zone(0, cabin)
	_render_zone(cabin)

	# Restaurant: middle section (rows 12–17, cols 2–9)
	var restaurant := ZoneData.make(ZoneData.ZoneType.RESTAURANT, Vector2i(2, 12), Vector2i(8, 6))
	DeckGridManager.place_zone(0, restaurant)
	_render_zone(restaurant)

	# Lounge: lower section (rows 20–25, cols 2–9)
	var lounge := ZoneData.make(ZoneData.ZoneType.LOUNGE, Vector2i(2, 20), Vector2i(8, 6))
	DeckGridManager.place_zone(0, lounge)
	_render_zone(lounge)


func _render_zone(zone: ZoneData) -> void:
	var mi := MeshInstance3D.new()
	var box := BoxMesh.new()
	box.size = Vector3(
		zone.size_cells.x * CELL_SIZE,
		ZONE_HEIGHT,
		zone.size_cells.y * CELL_SIZE
	)
	mi.mesh = box

	var mat := StandardMaterial3D.new()
	mat.albedo_color = zone.get_color()
	mat.roughness = 0.8
	mi.material_override = mat

	# Position: center of zone in world space
	var cx := zone.origin_cell.x + zone.size_cells.x * 0.5
	var cz := zone.origin_cell.y + zone.size_cells.y * 0.5
	mi.position = _grid_offset + Vector3(cx, ZONE_HEIGHT * 0.5, cz)
	mi.name = zone.id

	$DeckRoot.add_child(mi)
	zone.mesh_instance = mi


func _build_grid_lines(deck: DeckGrid) -> void:
	var grid_node := Node3D.new()
	grid_node.name = "GridLines"
	$DeckRoot.add_child(grid_node)

	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(0.6, 0.55, 0.48, 0.5)
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA

	for i in range(deck.grid_length + 1):
		var z := _grid_offset.z + i * CELL_SIZE
		var line := MeshInstance3D.new()
		var box := BoxMesh.new()
		box.size = Vector3(deck.grid_width * CELL_SIZE, 0.01, 0.03)
		line.mesh = box
		line.material_override = mat
		line.position = Vector3(0.0, 0.01, z)
		grid_node.add_child(line)

	for i in range(deck.grid_width + 1):
		var x := _grid_offset.x + i * CELL_SIZE
		var line := MeshInstance3D.new()
		var box := BoxMesh.new()
		box.size = Vector3(0.03, 0.01, deck.grid_length * CELL_SIZE)
		line.mesh = box
		line.material_override = mat
		line.position = Vector3(x, 0.01, 0.0)
		grid_node.add_child(line)


func _spawn_passengers() -> void:
	var deck := DeckGridManager.get_deck(0)
	print("[InteriorLayer] Spawning %d passengers" % PassengerManager.all_passengers.size())

	for i in range(PassengerManager.all_passengers.size()):
		var p_data: PassengerData = PassengerManager.all_passengers[i]

		# Build agent node tree in code — no .tscn needed
		var agent := CharacterBody3D.new()
		agent.name = "Passenger_%d" % i
		agent.set_script(preload("res://scripts/systems/PassengerAgent.gd"))

		# Collision shape
		var col := CollisionShape3D.new()
		var shape := CapsuleShape3D.new()
		shape.radius = 0.2
		shape.height = 0.8
		col.shape = shape
		agent.add_child(col)

		# Mesh
		var mi := MeshInstance3D.new()
		mi.position = Vector3(0, 0.5, 0)
		var capsule := CapsuleMesh.new()
		capsule.radius = 0.2
		capsule.height = 0.8
		mi.mesh = capsule
		var mat := StandardMaterial3D.new()
		mat.albedo_color = _passenger_color(p_data.type)
		mi.material_override = mat
		agent.add_child(mi)

		# Spawn position: random spot on the cabin zone
		var spawn_x := randf_range(1.5, 10.5)
		var spawn_z := randf_range(2.5, 9.5)
		agent.position = _grid_offset + Vector3(spawn_x, 0.5, spawn_z)

		$DeckRoot.add_child(agent)

		# Link data AFTER adding to scene tree so _ready() can run
		agent.data = p_data
		# Trigger seek on first frame
		agent._idle_timer = 5.0


func _passenger_color(type: int) -> Color:
	match type:
		0: return Color(0.9, 0.5, 0.5)   # Budget — red
		1: return Color(0.5, 0.7, 0.9)   # Standard — blue
		2: return Color(0.9, 0.8, 0.3)   # Luxury — gold
		3: return Color(0.8, 0.4, 0.9)   # VIP — purple
	return Color.WHITE
