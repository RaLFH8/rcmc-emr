extends Node
class_name TechTree

# Tech Tree — Phase 2 system
# Each faction has a 3-tier tech tree unlocked via Research Center

# Tech node structure
class TechNode:
	var id: String
	var name: String
	var description: String
	var tier: int           # 1, 2, or 3
	var cost_credits: int
	var cost_fuel: int
	var research_time: float  # seconds
	var prerequisites: Array[String]  # IDs of required techs
	var effect_type: String   # "unit_unlock", "stat_bonus", "building_unlock"
	var effect_data: Dictionary
	var is_researched: bool = false
	var research_progress: float = 0.0

var faction_id: String = ""
var player_id: int = 0
var tech_nodes: Dictionary = {}  # id -> TechNode
var active_research: TechNode = null
var research_timer: float = 0.0

signal tech_researched(tech_id: String)
signal research_started(tech_id: String)

func _ready() -> void:
	pass

func setup(faction: String, pid: int) -> void:
	faction_id = faction
	player_id = pid
	_load_tech_tree(faction)

func _load_tech_tree(faction: String) -> void:
	tech_nodes.clear()
	
	# Universal techs (all factions)
	_add_tech("improved_armor", "Improved Armor", "All units gain +15% HP", 1,
		200, 50, 30.0, [], "stat_bonus", {"stat": "hp", "multiplier": 1.15})
	
	_add_tech("advanced_weapons", "Advanced Weapons", "All units deal +10% damage", 1,
		250, 60, 35.0, [], "stat_bonus", {"stat": "attack", "multiplier": 1.10})
	
	_add_tech("rapid_training", "Rapid Training", "All units train 25% faster", 1,
		180, 40, 25.0, [], "stat_bonus", {"stat": "train_time", "multiplier": 0.75})
	
	_add_tech("war_factory_upgrade", "War Factory Upgrade", "Unlocks Light Tank production", 2,
		400, 100, 60.0, ["improved_armor"], "unit_unlock", {"unit": "light_tank"})
	
	_add_tech("air_support", "Air Support", "Unlocks Attack Helicopter production", 2,
		500, 150, 75.0, ["advanced_weapons"], "unit_unlock", {"unit": "attack_helicopter"})
	
	_add_tech("supply_expansion", "Supply Expansion", "+50 supply cap", 2,
		300, 80, 45.0, ["rapid_training"], "stat_bonus", {"stat": "supply_cap", "bonus": 50})
	
	_add_tech("elite_forces", "Elite Forces", "Units reach Elite veterancy at 10 kills (instead of 15)", 3,
		600, 150, 90.0, ["war_factory_upgrade", "advanced_weapons"], "stat_bonus",
		{"stat": "elite_kill_threshold", "value": 10})
	
	_add_tech("missile_cruiser", "Missile Cruiser", "Unlocks Missile Cruiser (naval unit)", 3,
		700, 200, 120.0, ["air_support"], "unit_unlock", {"unit": "missile_cruiser"})
	
	# Faction-specific tier 3 tech
	match faction:
		"philippines":
			_add_tech("island_fortress", "Island Fortress", "Defense Towers gain +30% HP and fire rate on beach/coastal tiles", 3,
				550, 120, 80.0, ["supply_expansion"], "stat_bonus",
				{"stat": "coastal_tower_bonus", "hp": 1.30, "fire_rate": 1.30})
		"vietnam":
			_add_tech("tunnel_network", "Tunnel Network", "Infantry units can teleport between Barracks once per 60s", 3,
				500, 100, 80.0, ["supply_expansion"], "stat_bonus",
				{"stat": "tunnel_teleport", "cooldown": 60.0})
		"indonesia":
			_add_tech("archipelago_navy", "Archipelago Navy", "All naval units gain +20% speed and +15% damage", 3,
				600, 130, 85.0, ["supply_expansion"], "stat_bonus",
				{"stat": "naval_bonus", "speed": 1.20, "damage": 1.15})
		"thailand":
			_add_tech("royal_guard", "Royal Guard", "Hero gains +50% HP and abilities cost 30% less Manpower", 3,
				550, 110, 80.0, ["supply_expansion"], "stat_bonus",
				{"stat": "hero_bonus", "hp": 1.50, "ability_cost": 0.70})
		"singapore":
			_add_tech("smart_defense", "Smart Defense", "Defense Towers auto-target air units first, +25% damage vs air", 3,
				580, 120, 85.0, ["supply_expansion"], "stat_bonus",
				{"stat": "smart_targeting", "air_damage_bonus": 1.25})

func _add_tech(id: String, name: String, desc: String, tier: int,
	cost_c: int, cost_f: int, time: float, prereqs: Array,
	effect_type: String, effect_data: Dictionary) -> void:
	var node = TechNode.new()
	node.id = id
	node.name = name
	node.description = desc
	node.tier = tier
	node.cost_credits = cost_c
	node.cost_fuel = cost_f
	node.research_time = time
	node.prerequisites = prereqs
	node.effect_type = effect_type
	node.effect_data = effect_data
	tech_nodes[id] = node

func can_research(tech_id: String) -> bool:
	if not tech_nodes.has(tech_id):
		return false
	var node = tech_nodes[tech_id]
	if node.is_researched:
		return false
	if active_research != null:
		return false
	if not ResourceManager.can_afford(player_id, node.cost_credits, node.cost_fuel, 0):
		return false
	for prereq in node.prerequisites:
		if not tech_nodes.has(prereq) or not tech_nodes[prereq].is_researched:
			return false
	return true

func start_research(tech_id: String) -> bool:
	if not can_research(tech_id):
		return false
	var node = tech_nodes[tech_id]
	ResourceManager.spend(player_id, node.cost_credits, node.cost_fuel, 0)
	active_research = node
	research_timer = 0.0
	research_started.emit(tech_id)
	return true

func _process(delta: float) -> void:
	if active_research == null:
		return
	research_timer += delta * GameManager.game_speed
	active_research.research_progress = research_timer / active_research.research_time
	if research_timer >= active_research.research_time:
		_complete_research()

func _complete_research() -> void:
	if active_research == null:
		return
	active_research.is_researched = true
	active_research.research_progress = 1.0
	var tech_id = active_research.id
	active_research = null
	research_timer = 0.0
	tech_researched.emit(tech_id)

func get_researched_techs() -> Array[String]:
	var result: Array[String] = []
	for id in tech_nodes:
		if tech_nodes[id].is_researched:
			result.append(id)
	return result

func is_researched(tech_id: String) -> bool:
	return tech_nodes.has(tech_id) and tech_nodes[tech_id].is_researched
