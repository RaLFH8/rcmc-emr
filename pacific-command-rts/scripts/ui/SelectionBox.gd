extends Node2D

# Drag-to-select box for multi-unit selection

var is_dragging: bool = false
var drag_start: Vector2 = Vector2.ZERO
var drag_end: Vector2 = Vector2.ZERO

@onready var selection_rect: ColorRect = $SelectionRect

func _ready() -> void:
	if selection_rect:
		selection_rect.visible = false
		selection_rect.color = Color(0.2, 0.8, 0.2, 0.2)

func _input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.button_index == MOUSE_BUTTON_LEFT:
			if event.pressed:
				drag_start = get_global_mouse_position()
				is_dragging = true
				if selection_rect:
					selection_rect.visible = true
			else:
				if is_dragging:
					_finish_selection()
				is_dragging = false
				if selection_rect:
					selection_rect.visible = false
	
	if event is InputEventMouseMotion and is_dragging:
		drag_end = get_global_mouse_position()
		_update_rect()

func _update_rect() -> void:
	if not selection_rect:
		return
	
	var rect = Rect2(drag_start, drag_end - drag_start).abs()
	selection_rect.position = rect.position
	selection_rect.size = rect.size

func _finish_selection() -> void:
	drag_end = get_global_mouse_position()
	var rect = Rect2(drag_start, drag_end - drag_start).abs()
	
	# Only do box select if dragged enough
	if rect.size.length() > 10:
		UnitManager.select_units_in_rect(rect, 0)  # Player 0 only
	
	is_dragging = false
