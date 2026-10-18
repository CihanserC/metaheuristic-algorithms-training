from math import cos, pi
from random import random, gauss


# Rastrigin function: many local minima, the global minimum is f(0, 0) = 0
def f(position):
    return 10 * len(position) + sum(x * x - 10 * cos(2 * pi * x) for x in position)


class VariableNeighborhoodSearch:

    # k_max: the number of neighborhoods - the k-th neighborhood is a box of "radius" k * radius
    # ls_steps / ls_step: the budget and the step size of the local search that follows every shaking
    def __init__(self, min_x, max_x, dimensions=2, radius=0.04, k_max=6, ls_steps=25, ls_step=0.02,
                 max_iteration=120):
        self.min_x = min_x
        self.max_x = max_x
        self.dimensions = dimensions
        self.width = max_x - min_x
        self.radius = radius * self.width
        self.k_max = k_max
        self.ls_steps = ls_steps
        self.ls_step = ls_step * self.width
        self.max_iteration = max_iteration
        self.actual_state = [min_x + self.width * random() for _ in range(dimensions)]

    def run(self):

        k = 1

        for _ in range(self.max_iteration):
            # 1. shaking: a random point from the k-th neighborhood (the bigger k the farther we jump)
            shaken = [self.clamp(x + (2 * random() - 1) * k * self.radius) for x in self.actual_state]

            # 2. local search from the shaken point
            candidate = self.local_search(shaken)

            # 3. move or change the neighborhood
            if f(candidate) < f(self.actual_state):
                self.actual_state = candidate
                k = 1
            else:
                k = k % self.k_max + 1

        print('Solution: %s with value: %s' % (self.actual_state, f(self.actual_state)))

    def local_search(self, state):
        for _ in range(self.ls_steps):
            neighbor = [self.clamp(x + gauss(0, self.ls_step)) for x in state]

            if f(neighbor) < f(state):
                state = neighbor

        return state

    def clamp(self, x):
        return min(self.max_x, max(self.min_x, x))


if __name__ == '__main__':
    algorithm = VariableNeighborhoodSearch(min_x=-5.12, max_x=5.12)
    algorithm.run()
