extends Node
# ViewportManager — Bridge ↔ Dollhouse view switching with 0.8s crossfade (Section 17.1)

enum ViewMode { BRIDGE, DOLLHOUSE }

var current_mode: ViewMode = ViewMode.BRIDGE
var _transitioning: bool = false

var _inactive_container: SubViewportContainer
var _exterior_camera: Camera3D
var _interior_camera: Camera3D
var _fade_overlay: ColorRect


func _ready() -> void:
	_inactive_container = get_node("../InactiveViewportContainer")
	_exterior_camera = get_node("../../ShipNode/Camera3D")
	_fade_overlay = get_node("../FadeOverlay")

	# Instantiate InteriorLayer inside the SubViewport
	var interior_scene := preload("res://scenes/navigation/InteriorLayer.tscn")
	var interior_vp := get_node("../InactiveViewportContainer/InactiveSubViewport") as SubViewport
	for child in interior_vp.get_children():
		child.queue_free()
	var interior_instance := interior_scene.instantiate()
	interior_vp.add_child(interior_instance)
	_interior_camera = interior_instance.get_node("DollhouseCamera") as Camera3D
	if _interior_camera:
		_interior_camera.current = true

	_apply_mode(ViewMode.BRIDGE)


func _unhandled_input(event: InputEvent) -> void:
	if event is InputEventKey and event.pressed and not event.echo:
		if event.keycode == KEY_TAB and not _transitioning:
			_toggle_view()


func _toggle_view() -> void:
	var new_mode := ViewMode.DOLLHOUSE if current_mode == ViewMode.BRIDGE else ViewMode.BRIDGE
	_transitioning = true

	# Fade out → switch → fade in
	var tween := create_tween()
	tween.tween_property(_fade_overlay, "color", Color(0, 0, 0, 1), 0.3)
	tween.tween_callback(_apply_mode.bind(new_mode))
	tween.tween_property(_fade_overlay, "color", Color(0, 0, 0, 0), 0.3)
	tween.tween_callback(func(): _transitioning = false)


func _apply_mode(mode: ViewMode) -> void:
	current_mode = mode
	match mode:
		ViewMode.BRIDGE:
			if _exterior_camera:
				_exterior_camera.current = true
			_inactive_container.visible = false
			UIManager.switch_to(UIManager.ViewMode.BRIDGE)
			print("[ViewportManager] Switched to BRIDGE view")
		ViewMode.DOLLHOUSE:
			_inactive_container.visible = true
			if _exterior_camera:
				_exterior_camera.current = false
			UIManager.switch_to(UIManager.ViewMode.DOLLHOUSE)
			print("[ViewportManager] Switched to DOLLHOUSE view")

	var old_name: String = ViewMode.keys()[current_mode]
	EventBus.view_mode_changed.emit(old_name, ViewMode.keys()[mode])
