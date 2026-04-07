extends Node
# EconomyManager — cash, revenue, expenses (Section 8)
# Milestone 1 stub.

var cash: float = 750000.0
var debt: float = 2000000.0
var onboard_revenue_this_voyage: float = 0.0


func add_cash(amount: float, source: String = "") -> void:
	cash += amount
	EventBus.cash_changed.emit(cash)
	if source != "":
		EventBus.revenue_earned.emit(amount, source)


func deduct(amount: float, category: String = "") -> void:
	cash -= amount
	EventBus.cash_changed.emit(cash)
	if category != "":
		EventBus.expense_paid.emit(amount, category)
