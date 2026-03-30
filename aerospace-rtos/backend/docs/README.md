
# ULTRA v10 RTOS Flight Core

## Features
- Deterministic scheduler
- Flight control loop (100 Hz)
- Navigation + failsafe tasks
- Expandable for FreeRTOS / NuttX

## Build
gcc main.c rtos/scheduler.c flight/*.c drivers/*.c -o flight_core

## Run
./flight_core
