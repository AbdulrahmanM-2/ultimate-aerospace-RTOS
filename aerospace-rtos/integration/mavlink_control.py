
from pymavlink import mavutil
import time

master = mavutil.mavlink_connection('udp:127.0.0.1:14540')
master.wait_heartbeat()
print("Connected to PX4")

def send_attitude(roll, pitch, yaw, thrust):
    master.mav.set_attitude_target_send(
        0,
        master.target_system,
        master.target_component,
        0b00000000,
        [1,0,0,0],
        roll,
        pitch,
        yaw,
        thrust
    )

while True:
    send_attitude(0.0, 0.0, 0.0, 0.6)
    time.sleep(0.1)
