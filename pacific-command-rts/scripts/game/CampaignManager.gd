extends Node
class_name CampaignManager

# Campaign Manager — 8 missions, Philippines faction
# Mission 1: Battle of Mactan (tutorial woven into battle)

const CAMPAIGN_MISSIONS: Array[Dictionary] = [
	{
		"id": "mactan",
		"title": "Battle of Mactan",
		"subtitle": "April 27, 1521 — Mactan Island, Philippines",
		"description": "Lapu-Lapu and his warriors face the armored Spanish forces of Ferdinand Magellan. Defend Mactan Island and drive the invaders back to the sea.",
		"map": "res://scenes/maps/mactan.tscn",
		"player_faction": "philippines",
		"ai_faction": "spain_historical",
		"objectives": [
			{"type": "eliminate_hero", "target": "magellan", "description": "Defeat Ferdinand Magellan"},
			{"type": "survive", "duration": 300, "description": "Hold the beach for 5 minutes"}
		],
		"tutorial_steps": [
			"Welcome to Pacific Command. This is the Battle of Mactan, 1521.",
			"Select your units by clicking on them. Select multiple with drag.",
			"Right-click to move. Right-click on an enemy to attack.",
			"Lapu-Lapu is your hero. Deploy him from the Barracks.",
			"Use Lapu-Lapu's Island Defender passive — fight on the beach for -30% damage taken.",
			"Magellan's armor is strong. Use Anti-Tank teams to pierce it.",
			"Victory: Defeat Magellan before his reinforcements arrive."
		],
		"loading_tip": "Lapu-Lapu was the chieftain of Mactan Island. He is the first Filipino hero to resist foreign colonization, defeating the Spanish expedition that killed Ferdinand Magellan on April 27, 1521.",
		"reward_credits": 500,
		"reward_unlock": "antonio_luna_hero"
	},
	{
		"id": "manila_bay",
		"title": "Manila Bay",
		"subtitle": "May 1, 1898 — Manila Bay, Philippines",
		"description": "The Spanish-American War reaches the Philippines. Defend Manila Bay against the American naval fleet while protecting civilian infrastructure.",
		"map": "res://scenes/maps/manila_bay.tscn",
		"player_faction": "philippines",
		"ai_faction": "usa_historical",
		"objectives": [
			{"type": "protect_building", "target": "arsenal", "description": "Protect the Manila Arsenal"},
			{"type": "destroy_buildings", "count": 5, "description": "Destroy 5 enemy naval installations"}
		],
		"loading_tip": "The Battle of Manila Bay was a decisive naval engagement. Commodore George Dewey's Asiatic Squadron destroyed the Spanish Pacific Fleet in just 7 hours, with only 9 Americans wounded.",
		"reward_credits": 600,
		"reward_unlock": "andres_bonifacio_hero"
	},
	{
		"id": "corregidor",
		"title": "The Rock",
		"subtitle": "1942 — Corregidor Island, Philippines",
		"description": "Corregidor Island is the last stronghold. Hold the fortress against overwhelming Japanese forces for as long as possible.",
		"map": "res://scenes/maps/corregidor.tscn",
		"player_faction": "philippines",
		"ai_faction": "japan_historical",
		"objectives": [
			{"type": "survive", "duration": 600, "description": "Hold Corregidor for 10 minutes"},
			{"type": "protect_building", "target": "command_center", "description": "Protect the Command Bunker"}
		],
		"loading_tip": "The fall of Corregidor on May 6, 1942 marked the largest surrender of American-led forces in history. Filipino and American soldiers fought side by side for months against overwhelming odds.",
		"reward_credits": 700,
		"reward_unlock": "map_vietnam_1"
	},
	{
		"id": "leyte_gulf",
		"title": "Leyte Gulf",
		"subtitle": "October 1944 — Leyte Gulf, Philippines",
		"description": "The largest naval battle in history. MacArthur has returned. Coordinate the liberation of Leyte with combined Filipino-American forces.",
		"map": "res://scenes/maps/leyte_gulf.tscn",
		"player_faction": "philippines",
		"ai_faction": "japan_historical",
		"objectives": [
			{"type": "capture_points", "count": 3, "description": "Capture 3 strategic positions"},
			{"type": "eliminate_all", "description": "Eliminate all enemy forces"}
		],
		"loading_tip": "The Battle of Leyte Gulf (October 23-26, 1944) involved over 200,000 naval personnel and is considered the largest naval battle in history. It effectively destroyed the Imperial Japanese Navy as a fighting force.",
		"reward_credits": 800,
		"reward_unlock": "map_indonesia_1"
	},
	{
		"id": "dien_bien_phu",
		"title": "Dien Bien Phu",
		"subtitle": "1954 — Dien Bien Phu Valley, Vietnam",
		"description": "Switch to Vietnam faction. The French have fortified the valley. Surround and overwhelm their garrison using Tran Hung Dao's guerrilla tactics.",
		"map": "res://scenes/maps/dien_bien_phu.tscn",
		"player_faction": "vietnam",
		"ai_faction": "france_historical",
		"objectives": [
			{"type": "capture_points", "count": 5, "description": "Capture all French strongpoints"},
			{"type": "eliminate_hero", "target": "de_castries", "description": "Capture the French command"}
		],
		"loading_tip": "The Battle of Dien Bien Phu (March-May 1954) ended French colonial rule in Indochina. General Vo Nguyen Giap's forces dragged artillery through jungle mountains — an engineering feat the French thought impossible.",
		"reward_credits": 900,
		"reward_unlock": "map_thailand_1"
	},
	{
		"id": "java_war",
		"title": "The Java War",
		"subtitle": "1825 — Central Java, Indonesia",
		"description": "As Prince Diponegoro, lead the Java War against Dutch colonial forces. Use jungle terrain and guerrilla tactics to defeat a superior enemy.",
		"map": "res://scenes/maps/java.tscn",
		"player_faction": "indonesia",
		"ai_faction": "netherlands_historical",
		"objectives": [
			{"type": "eliminate_all", "description": "Drive out all Dutch forces"},
			{"type": "protect_building", "target": "kraton", "description": "Protect the Kraton (Royal Palace)"}
		],
		"loading_tip": "The Java War (1825-1830) was the most costly war the Dutch ever fought in the East Indies. Prince Diponegoro's guerrilla campaign tied down 23,000 Dutch troops and cost the Netherlands 20 million guilders.",
		"reward_credits": 900,
		"reward_unlock": "map_singapore_1"
	},
	{
		"id": "elephant_duel",
		"title": "The Elephant Duel",
		"subtitle": "1593 — Nong Sarai, Thailand",
		"description": "As King Naresuan of Thailand, face the Burmese crown prince in the legendary elephant duel. Defeat the Burmese army and secure Thai independence.",
		"map": "res://scenes/maps/nong_sarai.tscn",
		"player_faction": "thailand",
		"ai_faction": "burma_historical",
		"objectives": [
			{"type": "eliminate_hero", "target": "mingyi_swa", "description": "Defeat Crown Prince Mingyi Swa"},
			{"type": "eliminate_all", "description": "Rout the Burmese army"}
		],
		"loading_tip": "The Battle of Nong Sarai (1593) featured the famous elephant duel between King Naresuan of Siam and Crown Prince Mingyi Swa of Burma. Naresuan's victory secured Siamese independence for centuries.",
		"reward_credits": 1000,
		"reward_unlock": "skirmish_all_factions"
	},
	{
		"id": "singapore_1819",
		"title": "The Lion City",
		"subtitle": "1819 — Singapore Island",
		"description": "As Singapore, build and defend the new trading port against rival powers. Establish dominance through superior fortifications and strategic positioning.",
		"map": "res://scenes/maps/singapore_island.tscn",
		"player_faction": "singapore",
		"ai_faction": "johor_historical",
		"objectives": [
			{"type": "build_buildings", "count": 5, "description": "Establish 5 key installations"},
			{"type": "survive", "duration": 480, "description": "Hold the port for 8 minutes"},
			{"type": "capture_points", "count": 2, "description": "Control both strategic straits"}
		],
		"loading_tip": "Sang Nila Utama founded Singapura around 1299 CE. The city became a major trading hub of the Srivijayan Empire before being refounded as a British trading post by Stamford Raffles in 1819.",
		"reward_credits": 1200,
		"reward_unlock": "campaign_complete_badge"
	}
]

