from math import cos, pi, exp
from random import random, randint


# Rastrigin function: many local minima, the global minimum is f(0, 0) = 0
def f(position):
    return 10 * len(position) + sum(x * x - 10 * cos(2 * pi * x) for x in position)


class WhaleOptimizationAlgorithm:

    def __init__(self, min_x, max_x, dimensions=2, n_whales=20, max_iteration=100):
        self.min_x = min_x
        self.max_x = max_x
        self.dimensions = dimensions
        self.max_iteration = max_iteration
        self.whales = [[min_x + (max_x - min_x) * random() for _ in range(dimensions)] for _ in range(n_whales)]
        self.best = min(self.whales, key=f)[:]

    def run(self):

        for iteration in range(self.max_iteration):
            # a decreases linearly from 2 to 0 (like in the grey wolf optimizer)
            a = 2 - 2 * iteration / self.max_iteration

            for i, whale in enumerate(self.whales):
                A = 2 * a * random() - a
                C = 2 * random()
                p = random()
                l = 2 * random() - 1

                if p < 0.5:
                    if abs(A) < 1:
                        # shrinking encircling: swim towards the best whale (the prey)
                        new_position = [b - A * abs(C * b - x) for x, b in zip(whale, self.best)]
                    else:
                        # exploration: swim relative to a RANDOM whale (|A| >= 1 -> away from the prey)
                        other = self.whales[randint(0, len(self.whales) - 1)]
                        new_position = [o - A * abs(C * o - x) for x, o in zip(whale, other)]
                else:
                    # bubble-net attack: a logarithmic spiral around the prey (humpback whales swim in a spiral)
                    new_position = [abs(b - x) * exp(l) * cos(2 * pi * l) + b for x, b in zip(whale, self.best)]

                self.whales[i] = [min(self.max_x, max(self.min_x, x)) for x in new_position]

            candidate = min(self.whales, key=f)

            if f(candidate) < f(self.best):
                self.best = candidate[:]

        print('Solution: %s with value: %s' % (self.best, f(self.best)))


if __name__ == '__main__':
    algorithm = WhaleOptimizationAlgorithm(min_x=-5.12, max_x=5.12)
    algorithm.run()
