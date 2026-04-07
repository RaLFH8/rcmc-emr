extends Control

# Main Menu — faction select, difficulty, start match

@onready var faction_buttons: HBoxContainer = $VBox/FactionSelect/FactionButtons
@onready var difficulty_buttons: HBoxContainer = $VBox/DifficultySelect/DifficultyButtons
@onready var start_button: Button = $VBox/StartButton
@onready var faction_label: Label = $VBox/FactionSelect/SelectedLabel
@onready var faction_lore: Label = $VBox/FactionLore
@onready var version_label: Label = $VBox/VersionLabel

var selected_faction: String = "philippines"
var selected_difficulty: int = 1  # 0=Easy, 1=Normal, 2=Hard

const FACTIONS = ["philippines", "vietnam", "indonesia", "thailand", "singapore"]
const FACTION_NAMES = {
	"philippines": "Philippines",
	"vietnam": "Vietnam",
	"indonesia": "Indonesia",
	"thailand": "Thailand",
	"singapore": "Singapore"
}
const FACTION_PASSIVES = {
	"philippines": "+20% Manpower Regen",
	"vietnam": "+15% Credits from Refineries",
	"indonesia": "+10% HP for all units",
	"thailand": "+20% Fuel Efficiency",
	"singapore": "+25% Defense Tower Range"
}

func _ready() -> void:
	_build_faction_buttons()
	_build_difficulty_buttons()
	_update_faction_display()
	
	if version_label:
		version_label.text = "v0.1.0 Prototype"
	
	start_button.pressed.connect(_on_start_pressed)

func _build_faction_buttons() -> void:
	if not faction_buttons:
		return
	for child in faction_buttons.get_children():
		child.queue_free()
	
	for faction_id in FACTIONS:
		var btn = Button.new()
		btn.text = FACTION_NAMES.get(faction_id, faction_id)
		btn.custom_minimum_size = Vector2(120, 50)
		btn.pressed.connect(_on_faction_selected.bind(faction_id))
		faction_buttons.add_child(btn)

func _build_difficulty_buttons() -> void:
	if not difficulty_buttons:
		return
	var labels = ["Easy", "Normal", "Hard"]
	for i in range(3):
		var btn = Button.new()
		btn.text = labels[i]
		btn.custom_minimum_size = Vector2(90, 40)
		btn.pressed.connect(_on_difficulty_selected.bind(i))
		difficulty_buttons.add_child(btn)

func _on_faction_selected(faction_id: String) -> void:
	selected_faction = faction_id
	_update_faction_display()

func _on_difficulty_selected(difficulty: int) -> void:
	selected_difficulty = difficulty

func _update_faction_display() -> void:
	if faction_label:
		faction_label.text = FACTION_NAMES.get(selected_faction, selected_faction)
	if faction_lore:
		faction_lore.text = FACTION_PASSIVES.get(selected_faction, "")

func _on_start_pressed() -> void:
	GameManager.current_player_faction = selected_faction
	GameManager.ai_difficulty = selected_difficulty
	GameManager.start_match(selected_faction)
