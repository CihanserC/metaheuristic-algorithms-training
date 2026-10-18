from math import cos, pi
from random import random


# Rastrigin function: many local minima, the global minimum is f(0, 0) = 0
def f(position):
    return 10 * len(position) + sum(x * x - 10 * cos(2 * pi * x) for x in position)


class GreyWolfOptimizer:

    # the 3 best wolves are called alpha, beta and delta - they lead the hunt (the search)
    # all the other wolves (omegas) update their positions according to the 3 leaders
    def __init__(self, min_x, max_x, dimensions=2, n_wolves=20, max_iteration=100):
        self.min_x = min_x
        self.max_x = max_x
        self.dimensions = dimensions
        self.max_iteration = max_iteration
        self.wolves = [[min_x + (max_x - min_x) * random() for _ in range(dimensions)]
                       for _ in range(n_wolves)]

    def run(self):

        for iteration in range(self.max_iteration):
            leaders = sorted(self.wolves, key=f)[:3]

            # a decreases linearly from 2 to 0:
            # |A| > 1 -> the wolves diverge from the prey (exploration)
            # |A| < 1 -> the wolves attack the prey (exploitation)
            a = 2 - 2 * iteration / self.max_iteration

            for wolf in self.wolves:
                for d in range(self.dimensions):
                    candidates = []

                    for leader in leaders:
                        A = 2 * a * random() - a
                        C = 2 * random()
                        D = abs(C * leader[d] - wolf[d])
                        candidates.append(leader[d] - A * D)

                    # the new position is the average of the moves towards alpha, beta and delta
                    wolf[d] = min(self.max_x, max(self.min_x, sum(candidates) / 3))

        best = min(self.wolves, key=f)
        print('Solution: %s with value: %s' % (best, f(best)))


if __name__ == '__main__':
    algorithm = GreyWolfOptimizer(min_x=-5.12, max_x=5.12)
    algorithm.run()
