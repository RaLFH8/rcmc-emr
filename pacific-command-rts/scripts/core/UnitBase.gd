extends CharacterBody2D
class_name UnitBase

# Base class for all units

@export var unit_id: String = ""
@export var player_id: int = 0

# Stats loaded from JSON
var unit_name: String = ""
var max_hp: float = 100.0
var current_hp: float = 100.0
var attack_damage: float = 10.0
var attack_range: float = 100.0
var attack_speed: float = 1.0  # attacks per second
var move_speed: float = 80.0
var armor_type: String = "infantry"
var damage_type: String = "small_arms"
var vision_range: float = 200.0
var supply_cost: int = 1

# State
enum UnitState { IDLE, MOVING, ATTACKING, DEAD }
var state: UnitState = UnitState.IDLE
var target_unit: Node = null
var target_position: Vector2 = Vector2.ZERO
var is_selected_flag: bool = false

# Attack timer
var attack_timer: float = 0.0

# Veterancy (Improvement #3)
enum Veterancy { RECRUIT, VETERAN, ELITE }
var veterancy: Veterancy = Veterancy.RECRUIT
var kills: int = 0

# Fog of war memory (Improvement #1)
var last_known_enemy_positions: Dictionary = {}

# Visual nodes
@onready var hp_bar: ProgressBar = $HPBar
@onready var selection_ring: Node2D = $SelectionRing
@onready var sprite: Sprite2D = $Sprite2D
@onready var nav_agent: NavigationAgent2D = $NavigationAgent2D

signal died(unit: UnitBase)
signal hp_changed(current: float, max_val: float)

func _ready() -> void:
	UnitManager.register_unit(self, player_id)
	current_hp = max_hp
	_update_hp_bar()
	if selection_ring:
		selection_ring.visible = false
	_apply_faction_color()

func _physics_process(delta: float) -> void:
	if state == UnitState.DEAD:
		return
	
	attack_timer -= delta * GameManager.game_speed
	
	match state:
		UnitState.IDLE:
			_process_idle()
		UnitState.MOVING:
			_process_moving(delta)
		UnitState.ATTACKING:
			_process_attacking(delta)

func _process_idle() -> void:
	# Auto-attack nearby enemies
	var enemy = UnitManager.get_nearest_enemy(global_position, player_id, attack_range)
	if enemy:
		target_unit = enemy
		state = UnitState.ATTACKING

func _process_moving(delta: float) -> void:
	if not nav_agent:
		return
	
	if nav_agent.is_navigation_finished():
		state = UnitState.IDLE
		return
	
	var next_pos = nav_agent.get_next_path_position()
	var direction = (next_pos - global_position).normalized()
	
	# Apply terrain speed modifier
	var speed = move_speed * _get_terrain_modifier()
	velocity = direction * speed * GameManager.game_speed
	move_and_slide()
	
	# Check if target unit is in range while moving
	if target_unit and is_instance_valid(target_unit):
		var dist = global_position.distance_to(target_unit.global_position)
		if dist <= attack_range:
			state = UnitState.ATTACKING

func _process_attacking(delta: float) -> void:
	if not target_unit or not is_instance_valid(target_unit) or not target_unit.is_alive():
		target_unit = null
		state = UnitState.IDLE
		return
	
	var dist = global_position.distance_to(target_unit.global_position)
	
	if dist > attack_range:
		# Move toward target
		move_to(target_unit.global_position)
		return
	
	# Face target
	if dist > 0:
		velocity = Vector2.ZERO
	
	# Attack
	if attack_timer <= 0.0:
		_perform_attack()
		attack_timer = 1.0 / attack_speed

func _perform_attack() -> void:
	if target_unit and is_instance_valid(target_unit):
		var damage = _calculate_damage(attack_damage, damage_type, target_unit.armor_type)
		target_unit.take_damage(damage, self)

