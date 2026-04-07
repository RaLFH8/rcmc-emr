extends Node
# EventBus — global signal bus (Section 64)
# All inter-system communication goes through here.
# No system holds a direct reference to another system.

# === TIME ===
signal hour_changed(hour: int)
signal day_changed(day: int)
signal month_changed(month: int)
signal year_changed(year: int)
signal time_of_day_changed(period: String)

# === NAVIGATION ===
signal ship_position_updated(lat: float, lon: float)
signal waypoint_reached(waypoint_index: int)
signal destination_reached(port_id: String)
signal route_plotted(waypoints: Array)
signal speed_changed(knots: float)
signal heading_changed(degrees: float)
signal protected_area_entered(area_id: String)
signal protected_area_exited(area_id: String)

# === WEATHER ===
signal weather_state_changed(old_state: int, new_state: int)
signal storm_warning_issued(hours_until: float)
signal beaufort_changed(level: int)

# === PASSENGERS ===
signal passenger_satisfaction_changed(passenger_id: int, old_val: float, new_val: float)
signal passenger_complaint_filed(passenger_id: int, complaint_type: String)
signal passenger_need_critical(passenger_id: int, need: String)
signal avg_satisfaction_changed(new_avg: float)
signal passenger_boarded(passenger_id: int)
signal passenger_disembarked(passenger_id: int, rating: float)
signal vip_request_received(vip_id: int)
signal vip_request_fulfilled(vip_id: int)
signal vip_request_failed(vip_id: int)

# === CREW ===
signal crew_leveled_up(crew_id: int)
signal crew_welfare_critical(crew_id: int, welfare: float)
signal crew_resigned(crew_id: int)
signal crew_sick(crew_id: int)
signal union_formed()
signal union_demand_issued(demand_type: String)
signal strike_warning_issued()
signal strike_started()
signal strike_resolved()

# === ECONOMY ===
signal cash_changed(new_amount: float)
signal revenue_earned(amount: float, source: String)
signal expense_paid(amount: float, category: String)
signal loan_payment_due(amount: float)
signal bankruptcy_warning()
signal bankruptcy_event()
signal insurance_claim_available(incident_id: String, payout: float)

# === SHIP ===
signal hull_integrity_changed(new_value: float)
signal engine_condition_changed(new_value: float)
signal engine_breakdown(severity: String)
signal fuel_low_warning(remaining_tonnes: float)
signal food_low_warning(remaining_meals: int)
signal waste_capacity_warning(fill_percent: float)
signal cabin_condition_degraded(cabin_id: int, new_condition: float)
signal upgrade_installed(upgrade_id: String)

# === PORT ===
signal port_arrived(port_id: String)
signal port_departed(port_id: String)
signal berth_assigned(berth_number: int)
signal berth_lost(port_id: String)
signal port_reputation_changed(port_id: String, new_value: float)
signal docking_result(contact_speed: float, result: String)

# === EVENTS ===
signal at_sea_event_fired(event_type: String)
signal at_sea_event_resolved(event_type: String, choice: String, outcome: String)
signal distress_call_received(position: Vector2)
signal contraband_inspection_triggered()
signal casino_closed_coastal()
signal casino_opened()

# === PROGRESSION ===
signal prestige_score_changed(new_score: float)
signal prestige_tier_advanced(new_tier: int)
signal certification_earned(cert_id: String)
signal award_earned(award_id: String)
signal achievement_unlocked(achievement_id: String)
signal end_of_year_review_triggered()

# === UI ===
signal view_mode_changed(old_mode: String, new_mode: String)
signal hud_alert(message: String, severity: String)
signal tutorial_step_completed(step: int)
signal save_requested()
signal load_requested(slot: int)
signal voyage_started()
signal dlc_loaded(dlc_id: String)
