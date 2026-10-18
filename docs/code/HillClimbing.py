from math import sin
from random import random, uniform


def f(x):
    return sin(x) + 0.5 * sin(3 * x) + 0.25 * sin(7 * x)


class HillClimbing:

    # delta: the maximum step size of a single move (the "neighborhood" of the current state)
    # restart: if True we jump to a brand new random state when we are stuck for `patience` iterations
    # (this is the simplest way to escape from a local maximum)
    def __init__(self, min_x, max_x, delta=0.3, restart=True, patience=25, max_iteration=600):
        self.min_x = min_x
        self.max_x = max_x
        self.delta = delta
        self.restart = restart
        self.patience = patience
        self.max_iteration = max_iteration
        self.actual_state = self.generate_random_x()
        self.best_state = self.actual_state

    def run(self):

        stuck = 0

        for _ in range(self.max_iteration):
            new_state = self.generate_neighbor(self.actual_state)

            # unlike simulated annealing we NEVER accept a worse state
            if f(new_state) > f(self.actual_state):
                self.actual_state = new_state
                stuck = 0
            else:
                stuck += 1

            if self.restart and stuck >= self.patience:
                self.actual_state = self.generate_random_x()
                stuck = 0

            if f(self.actual_state) > f(self.best_state):
                self.best_state = self.actual_state

        print('Global maximum: x=%s f(x)=%s' % (self.best_state, f(self.best_state)))

    def generate_neighbor(self, x):
        new_x = x + uniform(-self.delta, self.delta)
        return min(self.max_x, max(self.min_x, new_x))

    def generate_random_x(self):
        return self.min_x + (self.max_x - self.min_x) * random()


if __name__ == '__main__':
    algorithm = HillClimbing(0, 10)
    algorithm.run()
