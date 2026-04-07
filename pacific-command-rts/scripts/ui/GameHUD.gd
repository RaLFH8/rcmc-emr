extends CanvasLayer

# Game HUD - Mobile-first layout
# Top: Minimap | Credits | Fuel | Manpower
# Bottom: Unit Info | Build Menu | Hero Portrait | Unit Queue

@onready var credits_label: Label = $TopBar/Credits
@onready var fuel_label: Label = $TopBar/Fuel
@onready var manpower_label: Label = $TopBar/Manpower
@onready var minimap: Control = $TopBar/Minimap

@onready var unit_info_panel: Control = $BottomBar/UnitInfo
@onready var build_menu: Control = $BottomBar/BuildMenu
@onready var hero_portrait: Control = $BottomBar/HeroPortrait
@onready var unit_queue: Control = $BottomBar/UnitQueue

@onready var win_screen: Control = $WinScreen
@onready var loss_screen: Control = $LossScreen

var player_id: int = 0

func _ready() -> void:
	ResourceManager.resources_changed.connect(_on_resources_changed)
	UnitManager.unit_selected.connect(_on_unit_selected)
	UnitManager.selection_cleared.connect(_on_selection_cleared)
	BuildingManager.command_center_destroyed.connect(_on_command_center_destroyed)
	
	if win_screen:
		win_screen.visible = false
	if loss_screen:
		loss_screen.visible = false
	
	_update_resources()

func _on_resources_changed(pid: int) -> void:
	if pid == player_id:
		_update_resources()

func _update_resources() -> void:
	if credits_label:
		credits_label.text = "Credits: %d" % int(ResourceManager.credits[player_id])
	if fuel_label:
		fuel_label.text = "Fuel: %d" % int(ResourceManager.fuel[player_id])
	if manpower_label:
		manpower_label.text = "MP: %d/%d" % [int(ResourceManager.manpower[player_id]), int(ResourceManager.MAX_MANPOWER)]

func _on_unit_selected(unit: Node) -> void:
	if not unit_info_panel:
		return
	
	# Show unit info
	var name_label = unit_info_panel.get_node_or_null("UnitName")
	var hp_label = unit_info_panel.get_node_or_null("HPLabel")
	
	if name_label:
		name_label.text = unit.unit_name if "unit_name" in unit else "Unit"
	if hp_label:
		hp_label.text = "HP: %d/%d" % [int(unit.current_hp), int(unit.max_hp)]
	
	unit_info_panel.visible = true

func _on_selection_cleared() -> void:
	if unit_info_panel:
		unit_info_panel.visible = false

func _on_command_center_destroyed(destroyed_player_id: int) -> void:
	if destroyed_player_id == player_id:
		# Player lost
		_show_loss_screen()
	else:
		# Player won
		_show_win_screen()

func _show_win_screen() -> void:
	if win_screen:
		win_screen.visible = true
	GameManager.end_match(player_id)

func _show_loss_screen() -> void:
	if loss_screen:
		loss_screen.visible = true
	GameManager.end_match(1 - player_id)

func show_build_menu(building_type: String) -> void:
	if build_menu:
		build_menu.visible = true
		# Populate based on building type
		# TODO: populate train buttons

func hide_build_menu() -> void:
	if build_menu:
		build_menu.visible = false

# Hotkey handling
func _input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed:
		match event.keycode:
			KEY_B:
				# Toggle build menu
				if build_menu:
					build_menu.visible = not build_menu.visible
			KEY_H:
				# Deploy hero
				_deploy_hero()
			KEY_SPACE:
				# Center camera on selected unit
				_center_camera_on_selection()
			KEY_ESCAPE:
				UnitManager.clear_selection()
				hide_build_menu()

func _deploy_hero() -> void:
	# Find barracks and deploy hero
	for building in BuildingManager.get_buildings(player_id):
		if is_instance_valid(building) and building.building_type == "barracks":
			# Signal to game scene to spawn hero
			get_tree().call_group("game_scene", "deploy_hero", player_id)
			break

func _center_camera_on_selection() -> void:
	if UnitManager.selected_units.size() > 0:
		var unit = UnitManager.selected_units[0]
		if is_instance_valid(unit):
			get_tree().call_group("game_camera", "center_on", unit.global_position)
