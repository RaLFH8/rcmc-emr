extends Area2D
class_name CapturePoint

# Capture Points — neutral resource buildings (Improvement #4)
# Units standing on them capture over time, then generate resources

@export var capture_time: float = 8.0       # seconds to fully capture
@export var credits_per_tick: float = 10.0  # credits given per tick when captured
@export var tick_interval: float = 5.0      # seconds between resource ticks
@export var capture_radius: float = 80.0    # radius units must be in to capture

var owner_id: int = -1          # -1 = neutral, 0 = player, 1 = AI
var capture_progress: float = 0.0  # 0.0 to 1.0
var capturing_player: int = -1
var tick_timer: float = 0.0

@onready var progress_bar: ProgressBar = $ProgressBar
@onready var flag_sprite: Sprite2D = $FlagSprite
@onready var collision: CollisionShape2D = $CollisionShape2D

signal captured(point: CapturePoint, new_owner: int)
signal neutralized(point: CapturePoint)

const PLAYER_COLOR  = Color(0.3, 0.5, 1.0)
const ENEMY_COLOR   = Color(1.0, 0.3, 0.3)
const NEUTRAL_COLOR = Color(0.7, 0.7, 0.7)

func _ready() -> void:
	# Set collision radius
	if collision and collision.shape is CircleShape2D:
		collision.shape.radius = capture_radius
	_update_visuals()

func _process(delta: float) -> void:
	var units_in_range = _get_units_in_range()
	var player_count = 0
	var enemy_count = 0
	
	for unit in units_in_range:
		if unit.player_id == 0:
			player_count += 1
		else:
			enemy_count += 1
	
	# Contested — no progress
	if player_count > 0 and enemy_count > 0:
		return
	
	var contesting_player = -1
	if player_count > 0:
		contesting_player = 0
	elif enemy_count > 0:
		contesting_player = 1
	
	if contesting_player == -1:
		# No one here — decay toward neutral slowly
		if owner_id == -1 and capture_progress > 0.0:
			capture_progress = max(0.0, capture_progress - delta * 0.1)
		return
	
	# Someone is capturing
	if owner_id == contesting_player:
		# Already owned — tick resources
		tick_timer += delta
		if tick_timer >= tick_interval:
			tick_timer = 0.0
			ResourceManager.add_credits(owner_id, credits_per_tick)
		return
	
	# Capturing or neutralizing
	if capturing_player != contesting_player:
		capturing_player = contesting_player
		# Reset progress if switching sides
		if owner_id != -1 and owner_id != contesting_player:
			capture_progress = 1.0 - capture_progress
	
	capture_progress += delta / capture_time
	
	if capture_progress >= 1.0:
		capture_progress = 1.0
		var old_owner = owner_id
		owner_id = contesting_player
		capturing_player = -1
		tick_timer = 0.0
		captured.emit(self, owner_id)
		_update_visuals()
	
	_update_progress_bar()

func _get_units_in_range() -> Array:
	var result = []
	var bodies = get_overlapping_bodies()
	for body in bodies:
		if body is UnitBase and body.is_alive():
			result.append(body)
	return result

func _update_visuals() -> void:
	if flag_sprite:
		match owner_id:
			0:  flag_sprite.modulate = PLAYER_COLOR
			1:  flag_sprite.modulate = ENEMY_COLOR
			_:  flag_sprite.modulate = NEUTRAL_COLOR

func _update_progress_bar() -> void:
	if progress_bar:
		progress_bar.value = capture_progress * 100.0
		if capturing_player == 0:
			progress_bar.modulate = PLAYER_COLOR
		elif capturing_player == 1:
			progress_bar.modulate = ENEMY_COLOR
