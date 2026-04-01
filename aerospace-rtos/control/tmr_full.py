
def vote(a,b,c):
    votes = [a,b,c]
    return max(set(votes), key=votes.count)
