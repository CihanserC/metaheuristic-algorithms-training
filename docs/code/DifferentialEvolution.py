from math import cos, pi
from random import random, randint, sample


# Rastrigin function: many local minima, the global minimum is f(0, 0) = 0
def f(position):
    return 10 * len(position) + sum(x * x - 10 * cos(2 * pi * x) for x in position)


class DifferentialEvolution:

    # np_size: population size
    # F: differential weight [0, 2] - the scale of the mutation (how far we jump along the difference vector)
    # CR: crossover probability [0, 1] - how many coordinates are taken from the mutant vector
    def __init__(self, min_x, max_x, dimensions=2, np_size=30, F=0.6, CR=0.8, max_iteration=80):
        self.min_x = min_x
        self.max_x = max_x
        self.dimensions = dimensions
        self.F = F
        self.CR = CR
        self.max_iteration = max_iteration
        self.population = [[min_x + (max_x - min_x) * random() for _ in range(dimensions)]
                           for _ in range(np_size)]
        self.fitness = [f(p) for p in self.population]

    def run(self):

        for _ in range(self.max_iteration):
            for i in range(len(self.population)):
                # 1. mutation: DE/rand/1 -> v = x_r1 + F * (x_r2 - x_r3)
                r1, r2, r3 = sample([k for k in range(len(self.population)) if k != i], 3)
                mutant = [self.population[r1][d] + self.F * (self.population[r2][d] - self.population[r3][d])
                          for d in range(self.dimensions)]
                mutant = [min(self.max_x, max(self.min_x, v)) for v in mutant]

                # 2. binomial crossover: at least one coordinate (j_rand) always comes from the mutant
                j_rand = randint(0, self.dimensions - 1)
                trial = [mutant[d] if (random() < self.CR or d == j_rand) else self.population[i][d]
                         for d in range(self.dimensions)]

                # 3. selection: greedy one-to-one competition between the target and the trial vector
                trial_fitness = f(trial)
                if trial_fitness <= self.fitness[i]:
                    self.population[i] = trial
                    self.fitness[i] = trial_fitness

        best = min(range(len(self.population)), key=lambda k: self.fitness[k])
        print('Solution: %s with value: %s' % (self.population[best], self.fitness[best]))


if __name__ == '__main__':
    algorithm = DifferentialEvolution(min_x=-5.12, max_x=5.12)
    algorithm.run()
