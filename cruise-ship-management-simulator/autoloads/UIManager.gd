extends Node
# UIManager — platform detection, theme, view switching (Section 13)
# Milestone 1 stub: handles view mode switching signal.

enum ViewMode { BRIDGE, DOLLHOUSE, SEAORAMA }

var current_view: ViewMode = ViewMode.BRIDGE


func switch_to(new_mode: ViewMode) -> void:
	var old_name: String = ViewMode.keys()[current_view]
	var new_name: String = ViewMode.keys()[new_mode]
	current_view = new_mode
	EventBus.view_mode_changed.emit(old_name, new_name)
