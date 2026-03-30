
function generateTelemetry(state){
  return {
    ...state,
    timestamp: Date.now()
  }
}
module.exports = { generateTelemetry };
