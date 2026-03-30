
#ifndef SCHEDULER_H
#define SCHEDULER_H

typedef struct {
    void (*task_func)(void);
    int period_ms;
    int last_run;
} Task;

void add_task(void (*func)(void), int period_ms);
void run_scheduler(int current_time);

#endif
