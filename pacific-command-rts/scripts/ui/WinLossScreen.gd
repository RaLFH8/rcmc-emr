extends CanvasLayer

# Win/Loss overlay — shown when match ends

@onready var result_label: Label = $Panel/VBox/ResultLabel
@onready var subtitle_label: Label = $Panel/VBox/SubtitleLabel
@onready var main_menu_btn: Button = $Panel/VBox/Buttons/MainMenuButton
@onready var retry_btn: Button = $Panel/VBox/Buttons/RetryButton
@onready var panel: Panel = $Panel

const WIN_COLOR  = Color(0.1, 0.8, 0.2)
const LOSS_COLOR = Color(0.8, 0.1, 0.1)

signal retry_requested
signal main_menu_requested

func _ready() -> void:
	visible = false
	if main_menu_btn:
		main_menu_btn.pressed.connect(_on_main_menu)
	if retry_btn:
		retry_btn.pressed.connect(_on_retry)

func show_result(player_won: bool) -> void:
	visible = true
	get_tree().paused = true
	
	if result_label:
		result_label.text = "VICTORY" if player_won else "DEFEAT"
		result_label.modulate = WIN_COLOR if player_won else LOSS_COLOR
	
	if subtitle_label:
		if player_won:
			subtitle_label.text = "Your command center stands. The enemy is defeated."
		else:
			subtitle_label.text = "Your command center has fallen. Regroup and try again."
	
	# Animate in
	if panel:
		panel.modulate.a = 0.0
		var tween = create_tween()
		tween.tween_property(panel, "modulate:a", 1.0, 0.6)

func _on_main_menu() -> void:
	get_tree().paused = false
	main_menu_requested.emit()
	GameManager.go_to_main_menu()

func _on_retry() -> void:
	get_tree().paused = false
	retry_requested.emit()
	GameManager.start_match(GameManager.current_player_faction)
