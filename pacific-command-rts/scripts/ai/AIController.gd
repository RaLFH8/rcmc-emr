extends Node
class_name AIController

# AI Controller - runs decision loop for AI player
# Difficulty affects decision interval and aggression

@export var player_id: int = 1
@export var difficulty: int = 1  # 0=Easy, 1=Normal, 2=Hard

# Decision loop timing (from AGENT_CONTEXT.md)
const DECISION_INTERVALS: Array[float] = [1.5, 0.8, 0.4]

var decision_timer: float = 0.0
var phase: String = "build"  # build, expand, attack

# Unit data cache
var unit_data_cache: Dictionary = {}

func _ready() -> void:
	decision_timer = DECISION_INTERVALS[difficulty]
	_load_unit_data()

func _process(delta: float) -> void:
	if GameManager.current_state != GameManager.GameState.IN_GAME:
		return
	
	decision_timer -= delta * GameManager.game_speed
	if decision_timer <= 0.0:
		_make_decision()
		decision_timer = DECISION_INTERVALS[difficulty]

func _make_decision() -> void:
	var my_buildings = BuildingManager.get_buildings(player_id)
	var my_units = UnitManager.get_units(player_id)
	var resources = {
		"credits": ResourceManager.credits[player_id],
		"fuel": ResourceManager.fuel[player_id],
		"manpower": ResourceManager.manpower[player_id]
	}
	
	# Phase logic
	match phase:
		"build":
			_phase_build(my_buildings, resources)
		"expand":
			_phase_expand(my_buildings, my_units, resources)
		"attack":
			_phase_attack(my_units)
	
	# Phase transitions
	if my_units.size() >= 5 and phase == "build":
		phase = "expand"
	if my_units.size() >= 10:
		phase = "attack"

func _phase_build(buildings: Array, resources: Dictionary) -> void:
	# Priority: Command Center -> Barracks -> Refinery -> War Factory
	var has_barracks = BuildingManager.has_building_type(player_id, "barracks")
	var has_refinery = BuildingManager.has_building_type(player_id, "refinery")
	
	if has_barracks:
		# Train riflemen
		_try_train_unit("rifleman")
	
	if resources["credits"] >= 200 and not has_refinery:
		# Signal to place refinery (handled by game scene)
		pass

func _phase_expand(buildings: Array, units: Array, resources: Dictionary) -> void:
	_phase_build(buildings, resources)
	
	# Also train anti-tank
	if resources["credits"] >= 125:
		_try_train_unit("anti_tank")

func _phase_attack(units: Array) -> void:
	# Order all units to attack enemy command center
	var enemy_cc = BuildingManager.get_command_center(1 - player_id)
	if not enemy_cc:
		return
	
	for unit in units:
		if is_instance_valid(unit) and unit.is_alive():
			if unit.state == unit.UnitState.IDLE:
				unit.move_to(enemy_cc.global_position)

func _try_train_unit(unit_id: String) -> void:
	var data = unit_data_cache.get(unit_id, {})
	if data.is_empty():
		return
	
	# Find appropriate building
	var train_from = data.get("train_from", "barracks")
	for building in BuildingManager.get_buildings(player_id):
		if is_instance_valid(building) and building.building_type == train_from:
			building.queue_unit(unit_id, data)
			break

func _load_unit_data() -> void:
	var unit_ids = ["rifleman", "anti_tank", "light_tank", "attack_helicopter"]
	for uid in unit_ids:
		var path = "res://data/units/%s.json" % uid
		if FileAccess.file_exists(path):
			var file = FileAccess.open(path, FileAccess.READ)
			var json = JSON.new()
			json.parse(file.get_as_text())
			unit_data_cache[uid] = json.get_data()
			file.close()
