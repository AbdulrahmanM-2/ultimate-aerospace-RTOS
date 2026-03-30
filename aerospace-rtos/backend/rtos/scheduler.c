
#include "scheduler.h"
#include <stdio.h>

#define MAX_TASKS 10

static Task tasks[MAX_TASKS];
static int task_count = 0;

void add_task(void (*func)(void), int period_ms) {
    tasks[task_count].task_func = func;
    tasks[task_count].period_ms = period_ms;
    tasks[task_count].last_run = 0;
    task_count++;
}

void run_scheduler(int current_time) {
    for (int i = 0; i < task_count; i++) {
        if (current_time - tasks[i].last_run >= tasks[i].period_ms) {
            tasks[i].task_func();
            tasks[i].last_run = current_time;
        }
    }
}
