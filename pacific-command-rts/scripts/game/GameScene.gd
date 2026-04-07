extends Node2D

# Main game scene - orchestrates everything

@export var player_faction: String = "philippines"
@export var ai_difficulty: int = 1

@onready var tilemap: TileMap = $TileMap
@onready var hud: CanvasLayer = $GameHUD
@onready var camera: Camera2D = $GameCamera
@onready var ai_controller: Node = $AIController
@onready var fog_of_war: Node2D = $FogOfWar
@onready var minimap: Control = $GameHUD/HUDRoot/MinimapContainer/Minimap
@onready var win_loss_panel: Panel = $WinLossOverlay/Panel
@onready var result_label: Label = $WinLossOverlay/Panel/VBox/ResultLabel
@onready var subtitle_label: Label = $WinLossOverlay/Panel/VBox/SubtitleLabel
@onready var retry_btn: Button = $WinLossOverlay/Panel/VBox/Buttons/RetryButton
@onready var main_menu_btn: Button = $WinLossOverlay/Panel/VBox/Buttons/MainMenuButton

# Unit scenes (preloaded)
var unit_scenes: Dictionary = {}
var building_scenes: Dictionary = {}
var hero_scene: PackedScene = null

# Spawn positions
@export var player_spawn: Vector2 = Vector2(256, 256)
@export var ai_spawn: Vector2 = Vector2(2304, 2304)

# Supply tracking
var supply_used: Array[int] = [0, 0]
var supply_cap: Array[int] = [50, 50]

# Hero tracking (only 1 active per player)
var active_heroes: Array = [null, null]

# Scouting bonus (Improvement #16)
var scouted_buildings: Array[int] = []  # building instance IDs already scouted

func _ready() -> void:
	_load_scenes()
	_setup_match()
	_connect_signals()
	
	# Set camera bounds
	if camera and tilemap:
		var map_rect = tilemap.get_used_rect()
		camera.map_bounds = Rect2(
			map_rect.position * 64,
			map_rect.size * 64
		)

func _load_scenes() -> void:
	# These will be loaded once scenes are created
	# For now, use placeholder approach
	var scene_paths = {
		"rifleman": "res://scenes/game/units/Rifleman.tscn",
		"anti_tank": "res://scenes/game/units/AntiTank.tscn",
		"light_tank": "res://scenes/game/units/LightTank.tscn",
		"attack_helicopter": "res://scenes/game/units/AttackHelicopter.tscn",
	}
	for unit_id in scene_paths:
		if ResourceLoader.exists(scene_paths[unit_id]):
			unit_scenes[unit_id] = load(scene_paths[unit_id])
	
	if ResourceLoader.exists("res://scenes/game/heroes/LapuLapu.tscn"):
		hero_scene = load("res://scenes/game/heroes/LapuLapu.tscn")

func _setup_match() -> void:
	# Pull settings from GameManager
	player_faction = GameManager.current_player_faction
	ai_difficulty = GameManager.ai_difficulty
	
	ResourceManager.reset_for_match()
	UnitManager.reset_for_match()
	BuildingManager.reset_for_match()
	
	# Apply faction passive (Philippines: +20% manpower regen)
	if player_faction == "philippines":
		ResourceManager.manpower_rate[0] *= 1.20
	
	# Spawn starting buildings
	_spawn_starting_buildings()

func _spawn_starting_buildings() -> void:
	# Player command center
	_spawn_building("command_center", player_spawn, 0)
	# AI command center
	_spawn_building("command_center", ai_spawn, 1)
	
	# Player starting barracks
	_spawn_building("barracks", player_spawn + Vector2(128, 0), 0)
	# AI starting barracks
	_spawn_building("barracks", ai_spawn + Vector2(-128, 0), 1)
	
	# Player refinery
	_spawn_building("refinery", player_spawn + Vector2(0, 128), 0)
	# AI refinery
	_spawn_building("refinery", ai_spawn + Vector2(0, -128), 1)

func _spawn_building(building_type: String, world_pos: Vector2, pid: int) -> Node:
	var path = "res://scenes/game/buildings/%s.tscn" % building_type.capitalize()
	if not ResourceLoader.exists(path):
		# Create a placeholder building node
		return _create_placeholder_building(building_type, world_pos, pid)
	
	var scene = load(path)
	var building = scene.instantiate()
	building.building_type = building_type
	building.player_id = pid
	building.global_position = world_pos
	add_child(building)
	
	# Connect training signal
	if building.has_signal("unit_trained"):
		building.unit_trained.connect(_on_unit_trained)
	
	return building

