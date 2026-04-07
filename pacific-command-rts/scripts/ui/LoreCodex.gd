extends Control
class_name LoreCodex

# Faction Lore Codex (Improvement #15)
# In-game codex with lore entries for factions, heroes, units (text only)

@onready var category_list: ItemList = $HSplit/CategoryList
@onready var entry_list: ItemList = $HSplit/EntryList
@onready var lore_title: Label = $HSplit/ContentPanel/VBox/Title
@onready var lore_text: RichTextLabel = $HSplit/ContentPanel/VBox/LoreText
@onready var close_btn: Button = $CloseButton

const CODEX_DATA: Dictionary = {
	"Factions": {
		"Philippines": {
			"title": "Republic of the Philippines",
			"text": "[b]Passive:[/b] +20% Manpower Regeneration\n\nThe Philippine archipelago has been a crossroads of civilizations for millennia. From the ancient Barangay kingdoms to the revolutionary Katipunan, Filipino warriors have always fought with extraordinary courage against overwhelming odds.\n\nThe Philippine military doctrine emphasizes manpower and resilience. Their forces regenerate manpower faster than any other faction, allowing sustained offensive pressure even after heavy losses.\n\n[b]Historical Note:[/b] The Philippines was the first Asian nation to declare independence from a colonial power, on June 12, 1898."
		},
		"Vietnam": {
			"title": "Socialist Republic of Vietnam",
			"text": "[b]Passive:[/b] +15% Credits from Refineries\n\nVietnam's military history spans over 2,000 years of resistance against foreign domination — Chinese, Mongol, French, and American. Each conflict forged a more resilient and resourceful fighting force.\n\nVietnamese forces excel at economic warfare. Their refineries extract maximum value from every resource, funding a war machine that can outlast any opponent.\n\n[b]Historical Note:[/b] Vietnam defeated the Mongol Empire three times (1258, 1285, 1288) — one of only a handful of nations to do so."
		},
		"Indonesia": {
			"title": "Republic of Indonesia",
			"text": "[b]Passive:[/b] +10% HP for all units\n\nSpanning 17,000 islands and home to over 270 million people, Indonesia is the world's largest archipelago nation. Its warriors are hardened by diverse and demanding terrain.\n\nIndonesian forces are renowned for their physical endurance. Every unit in the Indonesian military carries extra HP, reflecting the resilience bred by island life and centuries of struggle.\n\n[b]Historical Note:[/b] Indonesia's independence proclamation on August 17, 1945 was read by Sukarno just two days after Japan's surrender — a moment of extraordinary boldness."
		},
		"Thailand": {
			"title": "Kingdom of Thailand",
			"text": "[b]Passive:[/b] +20% Fuel Efficiency\n\nThailand is the only Southeast Asian nation never colonized by a European power. Through a combination of diplomatic skill and military strength, the Thai kingdom maintained its independence while neighbors fell.\n\nThai forces are masters of strategic mobility. Their fuel efficiency allows them to project power across vast distances, striking where least expected.\n\n[b]Historical Note:[/b] King Naresuan's elephant duel victory in 1593 secured Thai independence from Burma for centuries and remains a defining moment of national identity."
		},
		"Singapore": {
			"title": "Republic of Singapore",
			"text": "[b]Passive:[/b] +25% Defense Tower Range\n\nFrom a fishing village to one of the world's most advanced military powers in just decades, Singapore's transformation is without parallel. The Lion City's defense doctrine is built on technological superiority and impenetrable fortifications.\n\nSingaporean Defense Towers are the most advanced in the region, with extended range that controls vast areas of sea and sky.\n\n[b]Historical Note:[/b] Singapore maintains one of the highest defense spending rates per capita in the world, reflecting its strategic doctrine of 'poisoned shrimp' — too costly to swallow."
		}
	},
	"Heroes": {
		"Lapu-Lapu": {
			"title": "Lapu-Lapu — Chieftain of Mactan",
			"text": "[b]Faction:[/b] Philippines (Free Hero)\n[b]Era:[/b] c. 1491 – c. 1542\n\nLapu-Lapu was the chieftain of Mactan Island in the Visayas. On April 27, 1521, his warriors defeated the Spanish expedition of Ferdinand Magellan, killing Magellan himself in the Battle of Mactan.\n\nHe is celebrated as the first Filipino hero to resist foreign colonization. His victory was not merely military — it was a declaration that the peoples of the archipelago would not submit without a fight.\n\n[b]Abilities:[/b]\n• [b]Island Defender (Passive):[/b] -30% damage taken on coastal/beach terrain\n• [b]Mactan Ambush (Active):[/b] Vanishes 10s, reappears behind enemies, stuns 3s\n• [b]Datu's Challenge (Ultimate):[/b] Wins any duel within 8 tiles; enemy units lose 50% attack speed for 30s"
		},
		"Gen. Antonio Luna": {
			"title": "General Antonio Luna — The Fiery General",
			"text": "[b]Faction:[/b] Philippines (DLC Hero)\n[b]Era:[/b] 1866 – 1899\n\nAntonio Luna was a pharmacist, journalist, and military general who became one of the most brilliant commanders of the Philippine-American War. Known for his fierce temper and iron discipline, he modernized the Philippine Revolutionary Army.\n\nLuna's tactical genius was matched only by his passion for Philippine independence. He was assassinated in 1899, a loss that many historians believe changed the course of the war.\n\n[b]Abilities:[/b]\n• [b]Iron Discipline (Passive):[/b] Nearby allies gain +15% attack speed\n• [b]Tactical Barrage (Active):[/b] Artillery strike, 120 damage in 80-tile radius\n• [b]General's Command (Ultimate):[/b] All allies +25% damage, +20% speed for 20s"
		},
		"Andres Bonifacio": {
			"title": "Andres Bonifacio — Father of the Revolution",
			"text": "[b]Faction:[/b] Philippines (DLC Hero)\n[b]Era:[/b] 1863 – 1897\n\nAndres Bonifacio was a warehouse worker who rose to found the Katipunan, the secret revolutionary society that launched the Philippine Revolution against Spanish rule in 1896.\n\nA man of the people, Bonifacio's power came not from military rank but from the hearts of ordinary Filipinos. His rallying cry united millions and ignited a revolution that would eventually free the Philippines.\n\n[b]Abilities:[/b]\n• [b]People's Spirit (Passive):[/b] Gains stacking bonuses when allies die nearby\n• [b]Katipunan Rally (Active):[/b] Spawns 4 Riflemen for 30 seconds\n• [b]Cry of Pugad Lawin (Ultimate):[/b] Enemies flee 5s; allies fully healed"
		},
		"Tran Hung Dao": {
			"title": "Tran Hung Dao — Vanquisher of the Mongols",
			"text": "[b]Faction:[/b] Vietnam (Free Hero)\n[b]Era:[/b] 1228 – 1300\n\nTran Hung Dao defeated the Mongol Empire three times, making him one of the greatest military commanders in history. His 'Proclamation to Officers' is a masterpiece of military literature still studied today.\n\nHe is venerated as a national saint in Vietnam. His strategy of avoiding pitched battles, using terrain, and striking supply lines became the template for Vietnamese military doctrine for centuries.\n\n[b]Abilities:[/b]\n• [b]Mongol Bane (Passive):[/b] +30% damage vs units with higher HP\n• [b]River Ambush (Active):[/b] Plants stake traps, 80 damage + 50% slow\n• [b]Bach Dang Tide (Ultimate):[/b] 150 damage + stun on water/coastal tiles"
		}
	},
	"Units": {
		"Rifleman Squad": {
			"title": "Rifleman Squad — Infantry",
			"text": "[b]Armor Type:[/b] Infantry\n[b]Damage Type:[/b] Small Arms\n[b]Supply Cost:[/b] 1\n\nThe backbone of any army. Riflemen are versatile, cheap, and effective against other infantry. They struggle against armored vehicles but excel in jungle terrain where tanks cannot follow.\n\n[b]Strengths:[/b] Cheap, fast to train, effective vs infantry, good in jungle\n[b]Weaknesses:[/b] Weak vs armor, low HP\n\n[b]Counter:[/b] Use Anti-Tank teams against vehicles that threaten your Riflemen."
		},
		"Anti-Tank Team": {
			"title": "Anti-Tank Team — Infantry",
			"text": "[b]Armor Type:[/b] Infantry\n[b]Damage Type:[/b] Armor Piercing\n[b]Supply Cost:[/b] 2\n\nSpecialized infantry equipped with rocket launchers and anti-armor weapons. Devastating against vehicles and buildings, but vulnerable to enemy infantry.\n\n[b]Strengths:[/b] Excellent vs armor, good vs buildings, portable\n[b]Weaknesses:[/b] Vulnerable to infantry, slow fire rate\n\n[b]Tip:[/b] Always escort Anti-Tank teams with Riflemen for protection."
		},
		"Light Tank": {
			"title": "Light Tank — Armor",
			"text": "[b]Armor Type:[/b] Light Armor\n[b]Damage Type:[/b] Cannon\n[b]Supply Cost:[/b] 3\n\nFast and versatile armored vehicle. Light Tanks can push through enemy lines and threaten buildings, but are vulnerable to dedicated anti-armor weapons.\n\n[b]Strengths:[/b] Fast, good vs infantry and buildings, durable\n[b]Weaknesses:[/b] Vulnerable to Anti-Tank teams, slow in jungle\n\n[b]Tip:[/b] Use Light Tanks to exploit breakthroughs after infantry clears the way."
		},
		"Attack Helicopter": {
			"title": "Attack Helicopter — Air",
			"text": "[b]Armor Type:[/b] Air\n[b]Damage Type:[/b] Rockets\n[b]Supply Cost:[/b] 4\n\nThe most powerful unit in the prototype roster. Attack Helicopters ignore terrain, have excellent vision range, and deal heavy damage to all unit types. Extremely expensive.\n\n[b]Strengths:[/b] Ignores terrain, high damage, excellent vision, fast\n[b]Weaknesses:[/b] Very expensive, vulnerable to AA weapons (future update)\n\n[b]Tip:[/b] Use helicopters for scouting and surgical strikes. Don't waste them on infantry."
		}
	}
}

