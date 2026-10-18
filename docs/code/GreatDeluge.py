from math import sin
from random import random, uniform


def f(x):
    return sin(x) + 0.5 * sin(3 * x) + 0.25 * sin(7 * x)


class GreatDeluge:

    # depth: how far below the initial value the water level starts
    # rain: how much the water level rises in every iteration (the "cooling rate" of this algorithm)
    def __init__(self, min_x, max_x, delta=0.3, depth=1.5, rain=0.004, max_iteration=800):
        self.min_x = min_x
        self.max_x = max_x
        self.delta = delta
        self.depth = depth
        self.rain = rain
        self.max_iteration = max_iteration
        self.actual_state = min_x + (max_x - min_x) * random()
        self.best_state = self.actual_state

    def run(self):

        # we are maximizing: the level is the minimum quality we accept - and it keeps rising
        level = f(self.actual_state) - self.depth

        for _ in range(self.max_iteration):
            new_state = min(self.max_x, max(self.min_x, self.actual_state + uniform(-self.delta, self.delta)))

            # the only parameter-free rule: accept everything which is above the water level
            # (even if it is worse than the current state)
            if f(new_state) >= level:
                self.actual_state = new_state

            if f(self.actual_state) > f(self.best_state):
                self.best_state = self.actual_state

            # the rain: the water level rises and the search space gradually shrinks to the highest peak
            level += self.rain

        print('Global maximum: x=%s f(x)=%s' % (self.best_state, f(self.best_state)))


if __name__ == '__main__':
    algorithm = GreatDeluge(0, 10)
    algorithm.run()
