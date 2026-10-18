from math import cos, pi
from random import random, gauss, randint


# Rastrigin function: many local minima, the global minimum is f(0, 0) = 0
def f(position):
    return 10 * len(position) + sum(x * x - 10 * cos(2 * pi * x) for x in position)


class MemeticAlgorithm:

    # memetic algorithm = genetic algorithm + local search applied to every offspring
    # ls_steps = 0 gives the plain genetic algorithm (so you can compare the two)
    def __init__(self, min_x, max_x, dimensions=2, population_size=20, mutation_rate=0.3, sigma=0.1,
                 ls_steps=10, ls_step=0.02, max_iteration=40):
        self.min_x = min_x
        self.max_x = max_x
        self.dimensions = dimensions
        self.width = max_x - min_x
        self.population_size = population_size
        self.mutation_rate = mutation_rate
        self.sigma = sigma * self.width
        self.ls_steps = ls_steps
        self.ls_step = ls_step * self.width
        self.max_iteration = max_iteration
        self.population = [[min_x + self.width * random() for _ in range(dimensions)]
                           for _ in range(population_size)]

    def run(self):

        for _ in range(self.max_iteration):
            # elitism: the best individual survives
            next_population = [min(self.population, key=f)]

            while len(next_population) < self.population_size:
                first = self.tournament_selection()
                second = self.tournament_selection()

                child = self.crossover(first, second)
                child = self.mutate(child)

                # the memetic part: the offspring "learns" during its life time (local search)
                # and the improved individual is written back into the population (Lamarckian evolution)
                child = self.local_search(child)
                next_population.append(child)

            self.population = next_population

        best = min(self.population, key=f)
        print('Solution: %s with value: %s' % (best, f(best)))

    # tournament of size 3
    def tournament_selection(self):
        return min((self.population[randint(0, self.population_size - 1)] for _ in range(3)), key=f)

    # arithmetic crossover: a random point on the line between the two parents
    @staticmethod
    def crossover(first, second):
        lam = random()
        return [lam * a + (1 - lam) * b for a, b in zip(first, second)]

    def mutate(self, individual):
        return [self.clamp(x + gauss(0, self.sigma)) if random() < self.mutation_rate else x for x in individual]

    # stochastic hill climbing for a few steps
    def local_search(self, individual):
        for _ in range(self.ls_steps):
            neighbor = [self.clamp(x + gauss(0, self.ls_step)) for x in individual]

            if f(neighbor) < f(individual):
                individual = neighbor

        return individual

    def clamp(self, x):
        return min(self.max_x, max(self.min_x, x))


if __name__ == '__main__':
    algorithm = MemeticAlgorithm(min_x=-5.12, max_x=5.12)
    algorithm.run()