func _create_placeholder_building(building_type: String, world_pos: Vector2, pid: int) -> Node:
	# Placeholder until real scenes are created
	var node = StaticBody2D.new()
	node.set_script(load("res://scripts/core/BuildingBase.gd"))
	node.building_type = building_type
	node.player_id = pid
	node.global_position = world_pos
	
	# Add visual placeholder
	var rect = ColorRect.new()
	rect.size = Vector2(64, 64)
	rect.position = Vector2(-32, -32)
	match building_type:
		"command_center": rect.color = Color(0.8, 0.8, 0.0, 0.8)
		"barracks": rect.color = Color(0.0, 0.8, 0.0, 0.8)
		"refinery": rect.color = Color(0.8, 0.4, 0.0, 0.8)
		"war_factory": rect.color = Color(0.4, 0.4, 0.8, 0.8)
		_: rect.color = Color(0.5, 0.5, 0.5, 0.8)
	
	if pid == 1:
		rect.color = Color(rect.color.r * 0.8, rect.color.g * 0.3, rect.color.b * 0.3, 0.8)
	
	node.add_child(rect)
	add_child(node)
	
	# Register manually since script _ready may not fire correctly
	BuildingManager.register_building(node, pid)
	
	if building_type == "refinery":
		ResourceManager.add_credits_rate(pid, 15.0)  # 15 credits/sec
	
	return node

func _on_unit_trained(unit_id: String, pid: int) -> void:
	spawn_unit(unit_id, pid)

func spawn_unit(unit_id: String, pid: int) -> Node:
	# Find spawn position near barracks
	var spawn_pos = player_spawn if pid == 0 else ai_spawn
	for building in BuildingManager.get_buildings(pid):
		if is_instance_valid(building) and building.building_type == "barracks":
			spawn_pos = building.get_spawn_position() if building.has_method("get_spawn_position") else building.global_position + Vector2(80, 0)
			break
	
	if unit_scenes.has(unit_id):
		var unit = unit_scenes[unit_id].instantiate()
		unit.player_id = pid
		unit.global_position = spawn_pos + Vector2(randf_range(-30, 30), randf_range(-30, 30))
		add_child(unit)
		return unit
	else:
		return _create_placeholder_unit(unit_id, spawn_pos, pid)

func _create_placeholder_unit(unit_id: String, world_pos: Vector2, pid: int) -> Node:
	var node = CharacterBody2D.new()
	node.set_script(load("res://scripts/core/UnitBase.gd"))
	node.unit_id = unit_id
	node.player_id = pid
	node.global_position = world_pos + Vector2(randf_range(-30, 30), randf_range(-30, 30))
	
	# Load data from JSON
	var data_path = "res://data/units/%s.json" % unit_id
	if FileAccess.file_exists(data_path):
		var file = FileAccess.open(data_path, FileAccess.READ)
		var json = JSON.new()
		json.parse(file.get_as_text())
		var data = json.get_data()
		file.close()
		
		# Add visual
		var rect = ColorRect.new()
		rect.size = Vector2(32, 32)
		rect.position = Vector2(-16, -16)
		match unit_id:
			"rifleman": rect.color = Color(0.2, 0.8, 0.2)
			"anti_tank": rect.color = Color(0.8, 0.8, 0.2)
			"light_tank": rect.color = Color(0.5, 0.5, 0.8)
			"attack_helicopter": rect.color = Color(0.8, 0.2, 0.8)
			_: rect.color = Color(0.5, 0.5, 0.5)
		
		if pid == 1:
			rect.color = Color(rect.color.r * 1.2, rect.color.g * 0.3, rect.color.b * 0.3)
		
		node.add_child(rect)
		
		# Add collision
		var col = CollisionShape2D.new()
		var shape = CircleShape2D.new()
		shape.radius = 16.0
		col.shape = shape
		node.add_child(col)
		
		# Add nav agent
		var nav = NavigationAgent2D.new()
		node.add_child(nav)
		
		add_child(node)
		
		# Load stats after adding to scene
		node.load_from_data(data)
		
		return node
	
	add_child(node)
	return node

func deploy_hero(pid: int) -> void:
	# Only 1 hero active at a time
	if active_heroes[pid] and is_instance_valid(active_heroes[pid]):
		return
	
	if not ResourceManager.can_afford(pid, 0, 0, 50):
		return
	
	ResourceManager.spend(pid, 0, 0, 50)
	
	var spawn_pos = player_spawn if pid == 0 else ai_spawn
	for building in BuildingManager.get_buildings(pid):
		if is_instance_valid(building) and building.building_type == "barracks":
			spawn_pos = building.global_position + Vector2(80, 0)
			break
	
	var hero: Node
	if hero_scene:
		hero = hero_scene.instantiate()
	else:
		hero = _create_placeholder_hero(spawn_pos, pid)
		active_heroes[pid] = hero
		return
	
	hero.player_id = pid
	hero.global_position = spawn_pos
	add_child(hero)
	active_heroes[pid] = hero
	
	hero.died.connect(func(_h): active_heroes[pid] = null)

