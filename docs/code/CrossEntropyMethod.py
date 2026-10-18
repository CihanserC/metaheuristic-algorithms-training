from math import cos, pi, sqrt
from random import random, gauss


# Rastrigin function: many local minima, the global minimum is f(0, 0) = 0
def f(position):
    return 10 * len(position) + sum(x * x - 10 * cos(2 * pi * x) for x in position)


class CrossEntropyMethod:

    # the algorithm keeps a normal distribution (a mean and a standard deviation for every coordinate)
    # rho: the fraction of the samples which are called "elite"
    # smoothing: how fast the distribution follows the elite samples (1 = completely, 0 = never)
    def __init__(self, min_x, max_x, dimensions=2, sample_size=60, rho=0.2, smoothing=0.7, max_iteration=40):
        self.min_x = min_x
        self.max_x = max_x
        self.dimensions = dimensions
        self.sample_size = sample_size
        self.rho = rho
        self.smoothing = smoothing
        self.max_iteration = max_iteration
        self.mean = [(min_x + max_x) / 2 + (random() - 0.5) * 0.4 * (max_x - min_x) for _ in range(dimensions)]
        self.std = [(max_x - min_x) / 3] * dimensions

    def run(self):
        best, best_value = self.mean, float('inf')

        for _ in range(self.max_iteration):
            # 1. sampling from the current distribution
            samples = [[min(self.max_x, max(self.min_x, gauss(self.mean[d], self.std[d])))
                        for d in range(self.dimensions)] for _ in range(self.sample_size)]
            samples.sort(key=f)

            if f(samples[0]) < best_value:
                best, best_value = samples[0], f(samples[0])

            # 2. the elite samples: the best rho * N samples
            elite = samples[:max(2, int(self.rho * self.sample_size))]

            # 3. fit the distribution to the elite samples (minimizing the cross entropy = maximum likelihood)
            for d in range(self.dimensions):
                elite_mean = sum(x[d] for x in elite) / len(elite)
                elite_std = sqrt(sum((x[d] - elite_mean) ** 2 for x in elite) / len(elite)) + 1e-6

                self.mean[d] = self.smoothing * elite_mean + (1 - self.smoothing) * self.mean[d]
                self.std[d] = self.smoothing * elite_std + (1 - self.smoothing) * self.std[d]

        print('Solution: %s with value: %s' % (best, best_value))


if __name__ == '__main__':
    algorithm = CrossEntropyMethod(min_x=-5.12, max_x=5.12)
    algorithm.run()
