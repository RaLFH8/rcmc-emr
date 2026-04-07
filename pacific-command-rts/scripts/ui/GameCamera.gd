extends Camera2D

# Game Camera - Pan, zoom, bounds
# Mobile: pinch zoom, two-finger drag
# PC: scroll wheel zoom, edge pan / drag

add_to_group("game_camera")

@export var pan_speed: float = 400.0
@export var zoom_speed: float = 0.1
@export var min_zoom: float = 0.5
@export var max_zoom: float = 2.0

# Map bounds (set by GameScene)
var map_bounds: Rect2 = Rect2(0, 0, 2560, 2560)

# Touch tracking
var touch_points: Dictionary = {}
var last_pinch_distance: float = 0.0
var is_panning: bool = false
var pan_start_pos: Vector2 = Vector2.ZERO
var cam_start_pos: Vector2 = Vector2.ZERO

func _ready() -> void:
	zoom = Vector2(1.0, 1.0)

func _process(delta: float) -> void:
	_handle_keyboard_pan(delta)
	_clamp_to_bounds()

func _handle_keyboard_pan(delta: float) -> void:
	var dir = Vector2.ZERO
	if Input.is_action_pressed("ui_left") or Input.is_key_pressed(KEY_A):
		dir.x -= 1
	if Input.is_action_pressed("ui_right") or Input.is_key_pressed(KEY_D):
		dir.x += 1
	if Input.is_action_pressed("ui_up") or Input.is_key_pressed(KEY_W):
		dir.y -= 1
	if Input.is_action_pressed("ui_down") or Input.is_key_pressed(KEY_S):
		dir.y += 1
	
	if dir != Vector2.ZERO:
		position += dir.normalized() * pan_speed * delta / zoom.x

func _input(event: InputEvent) -> void:
	# Mouse wheel zoom (PC)
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_WHEEL_UP:
			_zoom_in()
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN:
			_zoom_out()
		elif event.button_index == MOUSE_BUTTON_MIDDLE:
			if event.pressed:
				is_panning = true
				pan_start_pos = event.position
				cam_start_pos = position
			else:
				is_panning = false
	
	if event is InputEventMouseMotion and is_panning:
		var delta_pos = (event.position - pan_start_pos) / zoom.x
		position = cam_start_pos - delta_pos
	
	# Touch input (mobile)
	if event is InputEventScreenTouch:
		if event.pressed:
			touch_points[event.index] = event.position
		else:
			touch_points.erase(event.index)
			last_pinch_distance = 0.0
	
	if event is InputEventScreenDrag:
		touch_points[event.index] = event.position
		
		if touch_points.size() == 1:
			# Single finger pan
			position -= event.relative / zoom.x
		elif touch_points.size() == 2:
			# Pinch zoom
			var points = touch_points.values()
			var current_dist = points[0].distance_to(points[1])
			if last_pinch_distance > 0:
				var zoom_delta = (current_dist - last_pinch_distance) * 0.002
				_apply_zoom(zoom.x + zoom_delta)
			last_pinch_distance = current_dist

func _zoom_in() -> void:
	_apply_zoom(zoom.x + zoom_speed)

func _zoom_out() -> void:
	_apply_zoom(zoom.x - zoom_speed)

func _apply_zoom(new_zoom: float) -> void:
	var clamped = clamp(new_zoom, min_zoom, max_zoom)
	zoom = Vector2(clamped, clamped)

func _clamp_to_bounds() -> void:
	var half_screen = get_viewport_rect().size / 2.0 / zoom.x
	position.x = clamp(position.x, map_bounds.position.x + half_screen.x, map_bounds.end.x - half_screen.x)
	position.y = clamp(position.y, map_bounds.position.y + half_screen.y, map_bounds.end.y - half_screen.y)

func center_on(world_pos: Vector2) -> void:
	position = world_pos
	_clamp_to_bounds()
