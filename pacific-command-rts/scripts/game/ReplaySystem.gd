extends Node
class_name ReplaySystem

# Replay System (Improvement #9) — records inputs, replays simulation
# No speed control, no fog toggle at launch (confirmed decisions)

const MAX_REPLAY_DURATION: float = 3600.0  # 1 hour max
const REPLAY_VERSION: int = 1

class ReplayFrame:
	var timestamp: float
	var event_type: String  # "move", "attack", "ability", "build", "hero_deploy"
	var player_id: int
	var unit_ids: Array[int]
	var target_pos: Vector2
	var target_id: int
	var extra_data: Dictionary

var is_recording: bool = false
var is_replaying: bool = false
var frames: Array = []
var replay_start_time: float = 0.0
var replay_playback_index: int = 0
var replay_playback_time: float = 0.0

# Match metadata
var match_metadata: Dictionary = {}

signal replay_finished

func _ready() -> void:
	pass

func start_recording(metadata: Dictionary) -> void:
	frames.clear()
	is_recording = true
	is_replaying = false
	replay_start_time = Time.get_ticks_msec() / 1000.0
	match_metadata = metadata
	match_metadata["version"] = REPLAY_VERSION
	match_metadata["timestamp"] = Time.get_datetime_string_from_system()

func stop_recording() -> void:
	is_recording = false

func record_event(event_type: String, player_id: int, unit_ids: Array[int],
	target_pos: Vector2 = Vector2.ZERO, target_id: int = -1,
	extra: Dictionary = {}) -> void:
	if not is_recording:
		return
	var frame = ReplayFrame.new()
	frame.timestamp = (Time.get_ticks_msec() / 1000.0) - replay_start_time
	frame.event_type = event_type
	frame.player_id = player_id
	frame.unit_ids = unit_ids
	frame.target_pos = target_pos
	frame.target_id = target_id
	frame.extra_data = extra
	frames.append(frame)

func save_replay(slot_name: String) -> bool:
	var data = {
		"metadata": match_metadata,
		"frames": []
	}
	for frame in frames:
		data["frames"].append({
			"t": frame.timestamp,
			"e": frame.event_type,
			"p": frame.player_id,
			"u": frame.unit_ids,
			"x": frame.target_pos.x,
			"y": frame.target_pos.y,
			"tid": frame.target_id,
			"ex": frame.extra_data
		})
	
	var path = "user://replays/%s.json" % slot_name
	DirAccess.make_dir_recursive_absolute("user://replays")
	var file = FileAccess.open(path, FileAccess.WRITE)
	if not file:
		return false
	file.store_string(JSON.stringify(data))
	file.close()
	return true

func load_replay(slot_name: String) -> bool:
	var path = "user://replays/%s.json" % slot_name
	if not FileAccess.file_exists(path):
		return false
	var file = FileAccess.open(path, FileAccess.READ)
	if not file:
		return false
	var json = JSON.new()
	json.parse(file.get_as_text())
	file.close()
	var data = json.get_data()
	if not data is Dictionary:
		return false
	
	match_metadata = data.get("metadata", {})
	frames.clear()
	for fd in data.get("frames", []):
		var frame = ReplayFrame.new()
		frame.timestamp = fd.get("t", 0.0)
		frame.event_type = fd.get("e", "")
		frame.player_id = fd.get("p", 0)
		frame.unit_ids = fd.get("u", [])
		frame.target_pos = Vector2(fd.get("x", 0.0), fd.get("y", 0.0))
		frame.target_id = fd.get("tid", -1)
		frame.extra_data = fd.get("ex", {})
		frames.append(frame)
	return true

func get_replay_list() -> Array[Dictionary]:
	var result: Array[Dictionary] = []
	var dir = DirAccess.open("user://replays")
	if not dir:
		return result
	dir.list_dir_begin()
	var fname = dir.get_next()
	while fname != "":
		if fname.ends_with(".json"):
			var slot = fname.replace(".json", "")
			result.append({"slot": slot, "name": slot})
		fname = dir.get_next()
	return result
