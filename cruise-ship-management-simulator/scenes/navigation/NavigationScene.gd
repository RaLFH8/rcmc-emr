extends Node3D
# NavigationScene — root scene for Milestone 1 (Section 117)
# Bootstraps the MVP: ship at origin, ocean plane, 30 passengers, one storm event.

const PASSENGER_COUNT := 30
const VOYAGE_DURATION_HOURS := 18  # Miami → Nassau

var _voyage_hours_elapsed: float = 0.0
var _storm_fired: bool = false


func _ready() -> void:
	_spawn_passengers()
	_setup_ocean()
	_setup_route()
	WorldClock.start()
	EventBus.hour_changed.connect(_on_hour_changed)
	print("[NavigationScene] Voyage started. %d passengers aboard." % PASSENGER_COUNT)
	print("[NavigationScene] Destination: Nassau (~%d hrs)" % VOYAGE_DURATION_HOURS)


func _setup_route() -> void:
	var bridge := $ShipNode/BridgeController as Node3D
	if bridge:
		var nassau := Vector2(25.0480, -77.3554)
		var waypoints: Array[Vector2] = [nassau]
		bridge.set_waypoints(waypoints)
		bridge.target_speed = 14.0  # cruise speed


func _spawn_passengers() -> void:
	for i in range(PASSENGER_COUNT):
		var p := PassengerData.new()
		p.id = i
		p.passenger_name = "Passenger %d" % i
		p.type = randi() % 2  # Budget or Standard for MVP
		PassengerManager.all_passengers.append(p)


func _setup_ocean() -> void:
	# Milestone 1: flat blue plane, no shader yet
	var mesh_instance := $OceanPlane as MeshInstance3D
	var plane := PlaneMesh.new()
	plane.size = Vector2(2000.0, 2000.0)
	mesh_instance.mesh = plane
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(0.1, 0.4, 0.6)
	mesh_instance.material_override = mat


func _on_hour_changed(hour: int) -> void:
	_voyage_hours_elapsed += 1.0

	# Fire storm at hour 8 of the voyage (MVP event)
	if not _storm_fired and _voyage_hours_elapsed >= 8.0:
		_storm_fired = true
		WeatherSystem.trigger_storm()
		EventBus.at_sea_event_fired.emit("storm_warning")
		print("[NavigationScene] Storm event fired! Beaufort: %d" % WeatherSystem.current_beaufort)

	# Calm down after 3 hours
	if _storm_fired and _voyage_hours_elapsed >= 11.0 and WeatherSystem.current_state != WeatherSystem.WeatherState.CALM:
		WeatherSystem.calm_down()
		print("[NavigationScene] Storm passed.")

	# Arrive at Nassau
	if _voyage_hours_elapsed >= VOYAGE_DURATION_HOURS:
		_arrive_at_destination()

	# Debug: print avg satisfaction every 6 hours
	if int(_voyage_hours_elapsed) % 6 == 0:
		print("[NavigationScene] Hour %d — Avg satisfaction: %.2f" % [
			int(_voyage_hours_elapsed),
			PassengerManager.avg_satisfaction
		])


func _arrive_at_destination() -> void:
	WorldClock.stop()
	EventBus.destination_reached.emit("nassau")
	print("[NavigationScene] Arrived at Nassau!")
