extends UnitBase
class_name HeroBase

# Hero unit - extends UnitBase with ability system

var hero_id: String = ""
var hero_data: Dictionary = {}

# Ability cooldowns
var active_cooldown: float = 0.0
var ultimate_cooldown: float = 0.0

# Lapu-Lapu specific state
var is_vanished: bool = false
var vanish_timer: float = 0.0
var datus_challenge_active: bool = false
var datus_debuff_timer: float = 0.0

signal ability_used(ability_id: String)
signal cooldown_updated(ability_id: String, remaining: float, total: float)

func _ready() -> void:
	super._ready()
	# Heroes are 2x size
	if sprite:
		sprite.scale = Vector2(2.0, 2.0)

func _physics_process(delta: float) -> void:
	super._physics_process(delta)
	
	# Tick cooldowns
	if active_cooldown > 0:
		active_cooldown -= delta * GameManager.game_speed
		cooldown_updated.emit("active", active_cooldown, hero_data.get("abilities", {}).get("active", {}).get("cooldown", 30.0))
	
	if ultimate_cooldown > 0:
		ultimate_cooldown -= delta * GameManager.game_speed
		cooldown_updated.emit("ultimate", ultimate_cooldown, hero_data.get("abilities", {}).get("ultimate", {}).get("cooldown", 90.0))
	
	# Vanish timer (Mactan Ambush)
	if is_vanished:
		vanish_timer -= delta * GameManager.game_speed
		if vanish_timer <= 0:
			_end_vanish()
	
	# Datu's Challenge debuff timer
	if datus_challenge_active:
		datus_debuff_timer -= delta * GameManager.game_speed
		if datus_debuff_timer <= 0:
			_end_datus_debuff()

func load_hero_data(data: Dictionary) -> void:
	hero_data = data
	hero_id = data.get("id", "")
	load_from_data(data)

func use_active_ability() -> bool:
	if active_cooldown > 0:
		return false
	
	var ability = hero_data.get("abilities", {}).get("active", {})
	if ability.is_empty():
		return false
	
	match ability.get("id", ""):
		"mactan_ambush":
			_use_mactan_ambush(ability)
	
	active_cooldown = ability.get("cooldown", 30.0)
	ability_used.emit("active")
	return true

func use_ultimate_ability() -> bool:
	if ultimate_cooldown > 0:
		return false
	
	var ability = hero_data.get("abilities", {}).get("ultimate", {})
	if ability.is_empty():
		return false
	
	match ability.get("id", ""):
		"datus_challenge":
			_use_datus_challenge(ability)
	
	ultimate_cooldown = ability.get("cooldown", 90.0)
	ability_used.emit("ultimate")
	return true

# --- Lapu-Lapu Abilities ---

func _use_mactan_ambush(ability: Dictionary) -> void:
	# Vanish for duration, then reappear behind nearest enemy
	is_vanished = true
	vanish_timer = ability.get("duration", 10.0)
	visible = false
	set_collision_layer_value(1, false)  # Can't be targeted while vanished

func _end_vanish() -> void:
	is_vanished = false
	visible = true
	set_collision_layer_value(1, true)
	
	# Reappear behind nearest enemy
	var nearest = UnitManager.get_nearest_enemy(global_position, player_id, 400.0)
	if nearest and is_instance_valid(nearest):
		var behind_pos = nearest.global_position + (nearest.global_position - global_position).normalized() * 80
		global_position = behind_pos
		
		# Stun the enemy
		var stun_duration = hero_data.get("abilities", {}).get("active", {}).get("stun_duration", 3.0)
		if nearest.has_method("apply_stun"):
			nearest.apply_stun(stun_duration)

func _use_datus_challenge(ability: Dictionary) -> void:
	# Simplified: always wins duel if enemy hero within range
	# Enemy units lose 50% attack speed for 30s
	var range_px = ability.get("range", 512)
	
	# Check for enemy hero in range
	for enemy in UnitManager.get_units(1 - player_id):
		if is_instance_valid(enemy) and enemy.is_alive():
			if enemy is HeroBase:
				var dist = global_position.distance_to(enemy.global_position)
				if dist <= range_px:
					# Hero wins duel - kill enemy hero
					enemy.take_damage(enemy.current_hp + 1, self)
	
	# Apply attack speed debuff to all nearby enemies
	var debuff_duration = ability.get("debuff_duration", 30.0)
	var reduction = ability.get("attack_speed_reduction", 0.5)
	datus_challenge_active = true
	datus_debuff_timer = debuff_duration
	
	for enemy in UnitManager.get_units(1 - player_id):
		if is_instance_valid(enemy) and enemy.is_alive():
			var dist = global_position.distance_to(enemy.global_position)
			if dist <= range_px * 2:  # Wider area for attack speed debuff
				enemy.attack_speed *= (1.0 - reduction)

func _end_datus_debuff() -> void:
	datus_challenge_active = false
	# Restore attack speed (simplified - in production track original values)

func _apply_island_defender_passive(damage: float, terrain_type: String) -> float:
	# -30% damage on coastal/beach terrain
	if terrain_type in ["beach", "coastal"]:
		return damage * 0.7
	return damage

func take_damage(amount: float, attacker: Node = null) -> void:
	# Apply passive if on beach terrain
	# TODO: get terrain type from tilemap
	super.take_damage(amount, attacker)
