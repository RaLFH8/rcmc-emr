extends CharacterBody3D
class_name PassengerAgent
# PassengerAgent — PHYSICAL mode passenger (Section 76)
# Milestone 1: 3 needs (hunger, fatigue, seasickness), direct movement to zones.
# No NavigationAgent3D yet — straight-line movement only.

enum AgentState { IDLE, MOVING, IN_ZONE, SICK }

var data: PassengerData = null
var state: AgentState = AgentState.IDLE

var _target_position: Vector3 = Vector3.ZERO
var _time_in_zone: float = 0.0
var _idle_timer: float = 0.0

const MOVE_SPEED: float = 1.2       # m/s (walking pace)
const ZONE_STAY_MIN: float = 30.0   # seconds in zone before re-evaluating
const IDLE_WAIT: float = 5.0        # seconds idle before seeking a zone
const SICK_THRESHOLD: float = 0.3   # seasickness below this = SICK state


func _ready() -> void:
	# Small random offset so agents don't all stack
	position += Vector3(randf_range(-0.3, 0.3), 0.0, randf_range(-0.3, 0.3))


func _physics_process(delta: float) -> void:
	if data == null:
		return

	_update_state(delta)
	_move(delta)


func _update_state(delta: float) -> void:
	match state:
		AgentState.IDLE:
			_idle_timer += delta
			if _idle_timer >= IDLE_WAIT:
				_idle_timer = 0.0
				_seek_zone()

		AgentState.MOVING:
			if position.distance_to(_target_position) < 0.5:
				state = AgentState.IN_ZONE
				_time_in_zone = 0.0

		AgentState.IN_ZONE:
			_time_in_zone += delta
			if _time_in_zone >= ZONE_STAY_MIN:
				state = AgentState.IDLE

		AgentState.SICK:
			if data.seasickness >= 0.5:
				state = AgentState.IDLE
			_update_color()
			return

	# Override: go sick if seasickness critical
	if data != null and data.seasickness < SICK_THRESHOLD and state != AgentState.SICK:
		state = AgentState.SICK

	_update_color()


func _update_color() -> void:
	var mi := get_node_or_null("MeshInstance3D") as MeshInstance3D
	if mi == null:
		return
	var mat := mi.material_override as StandardMaterial3D
	if mat == null:
		return
	if state == AgentState.SICK:
		mat.albedo_color = Color(0.7, 0.7, 0.7)  # grey when sick
	else:
		# Restore type color
		match data.type:
			0: mat.albedo_color = Color(0.9, 0.5, 0.5)
			1: mat.albedo_color = Color(0.5, 0.7, 0.9)
			2: mat.albedo_color = Color(0.9, 0.8, 0.3)
			3: mat.albedo_color = Color(0.8, 0.4, 0.9)


func _seek_zone() -> void:
	# Find most critical need and move to matching zone
	var target_type := _get_target_zone_type()
	var zones := DeckGridManager.get_zones_by_type(target_type)
	if zones.is_empty():
		return

	# Pick a random zone of that type
	var zone: ZoneData = zones[randi() % zones.size()]
	var deck := DeckGridManager.get_deck(0)
	var grid_offset := Vector3(-deck.grid_width * 0.5, 0.0, -deck.grid_length * 0.5)

	# Target = center of zone
	var cx := zone.origin_cell.x + zone.size_cells.x * 0.5
	var cz := zone.origin_cell.y + zone.size_cells.y * 0.5
	_target_position = grid_offset + Vector3(cx, 0.0, cz)
	state = AgentState.MOVING


func _get_target_zone_type() -> ZoneData.ZoneType:
	if data.hunger < data.fatigue and data.hunger < data.seasickness:
		return ZoneData.ZoneType.RESTAURANT
	elif data.fatigue < data.hunger and data.fatigue < data.seasickness:
		return ZoneData.ZoneType.CABIN
	else:
		return ZoneData.ZoneType.LOUNGE


func _move(delta: float) -> void:
	if state != AgentState.MOVING:
		velocity = Vector3.ZERO
		move_and_slide()
		return

	var dir := (_target_position - position)
	dir.y = 0.0
	if dir.length() > 0.1:
		dir = dir.normalized()
		velocity = dir * MOVE_SPEED
	else:
		velocity = Vector3.ZERO
	move_and_slide()
