
class Task {
  constructor(name, priority, execute) {
    this.name = name;
    this.priority = priority;
    this.execute = execute;
  }
}

class Scheduler {
  constructor() {
    this.queue = [];
    this.init();
  }

  init() {
    this.addTask(new Task("FlightControl", 5, () => {}));
    this.addTask(new Task("Navigation", 3, () => {}));
    this.addTask(new Task("Telemetry", 1, () => {}));
  }

  addTask(task) {
    this.queue.push(task);
    this.queue.sort((a,b)=>b.priority-a.priority);
  }

  run() {
    const t = this.queue.shift();
    if (!t) return;
    t.execute();
    this.addTask(t);
  }
}

module.exports = { Scheduler };
