extends Node
class_name NavSetup

# Runtime NavigationRegion2D setup
# Automatically creates a walkable navigation polygon based on map size
# This avoids requiring the user to manually bake nav mesh in the editor

@export var map_width_tiles: int = 40
@export var map_height_tiles: int = 30
@export var tile_size: int = 64

var nav_region: NavigationRegion2D = null

func _ready() -> void:
	call_deferred("_setup_navigation")

func _setup_navigation() -> void:
	# Create NavigationRegion2D at runtime
	nav_region = NavigationRegion2D.new()
	nav_region.name = "NavigationRegion2D"
	get_parent().add_child(nav_region)
	
	# Create a navigation polygon covering the entire map
	# Water tiles will be excluded by the TerrainManager at move time
	var nav_poly = NavigationPolygon.new()
	
	var map_w = map_width_tiles * tile_size
	var map_h = map_height_tiles * tile_size
	
	# Outer boundary (walkable area)
	var outline = PackedVector2Array([
		Vector2(0, 0),
		Vector2(map_w, 0),
		Vector2(map_w, map_h),
		Vector2(0, map_h)
	])
	nav_poly.add_outline(outline)
	nav_poly.make_polygons_from_outlines()
	nav_region.navigation_polygon = nav_poly
	
	print("[NavSetup] Navigation region created: %dx%d tiles (%dx%d px)" % [
		map_width_tiles, map_height_tiles, map_w, map_h
	])

func get_nav_region() -> NavigationRegion2D:
	return nav_region
