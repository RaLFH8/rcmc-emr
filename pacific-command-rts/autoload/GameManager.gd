extends Node

# GameManager - Singleton
# Manages game state, scene transitions, game speed

enum GameState {
	MENU,
	IN_GAME,
	PAUSED,
	GAME_OVER
}

var current_state: GameState = GameState.MENU
var game_speed: float = 1.0  # First-class multiplier for all timers
var current_player_faction: String = "philippines"
var match_winner: int = -1  # -1 = no winner, 0 = player, 1 = AI
var ai_difficulty: int = 1  # 0=Easy, 1=Normal, 2=Hard

signal state_changed(new_state: GameState)
signal game_speed_changed(new_speed: float)

func _ready() -> void:
	process_mode = Node.PROCESS_MODE_ALWAYS

func set_state(new_state: GameState) -> void:
	current_state = new_state
	state_changed.emit(new_state)

func set_game_speed(speed: float) -> void:
	game_speed = clamp(speed, 0.1, 4.0)
	Engine.time_scale = game_speed
	game_speed_changed.emit(game_speed)

func pause_game() -> void:
	if current_state == GameState.IN_GAME:
		set_state(GameState.PAUSED)
		get_tree().paused = true

func resume_game() -> void:
	if current_state == GameState.PAUSED:
		set_state(GameState.IN_GAME)
		get_tree().paused = false

func start_match(faction: String) -> void:
	current_player_faction = faction
	match_winner = -1
	set_state(GameState.IN_GAME)
	get_tree().change_scene_to_file("res://scenes/game/GameScene.tscn")

func end_match(winner: int) -> void:
	match_winner = winner
	set_state(GameState.GAME_OVER)

func go_to_main_menu() -> void:
	set_state(GameState.MENU)
	get_tree().paused = false
	Engine.time_scale = 1.0
	get_tree().change_scene_to_file("res://scenes/main_menu/MainMenu.tscn")
