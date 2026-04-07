extends Node
class_name SeasonChallenges

# Season Challenges (Improvement #12)
# Free monthly challenges, cosmetic rewards only, no payment required

class Challenge:
	var id: String
	var title: String
	var description: String
	var type: String       # "win_matches", "kill_units", "use_hero", "capture_points", etc.
	var target_value: int
	var current_value: int = 0
	var reward_type: String  # "unit_skin", "flag_color", "title", "portrait_frame"
	var reward_id: String
	var reward_name: String
	var is_completed: bool = false
	var expires_at: String  # ISO date string

# Current active challenges (refreshed monthly)
var active_challenges: Array = []
var completed_challenge_ids: Array[String] = []
var unlocked_cosmetics: Array[String] = []

signal challenge_completed(challenge_id: String, reward_id: String)
signal challenge_progress(challenge_id: String, current: int, target: int)

func _ready() -> void:
	_load_progress()
	_refresh_if_needed()

func _refresh_if_needed() -> void:
	# In production: check server date. For now, generate static monthly set.
	if active_challenges.is_empty():
		_generate_monthly_challenges()

func _generate_monthly_challenges() -> void:
	active_challenges.clear()
	
	var month_challenges = [
		_make_challenge("win_5_matches", "Veteran Commander",
			"Win 5 matches in any mode", "win_matches", 5,
			"unit_skin", "rifleman_veteran_skin", "Veteran Rifleman Skin"),
		_make_challenge("kill_50_units", "Battlefield Dominator",
			"Destroy 50 enemy units", "kill_units", 50,
			"flag_color", "gold_flag", "Gold Flag Color"),
		_make_challenge("use_hero_10", "Hero's Journey",
			"Deploy a hero in 10 matches", "use_hero", 10,
			"portrait_frame", "hero_frame", "Hero Portrait Frame"),
		_make_challenge("capture_10_points", "Territory Control",
			"Capture 10 neutral capture points", "capture_points", 10,
			"title", "title_conqueror", "Title: The Conqueror"),
		_make_challenge("win_hard_ai", "Iron Will",
			"Win a match against Hard AI", "win_vs_hard", 1,
			"unit_skin", "elite_tank_skin", "Elite Tank Skin"),
	]
	active_challenges = month_challenges

func _make_challenge(id: String, title: String, desc: String,
	type: String, target: int, reward_type: String,
	reward_id: String, reward_name: String) -> Challenge:
	var c = Challenge.new()
	c.id = id
	c.title = title
	c.description = desc
	c.type = type
	c.target_value = target
	c.current_value = 0
	c.reward_type = reward_type
	c.reward_id = reward_id
	c.reward_name = reward_name
	c.is_completed = id in completed_challenge_ids
	if c.is_completed:
		c.current_value = target
	return c

func record_event(event_type: String, value: int = 1) -> void:
	for challenge in active_challenges:
		if challenge.is_completed:
			continue
		if challenge.type == event_type:
			challenge.current_value = min(challenge.current_value + value, challenge.target_value)
			challenge_progress.emit(challenge.id, challenge.current_value, challenge.target_value)
			if challenge.current_value >= challenge.target_value:
				_complete_challenge(challenge)

func _complete_challenge(challenge: Challenge) -> void:
	challenge.is_completed = true
	if challenge.id not in completed_challenge_ids:
		completed_challenge_ids.append(challenge.id)
	if challenge.reward_id not in unlocked_cosmetics:
		unlocked_cosmetics.append(challenge.reward_id)
	challenge_completed.emit(challenge.id, challenge.reward_id)
	_save_progress()

func get_active_challenges() -> Array:
	return active_challenges

func _save_progress() -> void:
	var data = {
		"completed": completed_challenge_ids,
		"cosmetics": unlocked_cosmetics
	}
	var file = FileAccess.open("user://challenges.json", FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(data))
		file.close()

func _load_progress() -> void:
	if not FileAccess.file_exists("user://challenges.json"):
		return
	var file = FileAccess.open("user://challenges.json", FileAccess.READ)
	if not file:
		return
	var json = JSON.new()
	json.parse(file.get_as_text())
	file.close()
	var data = json.get_data()
	if data is Dictionary:
		completed_challenge_ids = data.get("completed", [])
		unlocked_cosmetics = data.get("cosmetics", [])
