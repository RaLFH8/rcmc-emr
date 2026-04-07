extends Node
# DeckGridManager — owns all deck grids, provides placement API (Section 114)

var decks: Array[DeckGrid] = []


func _ready() -> void:
	# Milestone 1: one deck
	var deck := DeckGrid.new(12, 40)
	deck.deck_index = 0
	decks.append(deck)


func get_deck(index: int) -> DeckGrid:
	if index < decks.size():
		return decks[index]
	return null


func place_zone(deck_index: int, zone: ZoneData) -> bool:
	var deck := get_deck(deck_index)
	if deck == null:
		return false
	return deck.place_zone(zone)


func get_zones_by_type(zone_type: ZoneData.ZoneType) -> Array[ZoneData]:
	var result: Array[ZoneData] = []
	for deck in decks:
		result.append_array(deck.get_zones_by_type(zone_type))
	return result


func validate_departure_requirements() -> Array[String]:
	var issues: Array[String] = []
	if get_zones_by_type(ZoneData.ZoneType.CABIN).is_empty():
		issues.append("No cabin zones placed")
	if get_zones_by_type(ZoneData.ZoneType.RESTAURANT).is_empty():
		issues.append("No restaurant zone placed")
	return issues
