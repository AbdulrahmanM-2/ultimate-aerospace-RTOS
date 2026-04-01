
def check_rules(state):
    violations = []
    if state.get("alt",0) > 150:
        violations.append("ALT_LIMIT")
    return violations
