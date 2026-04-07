extends Node3D
# BridgeController — throttle, rudder, autopilot (Section 75)
# Attached to ShipNode. Moves the ship through the world by updating
# GlobalCoordinateSystem.ship_world_pos each frame.
# ShipNode stays at Vector3.ZERO — the world moves around it.

# --- Ship stats (Classic Liner defaults, Section 48) ---
const MAX_SPEED_KNOTS: float = 18.0
const CRUISE_SPEED_KNOTS: float = 14.0
const TURN_RATE_DEG_PER_SEC: float = 2.0   # realistic large-ship turn rate
const THROTTLE_LAG_SEC: float = 10.0        # seconds to reach target speed

# --- State ---
var target_speed: float = 0.0    # knots, set by player or autopilot
var current_speed: float = 0.0   # knots, approaches target with lag
var heading: float = 0.0         # degrees 0–360, 0 = North

# --- Autopilot ---
var autopilot_active: bool = true
var waypoints: Array[Vector2] = []          # lat/lon waypoints
var current_waypoint_index: int = 0

# Knots to km/h conversion
const KNOTS_TO_KMH: float = 1.852
const KMH_TO_KM_PER_SEC: float = 1.0 / 3600.0


func _ready() -> void:
	# Default: cruise speed toward Nassau
	target_speed = CRUISE_SPEED_KNOTS
	heading = 90.0  # East (approximate Miami → Nassau bearing)


func _process(delta: float) -> void:
	_handle_input()
	_update_speed(delta)
	_update_heading(delta)
	_move_ship(delta)
	_update_autopilot()


func _handle_input() -> void:
	# Throttle
	if Input.is_action_pressed("ui_up"):
		target_speed = minf(target_speed + 1.0, MAX_SPEED_KNOTS)
	if Input.is_action_pressed("ui_down"):
		target_speed = maxf(target_speed - 1.0, 0.0)

	# Rudder (heading adjustment — only effective above 2 knots)
	if current_speed > 2.0:
		if Input.is_action_pressed("ui_left"):
			heading = fmod(heading - 1.0 + 360.0, 360.0)
		if Input.is_action_pressed("ui_right"):
			heading = fmod(heading + 1.0, 360.0)

	# Toggle autopilot
	if Input.is_action_just_pressed("ui_accept"):
		autopilot_active = !autopilot_active


func _update_speed(delta: float) -> void:
	# Realistic throttle lag — speed approaches target gradually
	var diff := target_speed - current_speed
	var max_change := (MAX_SPEED_KNOTS / THROTTLE_LAG_SEC) * delta
	current_speed += clampf(diff, -max_change, max_change)

	if absf(current_speed - _last_emitted_speed) > 0.1:
		EventBus.speed_changed.emit(current_speed)
		_last_emitted_speed = current_speed


func _update_heading(delta: float) -> void:
	if autopilot_active and not waypoints.is_empty():
		var target_wp := waypoints[current_waypoint_index]
		var desired_bearing := GlobalCoordinateSystem.initial_bearing(
			GlobalCoordinateSystem.ship_world_pos, target_wp
		)
		var diff := _angle_diff(heading, desired_bearing)
		var max_turn := TURN_RATE_DEG_PER_SEC * delta
		heading = fmod(heading + clampf(diff, -max_turn, max_turn) + 360.0, 360.0)

	EventBus.heading_changed.emit(heading)


func _move_ship(delta: float) -> void:
	if current_speed <= 0.0:
		return
	# Convert knots → km/s → advance world position
	var speed_km_per_sec := current_speed * KNOTS_TO_KMH * KMH_TO_KM_PER_SEC
	var distance_km := speed_km_per_sec * delta
	var new_pos := GlobalCoordinateSystem.advance_position(
		GlobalCoordinateSystem.ship_world_pos, heading, distance_km
	)
	GlobalCoordinateSystem.set_ship_position(new_pos)


func _update_autopilot() -> void:
	if not autopilot_active or waypoints.is_empty():
		return
	var target_wp := waypoints[current_waypoint_index]
	if GlobalCoordinateSystem.distance_to(target_wp) < 1.0:  # within 1 km
		current_waypoint_index += 1
		if current_waypoint_index >= waypoints.size():
			autopilot_active = false
			target_speed = 0.0
			EventBus.destination_reached.emit("destination")


func set_waypoints(new_waypoints: Array[Vector2]) -> void:
	waypoints = new_waypoints
	current_waypoint_index = 0
	autopilot_active = true
	EventBus.route_plotted.emit(new_waypoints)


func _angle_diff(from_deg: float, to_deg: float) -> float:
	var diff := fmod(to_deg - from_deg + 540.0, 360.0) - 180.0
	return diff


var _last_emitted_speed: float = 0.0
