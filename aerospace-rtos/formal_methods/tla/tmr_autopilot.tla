
----------------------------- MODULE TMR_Autopilot -----------------------------
EXTENDS Naturals, Sequences

VARIABLES laneA, laneB, laneC, voted, state

Init ==
  /\ laneA = 0
  /\ laneB = 0
  /\ laneC = 0
  /\ voted = 0
  /\ state = "NORMAL"

Next ==
  \/ /\ state = "NORMAL"
     /\ voted' = IF laneA = laneB \/ laneA = laneC THEN laneA
                  ELSE IF laneB = laneC THEN laneB
                  ELSE "INVALID"
     /\ state' = IF voted' = "INVALID" THEN "FAILSAFE" ELSE "NORMAL"

  \/ /\ state = "FAILSAFE"
     /\ voted' = 0
     /\ state' = "FAILSAFE"

=============================================================================
