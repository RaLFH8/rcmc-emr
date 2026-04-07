extends Node3D
# ShipNode — always at Vector3.ZERO (Section 17.1)
# The world moves around this node, not the other way around.
# This is the anchor for all interior simulation.

func _ready() -> void:
	# Enforce: ship is always at origin
	position = Vector3.ZERO
	assert(position == Vector3.ZERO, "ShipNode must always be at Vector3.ZERO")
