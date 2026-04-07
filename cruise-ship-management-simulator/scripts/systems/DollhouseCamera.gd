extends Camera3D
# DollhouseCamera — isometric camera rig for the dollhouse view (Section 79)
# Fixed 45° horizontal / 30° vertical isometric angle.
# Supports zoom (scroll wheel) and pan (middle mouse drag).

const ISO_ANGLE_H: float = 45.0   # degrees, horizontal rotation
const ISO_ANGLE_V: float = 30.0   # degrees, vertical tilt

const ZOOM_MIN: float = 10.0
const ZOOM_MAX: float = 80.0
const ZOOM_SPEED: float = 5.0
const PAN_SPEED: float = 0.05

var zoom_level: float = 30.0
var pan_offset: Vector2 = Vector2.ZERO
var _panning: bool = false
var _last_mouse_pos: Vector2 = Vector2.ZERO


func _ready() -> void:
	_apply_transform()


func _unhandled_input(event: InputEvent) -> void:
	# Zoom with scroll wheel
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_WHEEL_UP and event.pressed:
			zoom_level = maxf(zoom_level - ZOOM_SPEED, ZOOM_MIN)
			_apply_transform()
		elif event.button_index == MOUSE_BUTTON_WHEEL_DOWN and event.pressed:
			zoom_level = minf(zoom_level + ZOOM_SPEED, ZOOM_MAX)
			_apply_transform()
		elif event.button_index == MOUSE_BUTTON_MIDDLE:
			_panning = event.pressed
			_last_mouse_pos = event.position

	# Pan with middle mouse drag
	if event is InputEventMouseMotion and _panning:
		var delta: Vector2 = event.position - _last_mouse_pos
		pan_offset += delta * PAN_SPEED
		_last_mouse_pos = event.position
		_apply_transform()


func _apply_transform() -> void:
	# Build isometric position from zoom and pan
	var h_rad := deg_to_rad(ISO_ANGLE_H)
	var v_rad := deg_to_rad(ISO_ANGLE_V)

	var x := cos(h_rad) * zoom_level + pan_offset.x
	var z := sin(h_rad) * zoom_level + pan_offset.y
	var y := tan(v_rad) * zoom_level + 5.0

	position = Vector3(x, y, z)
	look_at(Vector3(pan_offset.x, 0.0, pan_offset.y), Vector3.UP)


func reset_view() -> void:
	zoom_level = 30.0
	pan_offset = Vector2.ZERO
	_apply_transform()
