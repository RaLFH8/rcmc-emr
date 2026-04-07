extends Node
class_name DLCManager

# DLC Manager — handles unlocks, try-before-you-buy (Improvement #11)
# "Try Before You Buy": 1 skirmish vs AI before purchase, ends with unlock prompt

const DLC_CATALOG: Dictionary = {
	# Faction DLCs
	"sea_pack": {
		"name": "SEA Pack",
		"type": "faction_pack",
		"price_usd": 2.99,
		"factions": ["malaysia", "myanmar", "cambodia", "laos", "brunei", "timor_leste"],
		"description": "6 new factions from Southeast Asia"
	},
	# Hero DLCs (Philippines)
	"hero_antonio_luna": {
		"name": "Gen. Antonio Luna",
		"type": "hero",
		"faction": "philippines",
		"hero_id": "antonio_luna",
		"price_usd": 0.99,
		"description": "The Fiery General — tactical artillery and command auras"
	},
	"hero_andres_bonifacio": {
		"name": "Andres Bonifacio",
		"type": "hero",
		"faction": "philippines",
		"hero_id": "andres_bonifacio",
		"price_usd": 0.99,
		"description": "Father of the Revolution — people's champion and rally master"
	},
	# Hero DLCs (Vietnam)
	"hero_nguyen_hue": {
		"name": "Emperor Quang Trung",
		"type": "hero",
		"faction": "vietnam",
		"hero_id": "nguyen_hue",
		"price_usd": 0.99,
		"description": "Lightning warfare specialist — fastest hero in the game"
	},
	# Hero DLCs (Indonesia)
	"hero_sudirman": {
		"name": "Gen. Sudirman",
		"type": "hero",
		"faction": "indonesia",
		"hero_id": "sudirman",
		"price_usd": 0.99,
		"description": "Guerrilla master — never surrenders, gains power when wounded"
	},
	# Hero DLCs (Thailand)
	"hero_taksin": {
		"name": "King Taksin",
		"type": "hero",
		"faction": "thailand",
		"hero_id": "taksin",
		"price_usd": 0.99,
		"description": "The Liberator — reclaims lost territory and inspires surrounded troops"
	},
	# Hero DLCs (Singapore)
	"hero_farquhar": {
		"name": "William Farquhar",
		"type": "hero",
		"faction": "singapore",
		"hero_id": "farquhar",
		"price_usd": 0.99,
		"description": "The Builder — constructs fortifications faster and cheaper"
	},
}

var owned_dlcs: Array[String] = []
var trial_used: Dictionary = {}  # dlc_id -> bool (has used trial)
var trial_active: String = ""    # currently in trial for this DLC

signal dlc_unlocked(dlc_id: String)
signal trial_started(dlc_id: String)
signal trial_ended(dlc_id: String, purchased: bool)

func _ready() -> void:
	_load_ownership()

func owns_dlc(dlc_id: String) -> bool:
	return dlc_id in owned_dlcs

func can_use_trial(dlc_id: String) -> bool:
	return not owns_dlc(dlc_id) and not trial_used.get(dlc_id, false)

func start_trial(dlc_id: String) -> bool:
	if not can_use_trial(dlc_id):
		return false
	trial_active = dlc_id
	trial_used[dlc_id] = true
	trial_started.emit(dlc_id)
	_save_ownership()
	return true

func end_trial(purchased: bool) -> void:
	if trial_active.is_empty():
		return
	var dlc_id = trial_active
	trial_active = ""
	if purchased:
		unlock_dlc(dlc_id)
	trial_ended.emit(dlc_id, purchased)

func unlock_dlc(dlc_id: String) -> void:
	if dlc_id not in owned_dlcs:
		owned_dlcs.append(dlc_id)
		dlc_unlocked.emit(dlc_id)
		_save_ownership()

# Check if a hero is available (owned or currently in trial)
func is_hero_available(hero_id: String) -> bool:
	for dlc_id in DLC_CATALOG:
		var dlc = DLC_CATALOG[dlc_id]
		if dlc.get("hero_id", "") == hero_id:
			if owns_dlc(dlc_id):
				return true
			if trial_active == dlc_id:
				return true
	return false

# Check if a faction is available
func is_faction_available(faction_id: String) -> bool:
	# Base 5 factions always free
	const FREE_FACTIONS = ["philippines", "vietnam", "indonesia", "thailand", "singapore"]
	if faction_id in FREE_FACTIONS:
		return true
	# Check DLC ownership
	for dlc_id in DLC_CATALOG:
		var dlc = DLC_CATALOG[dlc_id]
		if dlc.get("factions", []).has(faction_id):
			return owns_dlc(dlc_id) or trial_active == dlc_id
	return false

func get_dlc_info(dlc_id: String) -> Dictionary:
	return DLC_CATALOG.get(dlc_id, {})

func get_unlock_prompt_text(dlc_id: String) -> String:
	var dlc = DLC_CATALOG.get(dlc_id, {})
	if dlc.is_empty():
		return ""
	return "Enjoyed playing as %s?\nUnlock permanently for $%.2f" % [
		dlc.get("name", "this content"),
		dlc.get("price_usd", 0.99)
	]

func _save_ownership() -> void:
	var data = {"owned": owned_dlcs, "trials": trial_used}
	var file = FileAccess.open("user://dlc_ownership.json", FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(data))
		file.close()

func _load_ownership() -> void:
	if not FileAccess.file_exists("user://dlc_ownership.json"):
		return
	var file = FileAccess.open("user://dlc_ownership.json", FileAccess.READ)
	if not file:
		return
	var json = JSON.new()
	json.parse(file.get_as_text())
	file.close()
	var data = json.get_data()
	if data is Dictionary:
		owned_dlcs = data.get("owned", [])
		trial_used = data.get("trials", {})
