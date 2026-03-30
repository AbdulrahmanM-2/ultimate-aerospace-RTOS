
function updatePhysics(state){
  state.velocity += (Math.random()*2-1);
  return state;
}
module.exports = { updatePhysics };
