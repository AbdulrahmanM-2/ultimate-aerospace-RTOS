
#include "../rtos/scheduler.h"
#include <assert.h>

void dummy_task() {}

int main() {
    add_task(dummy_task, 10);
    run_scheduler(10);
    return 0;
}
