extends StaticBody2D
class_name BuildingBase

@export var building_type: String = "generic"
@export var player_id: int = 0

var building_name: String = ""
var max_hp: float = 500.0
var current_hp: float = 500.0
var is_destroyed: bool = false

# Training queue
var train_queue: Array[Dictionary] = []
var train_timer: float = 0.0
var max_queue_size: int = 5

# Resource generation
var credits_per_second: float = 0.0

@onready var hp_bar: ProgressBar = $HPBar
@onready var sprite: Sprite2D = $Sprite2D
@onready var spawn_point: Marker2D = $SpawnPoint

signal unit_trained(unit_id: String, player_id: int)
signal training_started(unit_id: String, duration: float)
signal destroyed(building: BuildingBase)

func _ready() -> void:
	BuildingManager.register_building(self, player_id)
	current_hp = max_hp
	_update_hp_bar()
	_apply_faction_color()
	
	if credits_per_second > 0:
		ResourceManager.add_credits_rate(player_id, credits_per_second)

func _process(delta: float) -> void:
	if is_destroyed:
		return
	
	if train_queue.size() > 0:
		train_timer -= delta * GameManager.game_speed
		if train_timer <= 0.0:
			_finish_training()

func queue_unit(unit_id: String, unit_data: Dictionary) -> bool:
	if train_queue.size() >= max_queue_size:
		return false
	
	var cost = unit_data.get("cost", {})
	if not ResourceManager.can_afford(player_id, 
		cost.get("credits", 0), 
		cost.get("fuel", 0), 
		cost.get("manpower", 0)):
		return false
	
	# Check supply cap
	var supply_cost = unit_data.get("supply", 0)
	# TODO: supply cap check
	
	ResourceManager.spend(player_id,
		cost.get("credits", 0),
		cost.get("fuel", 0),
		cost.get("manpower", 0))
	
	train_queue.append({"unit_id": unit_id, "data": unit_data})
	
	if train_queue.size() == 1:
		train_timer = unit_data.get("train_time", 10.0)
		training_started.emit(unit_id, train_timer)
	
	return true

func _finish_training() -> void:
	if train_queue.is_empty():
		return
	
	var queued = train_queue.pop_front()
	unit_trained.emit(queued.unit_id, player_id)
	
	if train_queue.size() > 0:
		train_timer = train_queue[0].data.get("train_time", 10.0)
		training_started.emit(train_queue[0].unit_id, train_timer)

func take_damage(amount: float) -> void:
	if is_destroyed:
		return
	current_hp -= amount
	_update_hp_bar()
	if current_hp <= 0:
		_destroy()

func _destroy() -> void:
	is_destroyed = true
	if credits_per_second > 0:
		ResourceManager.remove_credits_rate(player_id, credits_per_second)
	BuildingManager.unregister_building(self, player_id)
	destroyed.emit(self)
	
	var tween = create_tween()
	tween.tween_property(self, "modulate:a", 0.0, 0.8)
	tween.tween_callback(queue_free)

func _update_hp_bar() -> void:
	if hp_bar:
		hp_bar.value = (current_hp / max_hp) * 100.0

func _apply_faction_color() -> void:
	if sprite:
		match player_id:
			0: sprite.modulate = Color(0.3, 0.5, 1.0)
			1: sprite.modulate = Color(1.0, 0.3, 0.3)

func get_spawn_position() -> Vector2:
	if spawn_point:
		return spawn_point.global_position
	return global_position + Vector2(64, 0)
