extends Node

# Save System - dirty flag auto-save (confirmed decision)
# 3 campaign slots + 1 auto-save

const SAVE_DIR: String = "user://saves/"
const AUTO_SAVE_PATH: String = "user://saves/autosave.json"
const SAVE_INTERVAL: float = 60.0  # Auto-save every 60 seconds

var dirty: bool = false
var auto_save_timer: float = 0.0

var save_data: Dictionary = {
	"campaign_progress": {
		"current_mission": 0,
		"completed_missions": [],
		"unlocked_heroes": ["lapu_lapu"]
	},
	"player_profile": {
		"faction": "philippines",
		"total_matches": 0,
		"wins": 0
	},
	"settings": {
		"audio_volume": 1.0,
		"ui_scale": 1.0,
		"color_blind_mode": false
	}
}

func _ready() -> void:
	_ensure_save_dir()
	load_auto_save()

func _process(delta: float) -> void:
	if dirty:
		auto_save_timer -= delta
		if auto_save_timer <= 0.0:
			auto_save()
			auto_save_timer = SAVE_INTERVAL

func mark_dirty() -> void:
	dirty = true
	if auto_save_timer <= 0.0:
		auto_save_timer = SAVE_INTERVAL

func auto_save() -> void:
	_write_save(AUTO_SAVE_PATH, save_data)
	dirty = false

func save_to_slot(slot: int) -> void:
	var path = "user://saves/slot_%d.json" % slot
	_write_save(path, save_data)

func load_from_slot(slot: int) -> bool:
	var path = "user://saves/slot_%d.json" % slot
	return _read_save(path)

func load_auto_save() -> bool:
	return _read_save(AUTO_SAVE_PATH)

func _write_save(path: String, data: Dictionary) -> void:
	var file = FileAccess.open(path, FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(data, "\t"))
		file.close()

func _read_save(path: String) -> bool:
	if not FileAccess.file_exists(path):
		return false
	var file = FileAccess.open(path, FileAccess.READ)
	if not file:
		return false
	var json = JSON.new()
	var err = json.parse(file.get_as_text())
	file.close()
	if err == OK:
		save_data = json.get_data()
		return true
	return false

func _ensure_save_dir() -> void:
	if not DirAccess.dir_exists_absolute(SAVE_DIR):
		DirAccess.make_dir_absolute(SAVE_DIR)

func update_campaign_progress(mission: int) -> void:
	save_data["campaign_progress"]["current_mission"] = mission
	if mission not in save_data["campaign_progress"]["completed_missions"]:
		save_data["campaign_progress"]["completed_missions"].append(mission)
	mark_dirty()

func unlock_hero(hero_id: String) -> void:
	if hero_id not in save_data["campaign_progress"]["unlocked_heroes"]:
		save_data["campaign_progress"]["unlocked_heroes"].append(hero_id)
	mark_dirty()
