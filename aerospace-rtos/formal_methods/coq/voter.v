
Require Import Reals.

Definition majority (a b c : R) : option R :=
  if Rle_dec (Rabs (a - b)) 0.1 then Some ((a + b)/2)
  else if Rle_dec (Rabs (a - c)) 0.1 then Some ((a + c)/2)
  else if Rle_dec (Rabs (b - c)) 0.1 then Some ((b + c)/2)
  else None.

Theorem majority_valid :
  forall a b c,
  Rabs (a - b) <= 0.1 ->
  exists v, majority a b c = Some v.
Proof.
  intros.
  unfold majority.
  destruct (Rle_dec (Rabs (a - b)) 0.1).
  - exists ((a + b)/2). reflexivity.
  - contradiction.
Qed.
