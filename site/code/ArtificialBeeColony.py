from math import cos, pi
from random import random, randint, uniform


# Rastrigin function: many local minima, the global minimum is f(0, 0) = 0
def f(position):
    return 10 * len(position) + sum(x * x - 10 * cos(2 * pi * x) for x in position)


class FoodSource:

    def __init__(self, min_x, max_x, dimensions):
        self.position = [min_x + (max_x - min_x) * random() for _ in range(dimensions)]
        self.value = f(self.position)
        # how many times in a row we failed to improve this source
        self.trial = 0

    # the fitness is bigger for the smaller (better) objective values
    def fitness(self):
        return 1 / (1 + self.value) if self.value >= 0 else 1 + abs(self.value)


class ArtificialBeeColony:

    # sn: number of food sources (= number of employed bees = number of onlooker bees)
    # limit: after `limit` failed attempts the source is abandoned and a scout bee finds a new one
    def __init__(self, min_x, max_x, dimensions=2, sn=20, limit=20, max_iteration=100):
        self.min_x = min_x
        self.max_x = max_x
        self.dimensions = dimensions
        self.limit = limit
        self.max_iteration = max_iteration
        self.sources = [FoodSource(min_x, max_x, dimensions) for _ in range(sn)]
        best = min(self.sources, key=lambda s: s.value)
        self.best_position, self.best_value = best.position[:], best.value

    def run(self):

        for _ in range(self.max_iteration):
            # 1. employed bees: every bee explores the neighborhood of its own food source
            for i in range(len(self.sources)):
                self.search_neighbor(i)

            # 2. onlooker bees: they choose a source with probability proportional to its fitness
            # (roulette wheel) - the better the source, the more bees visit it
            total = sum(s.fitness() for s in self.sources)
            for _ in range(len(self.sources)):
                r = random() * total
                for i, source in enumerate(self.sources):
                    r -= source.fitness()
                    if r <= 0:
                        break
                self.search_neighbor(i)

            # 3. scout bees: exhausted sources are abandoned and replaced with random ones
            for i, source in enumerate(self.sources):
                if source.trial > self.limit:
                    self.sources[i] = FoodSource(self.min_x, self.max_x, self.dimensions)

            self.memorize_best()

        print('Solution: %s with value: %s' % (self.best_position, self.best_value))

    # v_j = x_j + phi * (x_j - x_k)  where phi in [-1, 1], k is another source, j is a random coordinate
    def search_neighbor(self, i):
        source = self.sources[i]
        k = i
        while k == i:
            k = randint(0, len(self.sources) - 1)

        j = randint(0, self.dimensions - 1)
        candidate = source.position[:]
        candidate[j] += uniform(-1, 1) * (candidate[j] - self.sources[k].position[j])
        candidate[j] = min(self.max_x, max(self.min_x, candidate[j]))

        candidate_value = f(candidate)

        # greedy selection
        if candidate_value < source.value:
            source.position, source.value, source.trial = candidate, candidate_value, 0
        else:
            source.trial += 1

    def memorize_best(self):
        for source in self.sources:
            if source.value < self.best_value:
                self.best_value = source.value
                self.best_position = source.position[:]


if __name__ == '__main__':
    algorithm = ArtificialBeeColony(min_x=-5.12, max_x=5.12)
    algorithm.run()
