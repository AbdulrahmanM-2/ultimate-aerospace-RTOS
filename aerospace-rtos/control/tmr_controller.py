
def vote(a,b,c):
    if abs(a-b)<0.1: return (a+b)/2
    if abs(a-c)<0.1: return (a+c)/2
    if abs(b-c)<0.1: return (b+c)/2
    return None

def failsafe_mode():
    return {"roll":0,"pitch":0,"throttle":0.5}
