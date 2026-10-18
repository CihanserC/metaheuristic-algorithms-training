from math import sqrt
from random import random
from random import choice
from random import randint


class City:

    def __init__(self):
        self.x = 1000 * random()
        self.y = 1000 * random()


def distance(city1, city2):
    return sqrt((city1.x - city2.x) ** 2 + (city1.y - city2.y) ** 2)


def tour_distance(tour):
    return sum(distance(tour[i], tour[(i + 1) % len(tour)]) for i in range(len(tour)))


class GRASP:

    # GRASP = Greedy Randomized Adaptive Search Procedure
    # alpha = 0 -> pure greedy (nearest neighbor), alpha = 1 -> pure random construction
    def __init__(self, num_cities, alpha=0.2, max_iteration=30):
        self.cities = [City() for _ in range(num_cities)]
        self.alpha = alpha
        self.max_iteration = max_iteration
        self.best_tour = None
        self.best_distance = float('inf')

    def run(self):

        for _ in range(self.max_iteration):
            tour = self.construct()
            tour = self.local_search(tour)

            if tour_distance(tour) < self.best_distance:
                self.best_tour = tour
                self.best_distance = tour_distance(tour)

        print('Solution: %sm' % round(self.best_distance, 3))

    # phase 1: greedy randomized construction
    # at every step we build the restricted candidate list (RCL) and pick a RANDOM element of it
    def construct(self):
        current = self.cities[randint(0, len(self.cities) - 1)]
        tour = [current]
        remaining = [c for c in self.cities if c is not current]

        while remaining:
            costs = [distance(current, c) for c in remaining]
            c_min, c_max = min(costs), max(costs)
            rcl = [c for c, cost in zip(remaining, costs) if cost <= c_min + self.alpha * (c_max - c_min)]

            current = choice(rcl)
            tour.append(current)
            remaining.remove(current)

        return tour

    # phase 2: local search - 2-opt: remove 2 edges and reconnect the tour the other way
    # (we reverse a part of the tour) as long as it shortens the tour
    @staticmethod
    def local_search(tour):
        improved = True

        while improved:
            improved = False
            n = len(tour)

            for i in range(n - 1):
                for j in range(i + 2, n):
                    if i == 0 and j == n - 1:
                        continue

                    a, b, c, d = tour[i], tour[i + 1], tour[j], tour[(j + 1) % n]

                    if distance(a, c) + distance(b, d) < distance(a, b) + distance(c, d) - 1e-9:
                        tour[i + 1:j + 1] = reversed(tour[i + 1:j + 1])
                        improved = True

        return tour


if __name__ == '__main__':
    algorithm = GRASP(14)
    algorithm.run()