var current_category: String = ""
var current_entry: String = ""

func _ready() -> void:
	if close_btn:
		close_btn.pressed.connect(func(): visible = false)
	if category_list:
		category_list.item_selected.connect(_on_category_selected)
	if entry_list:
		entry_list.item_selected.connect(_on_entry_selected)
	_populate_categories()

func _populate_categories() -> void:
	if not category_list:
		return
	category_list.clear()
	for cat in CODEX_DATA.keys():
		category_list.add_item(cat)

func _on_category_selected(index: int) -> void:
	if not category_list:
		return
	current_category = category_list.get_item_text(index)
	_populate_entries(current_category)

func _populate_entries(category: String) -> void:
	if not entry_list:
		return
	entry_list.clear()
	if not CODEX_DATA.has(category):
		return
	for entry_name in CODEX_DATA[category].keys():
		entry_list.add_item(entry_name)

func _on_entry_selected(index: int) -> void:
	if not entry_list or current_category.is_empty():
		return
	current_entry = entry_list.get_item_text(index)
	_show_entry(current_category, current_entry)

func _show_entry(category: String, entry: String) -> void:
	if not CODEX_DATA.has(category) or not CODEX_DATA[category].has(entry):
		return
	var data = CODEX_DATA[category][entry]
	if lore_title:
		lore_title.text = data.get("title", entry)
	if lore_text:
		lore_text.text = data.get("text", "")

func open_to(category: String, entry: String = "") -> void:
	visible = true
	for i in range(category_list.item_count):
		if category_list.get_item_text(i) == category:
			category_list.select(i)
			_on_category_selected(i)
			break
	if not entry.is_empty():
		for i in range(entry_list.item_count):
			if entry_list.get_item_text(i) == entry:
				entry_list.select(i)
				_on_entry_selected(i)
				break
