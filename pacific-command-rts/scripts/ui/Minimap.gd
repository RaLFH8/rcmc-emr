extends Control
class_name Minimap

# Minimap — renders unit/building positions as colored dots
# Updates every 0.1s for performance

@export var map_size: Vector2 = Vector2(2560, 2560)  # world size in pixels
@export var update_interval: float = 0.1

var _timer: float = 0.0
var _minimap_texture: ImageTexture
var _image: Image

# Colors
const COLOR_PLAYER_UNIT    = Color(0.3, 0.5, 1.0)
const COLOR_ENEMY_UNIT     = Color(1.0, 0.3, 0.3)
const COLOR_PLAYER_BUILDING = Color(0.2, 0.8, 0.2)
const COLOR_ENEMY_BUILDING  = Color(0.8, 0.2, 0.2)
const COLOR_FOG             = Color(0.05, 0.05, 0.05, 0.85)
const COLOR_BACKGROUND      = Color(0.1, 0.15, 0.1)

# Camera viewport rect (drawn as white box)
var camera_rect: Rect2 = Rect2()

signal minimap_clicked(world_pos: Vector2)

func _ready() -> void:
	_image = Image.create(128, 128, false, Image.FORMAT_RGBA8)
	_minimap_texture = ImageTexture.create_from_image(_image)
	_draw_background()

func _process(delta: float) -> void:
	_timer += delta
	if _timer >= update_interval:
		_timer = 0.0
		_refresh()

func _refresh() -> void:
	_draw_background()
	_draw_buildings()
	_draw_units()
	_draw_camera_rect()
	_minimap_texture.update(_image)
	queue_redraw()

func _draw_background() -> void:
	_image.fill(COLOR_BACKGROUND)

func _draw_units() -> void:
	for pid in [0, 1]:
		var color = COLOR_PLAYER_UNIT if pid == 0 else COLOR_ENEMY_UNIT
		for unit in UnitManager.get_units(pid):
			if is_instance_valid(unit):
				var mp = _world_to_minimap(unit.global_position)
				_draw_dot(mp, color, 2)

func _draw_buildings() -> void:
	for pid in [0, 1]:
		var color = COLOR_PLAYER_BUILDING if pid == 0 else COLOR_ENEMY_BUILDING
		for building in BuildingManager.get_buildings(pid):
			if is_instance_valid(building):
				var mp = _world_to_minimap(building.global_position)
				_draw_dot(mp, color, 3)

func _draw_camera_rect() -> void:
	if camera_rect.size == Vector2.ZERO:
		return
	var tl = _world_to_minimap(camera_rect.position)
	var br = _world_to_minimap(camera_rect.end)
	var w = int(br.x - tl.x)
	var h = int(br.y - tl.y)
	# Draw border only
	for x in range(w):
		_set_pixel_safe(tl.x + x, tl.y, Color.WHITE)
		_set_pixel_safe(tl.x + x, br.y, Color.WHITE)
	for y in range(h):
		_set_pixel_safe(tl.x, tl.y + y, Color.WHITE)
		_set_pixel_safe(br.x, tl.y + y, Color.WHITE)

func _draw_dot(pos: Vector2i, color: Color, radius: int) -> void:
	for dx in range(-radius, radius + 1):
		for dy in range(-radius, radius + 1):
			if dx * dx + dy * dy <= radius * radius:
				_set_pixel_safe(pos.x + dx, pos.y + dy, color)

func _set_pixel_safe(x: int, y: int, color: Color) -> void:
	if x >= 0 and x < 128 and y >= 0 and y < 128:
		_image.set_pixel(x, y, color)

func _world_to_minimap(world_pos: Vector2) -> Vector2i:
	var nx = world_pos.x / map_size.x
	var ny = world_pos.y / map_size.y
	return Vector2i(int(nx * 128), int(ny * 128))

func _minimap_to_world(minimap_pos: Vector2) -> Vector2:
	var nx = minimap_pos.x / size.x
	var ny = minimap_pos.y / size.y
	return Vector2(nx * map_size.x, ny * map_size.y)

func _draw() -> void:
	if _minimap_texture:
		draw_texture_rect(_minimap_texture, Rect2(Vector2.ZERO, size), false)

func _gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT and event.pressed:
			var world_pos = _minimap_to_world(event.position)
			minimap_clicked.emit(world_pos)

func update_camera_rect(cam_pos: Vector2, viewport_size: Vector2, zoom: float) -> void:
	var half = viewport_size / (2.0 * zoom)
	camera_rect = Rect2(cam_pos - half, half * 2.0)
