
from pymavlink import mavutil

master = mavutil.mavlink_connection('udp:127.0.0.1:14540')
master.wait_heartbeat()

print("Uploading mission...")
# Placeholder for waypoint upload
