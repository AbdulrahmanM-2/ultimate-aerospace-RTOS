
#include <stdio.h>
#include "rtos/scheduler.h"

// Task declarations
void flight_control_task();
void navigation_task();
void failsafe_task();

int main() {
    int time = 0;

    add_task(flight_control_task, 10);  // 100 Hz
    add_task(navigation_task, 50);      // 20 Hz
    add_task(failsafe_task, 100);      // 10 Hz

    while (1) {
        run_scheduler(time);
        time += 10;
    }

    return 0;
}