var current_mission_index: int = 0
var completed_missions: Array[String] = []
var mission_stars: Dictionary = {}  # mission_id -> 1/2/3 stars

signal mission_completed(mission_id: String, stars: int)
signal campaign_completed

func _ready() -> void:
	_load_progress()

func get_current_mission() -> Dictionary:
	if current_mission_index < CAMPAIGN_MISSIONS.size():
		return CAMPAIGN_MISSIONS[current_mission_index]
	return {}

func get_mission(mission_id: String) -> Dictionary:
	for m in CAMPAIGN_MISSIONS:
		if m["id"] == mission_id:
			return m
	return {}

func is_mission_unlocked(mission_id: String) -> bool:
	if mission_id == CAMPAIGN_MISSIONS[0]["id"]:
		return true
	var idx = _get_mission_index(mission_id)
	if idx <= 0:
		return false
	var prev = CAMPAIGN_MISSIONS[idx - 1]
	return prev["id"] in completed_missions

func complete_mission(mission_id: String, stars: int) -> void:
	if mission_id not in completed_missions:
		completed_missions.append(mission_id)
	mission_stars[mission_id] = max(mission_stars.get(mission_id, 0), stars)
	
	var idx = _get_mission_index(mission_id)
	if idx >= 0:
		current_mission_index = min(idx + 1, CAMPAIGN_MISSIONS.size() - 1)
	
	mission_completed.emit(mission_id, stars)
	
	if completed_missions.size() >= CAMPAIGN_MISSIONS.size():
		campaign_completed.emit()
	
	_save_progress()

func _get_mission_index(mission_id: String) -> int:
	for i in range(CAMPAIGN_MISSIONS.size()):
		if CAMPAIGN_MISSIONS[i]["id"] == mission_id:
			return i
	return -1

func _save_progress() -> void:
	var data = {
		"completed": completed_missions,
		"stars": mission_stars,
		"current_index": current_mission_index
	}
	var file = FileAccess.open("user://campaign_progress.json", FileAccess.WRITE)
	if file:
		file.store_string(JSON.stringify(data))
		file.close()

func _load_progress() -> void:
	if not FileAccess.file_exists("user://campaign_progress.json"):
		return
	var file = FileAccess.open("user://campaign_progress.json", FileAccess.READ)
	if not file:
		return
	var json = JSON.new()
	json.parse(file.get_as_text())
	file.close()
	var data = json.get_data()
	if data is Dictionary:
		completed_missions = data.get("completed", [])
		mission_stars = data.get("stars", {})
		current_mission_index = data.get("current_index", 0)
