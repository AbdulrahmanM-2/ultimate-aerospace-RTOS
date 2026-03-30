
function autopilot(state){
  // simple altitude hold + stabilization
  if(state.altitude < 1000){
    state.altitude += 5;
  } else if(state.altitude > 1000){
    state.altitude -= 5;
  }

  state.pitch = (Math.random()*2-1).toFixed(2);
  state.roll = (Math.random()*2-1).toFixed(2);
  state.yaw = (state.yaw + 2) % 360;

  return state;
}

module.exports = { autopilot };