func _calculate_damage(base_damage: float, dmg_type: String, armor: String) -> float:
	# Damage type vs armor type multipliers
	var multiplier: float = 1.0
	match dmg_type:
		"small_arms":
			match armor:
				"infantry": multiplier = 1.0
				"light_armor": multiplier = 0.3
				"heavy_armor": multiplier = 0.1
				"air": multiplier = 0.5
		"armor_piercing":
			match armor:
				"infantry": multiplier = 0.8
				"light_armor": multiplier = 1.5
				"heavy_armor": multiplier = 1.2
				"air": multiplier = 0.3
		"cannon":
			match armor:
				"infantry": multiplier = 1.2
				"light_armor": multiplier = 1.0
				"heavy_armor": multiplier = 0.8
				"air": multiplier = 0.2
		"rockets":
			match armor:
				"infantry": multiplier = 1.3
				"light_armor": multiplier = 1.4
				"heavy_armor": multiplier = 1.0
				"air": multiplier = 0.5
	return base_damage * multiplier

func take_damage(amount: float, attacker: Node = null) -> void:
	if state == UnitState.DEAD:
		return
	
	current_hp -= amount
	_update_hp_bar()
	hp_changed.emit(current_hp, max_hp)
	
	# Auto-retaliate if idle
	if state == UnitState.IDLE and attacker and is_instance_valid(attacker):
		target_unit = attacker
		state = UnitState.ATTACKING
	
	if current_hp <= 0:
		_die()

func _die() -> void:
	state = UnitState.DEAD
	UnitManager.unregister_unit(self, player_id)
	died.emit(self)
	
	# Simple death: fade and queue_free
	var tween = create_tween()
	tween.tween_property(self, "modulate:a", 0.0, 0.5)
	tween.tween_callback(queue_free)

func is_alive() -> bool:
	return state != UnitState.DEAD and current_hp > 0

func move_to(world_pos: Vector2) -> void:
	if not nav_agent:
		return
	target_position = world_pos
	nav_agent.target_position = world_pos
	state = UnitState.MOVING

func attack_target(target: Node) -> void:
	target_unit = target
	state = UnitState.ATTACKING

func set_selected(selected: bool) -> void:
	is_selected_flag = selected
	if selection_ring:
		selection_ring.visible = selected

func _update_hp_bar() -> void:
	if hp_bar:
		hp_bar.value = (current_hp / max_hp) * 100.0

func _get_terrain_modifier() -> float:
	# Override in subclasses or read from tilemap
	return 1.0

func _apply_faction_color() -> void:
	# Faction color via modulate (not sprite variants - confirmed decision)
	if sprite:
		match player_id:
			0: sprite.modulate = Color(0.3, 0.5, 1.0)   # Blue for player
			1: sprite.modulate = Color(1.0, 0.3, 0.3)   # Red for AI

func load_from_data(data: Dictionary) -> void:
	unit_name = data.get("name", "Unit")
	max_hp = data.get("hp", 100.0)
	current_hp = max_hp
	attack_damage = data.get("attack", 10.0)
	attack_range = data.get("attack_range", 100.0)
	attack_speed = data.get("attack_speed", 1.0)
	move_speed = data.get("move_speed", 80.0)
	armor_type = data.get("armor_type", "infantry")
	damage_type = data.get("damage_type", "small_arms")
	vision_range = data.get("vision_range", 200.0)
	supply_cost = data.get("supply", 1)
	_update_hp_bar()

func apply_veterancy_bonus() -> void:
	match veterancy:
		Veterancy.VETERAN:
			max_hp *= 1.05
			attack_damage *= 1.05
			current_hp = min(current_hp * 1.05, max_hp)
		Veterancy.ELITE:
			max_hp *= 1.10
			attack_damage *= 1.10
			current_hp = min(current_hp * 1.10, max_hp)
	_update_hp_bar()

func add_kill() -> void:
	kills += 1
	if kills >= 5 and veterancy == Veterancy.RECRUIT:
		veterancy = Veterancy.VETERAN
		apply_veterancy_bonus()
	elif kills >= 15 and veterancy == Veterancy.VETERAN:
		veterancy = Veterancy.ELITE
		apply_veterancy_bonus()