func _create_placeholder_hero(world_pos: Vector2, pid: int) -> Node:
	var node = CharacterBody2D.new()
	node.set_script(load("res://scripts/heroes/HeroBase.gd"))
	node.unit_id = "lapu_lapu"
	node.player_id = pid
	node.global_position = world_pos
	
	var rect = ColorRect.new()
	rect.size = Vector2(48, 48)
	rect.position = Vector2(-24, -24)
	rect.color = Color(1.0, 0.8, 0.0) if pid == 0 else Color(1.0, 0.3, 0.0)
	node.add_child(rect)
	
	var col = CollisionShape2D.new()
	var shape = CircleShape2D.new()
	shape.radius = 24.0
	col.shape = shape
	node.add_child(col)
	
	var nav = NavigationAgent2D.new()
	node.add_child(nav)
	
	add_child(node)
	
	# Load hero data
	var data_path = "res://data/heroes/lapu_lapu.json"
	if FileAccess.file_exists(data_path):
		var file = FileAccess.open(data_path, FileAccess.READ)
		var json = JSON.new()
		json.parse(file.get_as_text())
		node.load_hero_data(json.get_data())
		file.close()
	
	return node

func _connect_signals() -> void:
	BuildingManager.command_center_destroyed.connect(_on_command_center_destroyed)
	if retry_btn:
		retry_btn.pressed.connect(func(): GameManager.start_match(player_faction))
	if main_menu_btn:
		main_menu_btn.pressed.connect(func(): GameManager.go_to_main_menu())
	# Wire minimap click to camera
	if minimap and camera:
		minimap.minimap_clicked.connect(func(wp): camera.position = wp)

func _on_command_center_destroyed(pid: int) -> void:
	# Winner is the other player
	var winner = 1 - pid
	GameManager.end_match(winner)
	_show_result(winner == 0)

func _show_result(player_won: bool) -> void:
	if win_loss_panel:
		win_loss_panel.visible = true
		get_tree().paused = true
	if result_label:
		result_label.text = "VICTORY" if player_won else "DEFEAT"
		result_label.modulate = Color(0.1, 0.9, 0.2) if player_won else Color(0.9, 0.1, 0.1)
	if subtitle_label:
		subtitle_label.text = "Your command center stands." if player_won else "Your command center has fallen."
	# Record challenge event
	if player_won:
		SeasonChallenges.record_event("win_matches")
		if ai_difficulty == 2:
			SeasonChallenges.record_event("win_vs_hard")

# Input handling for unit commands
func _input(event: InputEvent) -> void:
	if GameManager.current_state != GameManager.GameState.IN_GAME:
		return
	
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
			_handle_left_click(get_global_mouse_position())
		elif event.button_index == MOUSE_BUTTON_RIGHT and event.pressed:
			_handle_right_click(get_global_mouse_position())

func _handle_left_click(world_pos: Vector2) -> void:
	# Check if clicking on a unit
	var space = get_world_2d().direct_space_state
	var query = PhysicsPointQueryParameters2D.new()
	query.position = world_pos
	query.collision_mask = 1
	var results = space.intersect_point(query)
	
	for result in results:
		var obj = result.collider
		if obj is UnitBase and obj.player_id == 0:
			UnitManager.select_unit(obj)
			return
	
	# Clicked empty space - clear selection
	UnitManager.clear_selection()

func _handle_right_click(world_pos: Vector2) -> void:
	if UnitManager.selected_units.is_empty():
		return
	
	# Check if clicking on enemy
	var space = get_world_2d().direct_space_state
	var query = PhysicsPointQueryParameters2D.new()
	query.position = world_pos
	query.collision_mask = 1
	var results = space.intersect_point(query)
	
	for result in results:
		var obj = result.collider
		if obj is UnitBase and obj.player_id == 1:
			# Attack command
			for unit in UnitManager.selected_units:
				if is_instance_valid(unit):
					unit.attack_target(obj)
			return
	
	# Move command
	for unit in UnitManager.selected_units:
		if is_instance_valid(unit):
			unit.move_to(world_pos)
	
	# Scouting bonus: +50 credits when first revealing enemy building (Improvement #16)
	_check_scouting_bonus(world_pos)

func _check_scouting_bonus(world_pos: Vector2) -> void:
	for building in BuildingManager.get_buildings(1):
		if is_instance_valid(building):
			var dist = world_pos.distance_to(building.global_position)
			var bid = building.get_instance_id()
			if dist < 200 and bid not in scouted_buildings:
				scouted_buildings.append(bid)
				ResourceManager.add_credits(0, 50.0)
				# TODO: show "+50 Credits (Scout Bonus)" popup

func _process(_delta: float) -> void:
	# Update minimap camera rect
	if minimap and camera:
		var vp_size = get_viewport().get_visible_rect().size
		minimap.update_camera_rect(camera.position, vp_size, camera.zoom.x)
