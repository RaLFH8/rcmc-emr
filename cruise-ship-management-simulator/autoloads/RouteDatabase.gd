extends Node
# RouteDatabase — all route, port, depth, current data (Section 68)
# Stub for Milestone 1. Full implementation in Milestone 2.

var _ports: Dictionary = {}
var _routes: Dictionary = {}


func _ready() -> void:
	_register_starter_ports()


func get_port(port_id: String) -> Dictionary:
	return _ports.get(port_id, {})


func get_route(route_id: String) -> Dictionary:
	return _routes.get(route_id, {})


func _register_starter_ports() -> void:
	# Miami — starter port
	_ports["miami"] = {
		"id": "miami",
		"display_name": "Miami, FL",
		"country": "USA",
		"lat": 25.7617,
		"lon": -80.1918,
		"region": "caribbean",
		"berth_count": 8,
		"berth_fee_base": 12000.0,
		"port_tax_rate": 0.035,
		"unlock_tier": 0,
	}
	# Nassau — starter destination
	_ports["nassau"] = {
		"id": "nassau",
		"display_name": "Nassau, Bahamas",
		"country": "Bahamas",
		"lat": 25.0480,
		"lon": -77.3554,
		"region": "caribbean",
		"berth_count": 4,
		"berth_fee_base": 6500.0,
		"port_tax_rate": 0.015,
		"unlock_tier": 0,
	}
	# Tutorial route
	_routes["miami_nassau"] = {
		"id": "miami_nassau",
		"origin_port_id": "miami",
		"destination_port_id": "nassau",
		"display_name": "Caribbean Hop",
		"distance_km": 320.0,
		"estimated_duration_hours": 18.0,
		"region": "caribbean",
		"prestige_level": 1,
		"unlock_tier": 0,
	}
