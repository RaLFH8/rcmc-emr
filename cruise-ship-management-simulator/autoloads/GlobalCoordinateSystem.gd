extends Node
# GlobalCoordinateSystem — origin-shifting, 64-bit world position (Section 113)
# The ship is ALWAYS at Vector3.ZERO in local space.
# The world moves around the ship, not the other way around.
# This MUST be implemented from day one — cannot be retrofitted.

# Ship world position stored as lat/lon (float64 precision)
var ship_world_pos: Vector2 = Vector2(25.7617, -80.1918)  # Miami default

# Metres per degree of latitude (constant)
const METRES_PER_LAT_DEGREE: float = 111320.0

# Earth radius in km
const EARTH_RADIUS_KM: float = 6371.0

# All world objects that need repositioning each frame
# Register via register_world_object() / unregister_world_object()
var _world_objects: Array[Node3D] = []


func _process(_delta: float) -> void:
	_update_world_objects()


# Convert a lat/lon world position to a local 3D position relative to ship
func geo_to_local(world_lat_lon: Vector2) -> Vector3:
	var offset := world_lat_lon - ship_world_pos
	var x := offset.y * cos(deg_to_rad(ship_world_pos.x)) * METRES_PER_LAT_DEGREE
	var z := offset.x * METRES_PER_LAT_DEGREE
	return Vector3(x, 0.0, z)


# Distance in km between two lat/lon points (Haversine formula)
func haversine_km(a: Vector2, b: Vector2) -> float:
	var dlat := deg_to_rad(b.x - a.x)
	var dlon := deg_to_rad(b.y - a.y)
	var sin_dlat := sin(dlat * 0.5)
	var sin_dlon := sin(dlon * 0.5)
	var h := sin_dlat * sin_dlat + \
			cos(deg_to_rad(a.x)) * cos(deg_to_rad(b.x)) * sin_dlon * sin_dlon
	return 2.0 * EARTH_RADIUS_KM * asin(sqrt(h))


# Initial bearing in degrees (0–360) from point a to point b
func initial_bearing(a: Vector2, b: Vector2) -> float:
	var dlon := deg_to_rad(b.y - a.y)
	var x := sin(dlon) * cos(deg_to_rad(b.x))
	var y := cos(deg_to_rad(a.x)) * sin(deg_to_rad(b.x)) - \
			sin(deg_to_rad(a.x)) * cos(deg_to_rad(b.x)) * cos(dlon)
	return fmod(rad_to_deg(atan2(x, y)) + 360.0, 360.0)


# Advance a lat/lon position by distance_km on bearing_deg
func advance_position(pos: Vector2, bearing_deg: float, distance_km: float) -> Vector2:
	var d := distance_km / EARTH_RADIUS_KM
	var lat1 := deg_to_rad(pos.x)
	var lon1 := deg_to_rad(pos.y)
	var brng := deg_to_rad(bearing_deg)
	var lat2 := asin(sin(lat1) * cos(d) + cos(lat1) * sin(d) * cos(brng))
	var lon2 := lon1 + atan2(sin(brng) * sin(d) * cos(lat1), cos(d) - sin(lat1) * sin(lat2))
	return Vector2(rad_to_deg(lat2), rad_to_deg(lon2))


# Distance from ship to a lat/lon point in km
func distance_to(target: Vector2) -> float:
	return haversine_km(ship_world_pos, target)


# Move the ship to a new world position (called by BridgeController each frame)
func set_ship_position(new_lat_lon: Vector2) -> void:
	ship_world_pos = new_lat_lon
	EventBus.ship_position_updated.emit(ship_world_pos.x, ship_world_pos.y)


# Register a Node3D to be repositioned each frame relative to ship
func register_world_object(obj: Node3D) -> void:
	if obj not in _world_objects:
		_world_objects.append(obj)


func unregister_world_object(obj: Node3D) -> void:
	_world_objects.erase(obj)


# Reposition all registered world objects relative to current ship position
func _update_world_objects() -> void:
	for obj in _world_objects:
		if is_instance_valid(obj) and obj.has_meta("world_pos"):
			var wpos: Vector2 = obj.get_meta("world_pos")
			obj.position = geo_to_local(wpos)
